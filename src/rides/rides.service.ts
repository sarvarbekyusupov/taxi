import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Repository,
  DataSource,
  QueryRunner,
  MoreThanOrEqual,
  ILike,
  
} from "typeorm";
import { Server } from "socket.io";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import { Ride, RideStatus } from "./entities/ride.entity";
import { CreateRideDto } from "./dto/create-ride.dto";
import { UpdateRideDto } from "./dto/update-ride.dto";
import { Client } from "../client/entities/client.entity";
import { Driver } from "../driver/entities/driver.entity";
import { FareCalculationService } from "./fare.calculation.service";
import { redisClient } from "../redis/redis.provider";
import { RedisKeys } from "../constants/redis.keys";
import { safeSet, safeDel, safeGet } from "../redis/redis.safe";
import { SOCKET_IO_SERVER } from "../socket/socket.constants";
import { ConfigService } from "@nestjs/config";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { randomUUID } from "crypto";
import { register } from "prom-client";
import { Inject } from "@nestjs/common";
import { Counter, Histogram } from "prom-client";
import { typedLogger, AppLogger } from "../common/loggers/winston.logger";
import { acquireLock, releaseLock } from "../common/utils/redis-lock";
import {
  rideCreationDuration,
  driverMatchingDuration,
  redisOperationDuration,
  redisOperationCounter,
  rideCreationCounter,
} from "../common/metrics/metrics";
import { TariffType } from "./enums/ride.enums";
import { Car } from "../car/entities/car.entity";
import { Tariff } from "../tariff/entities/tariff.entity";
import { LocationGateway } from "../location/location.gateway";



// Configuration interface with validation
interface RideServiceConfig {
  lockTtlMs: number;
  ackTimeoutMs: number;
  rideStatusTtl: number;
  driverRideTtl: number;
  maxRetries: number;
  maxCandidateDrivers: number;
  circuitBreakerFailureThreshold: number;
  circuitBreakerRecoveryTimeout: number;
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
  redis: {
    retryDelayMs: number;
    maxRetryDelay: number;
  };
}

// Error categories for better handling
enum ServiceErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  DRIVER_NOT_AVAILABLE = "DRIVER_NOT_AVAILABLE",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  RACE_CONDITION = "RACE_CONDITION",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  SYSTEM_ERROR = "SYSTEM_ERROR",
}

class ServiceError extends Error {
  constructor(
    public type: ServiceErrorType,
    message: string,
    public correlationId?: string,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

const MAX_RADIUS_BY_TARIFF: Record<TariffType, number> = {
  [TariffType.ECONOMY]: 10000,
  [TariffType.COMFORT]: 10000,
  [TariffType.BUSINESS]: 10000,
  [TariffType.TIME_BASED]: 10000,
  [TariffType.DELIVERY]: 10000,
};

function getMaxSearchRadius(tariff: TariffType): number {
  return MAX_RADIUS_BY_TARIFF[tariff] ?? 2000;
}


class RedisCircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  private consecutiveSuccesses = 0;

  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 30000,
    private halfOpenMaxCalls = 3,
    private readonly logger: AppLogger
  ) {}

  async execute<T>(
    operation: () => Promise<T>,
    correlationId?: string
  ): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = "HALF_OPEN";
        this.consecutiveSuccesses = 0;
        this.logger?.warn(`Circuit breaker transitioning to HALF_OPEN`, {
          correlationId,
        });
      } else {
        throw new ServiceError(
          ServiceErrorType.EXTERNAL_SERVICE_ERROR,
          "Circuit breaker is OPEN - Redis unavailable",
          correlationId
        );
      }
    }

    if (
      this.state === "HALF_OPEN" &&
      this.consecutiveSuccesses >= this.halfOpenMaxCalls
    ) {
      throw new ServiceError(
        ServiceErrorType.EXTERNAL_SERVICE_ERROR,
        "Circuit breaker HALF_OPEN limit exceeded",
        correlationId
      );
    }

    try {
      const result = await operation();
      this.onSuccess(correlationId);
      return result;
    } catch (error) {
      this.onFailure(error, correlationId);
      throw error;
    }
  }

  private onSuccess(correlationId?: string) {
    this.failureCount = 0;
    this.consecutiveSuccesses++;

    if (
      this.state === "HALF_OPEN" &&
      this.consecutiveSuccesses >= this.halfOpenMaxCalls
    ) {
      this.state = "CLOSED";

      // NestJS Logger uses log() method instead of info()
      this.logger?.info(`Circuit breaker transitioned to CLOSED`, {
        correlationId,
        consecutiveSuccesses: this.consecutiveSuccesses,
        halfOpenMaxCalls: this.halfOpenMaxCalls,
      });
    }
  }

  private onFailure(error: any, correlationId?: string) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.consecutiveSuccesses = 0;

    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      this.logger?.error(
        `Circuit breaker opened after ${this.failureCount} failures`,
        {
          error: error.message,
          correlationId,
        }
      );
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      consecutiveSuccesses: this.consecutiveSuccesses,
    };
  }
}


@Injectable()
export class RidesService {
  private readonly circuitBreaker: RedisCircuitBreaker;
  private readonly config: RideServiceConfig;
  private readonly rateLimiter: RateLimiterRedis;
  private readonly logger = typedLogger;

  constructor(
    @InjectRepository(Ride) private readonly rideRepository: Repository<Ride>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Car)
    private readonly carRepository: Repository<Car>,
    @Inject(SOCKET_IO_SERVER) private readonly socketServer: Server,
    private readonly fareCalculator: FareCalculationService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService
    // @Inject(forwardRef(() => LocationGateway))
    // private readonly locationGateway: LocationGateway
  ) {
    // Load and validate configuration
    this.config = this.loadConfiguration();
    this.validateConfiguration();

    // Initialize circuit breaker
    this.circuitBreaker = new RedisCircuitBreaker(
      this.config.circuitBreakerFailureThreshold,
      this.config.circuitBreakerRecoveryTimeout,
      3, // halfOpenMaxCalls
      this.logger
    );

    // Initialize rate limiter
    this.rateLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: "ride_service_rl",
      points: this.config.rateLimit.maxRequests,
      duration: this.config.rateLimit.windowMs / 1000,
    });
  }

  private loadConfiguration(): RideServiceConfig {
    return {
      lockTtlMs: this.configService.get<number>("RIDE_LOCK_TTL_MS", 10000),
      ackTimeoutMs: this.configService.get<number>("RIDE_ACK_TIMEOUT_MS", 5000),
      rideStatusTtl: this.configService.get<number>("RIDE_STATUS_TTL", 3600),
      driverRideTtl: this.configService.get<number>("DRIVER_RIDE_TTL", 1800),
      maxRetries: this.configService.get<number>("RIDE_MAX_RETRIES", 3),
      maxCandidateDrivers: this.configService.get<number>(
        "MAX_CANDIDATE_DRIVERS",
        10
      ),
      circuitBreakerFailureThreshold: this.configService.get<number>(
        "CB_FAILURE_THRESHOLD",
        5
      ),
      circuitBreakerRecoveryTimeout: this.configService.get<number>(
        "CB_RECOVERY_TIMEOUT",
        30000
      ),
      rateLimit: {
        maxRequests: this.configService.get<number>(
          "RATE_LIMIT_MAX_REQUESTS",
          100
        ),
        windowMs: this.configService.get<number>("RATE_LIMIT_WINDOW_MS", 60000),
      },
      redis: {
        retryDelayMs: this.configService.get<number>(
          "REDIS_RETRY_DELAY_MS",
          1000
        ),
        maxRetryDelay: this.configService.get<number>(
          "REDIS_MAX_RETRY_DELAY",
          5000
        ),
      },
    };
  }

  private validateConfiguration(): void {
    const requiredFields = [
      "lockTtlMs",
      "ackTimeoutMs",
      "rideStatusTtl",
      "driverRideTtl",
      "maxRetries",
      "maxCandidateDrivers",
    ];

    for (const field of requiredFields) {
      if (!this.config[field] || this.config[field] <= 0) {
        throw new Error(
          `Invalid configuration: ${field} must be a positive number`
        );
      }
    }
  }

  // Enhanced validation with detailed error messages
  private async validateCreateRideDto(
    dto: CreateRideDto,
    correlationId: string
  ): Promise<void> {
    const dtoInstance = plainToClass(CreateRideDto, dto);
    const validationErrors = await validate(dtoInstance);

    if (validationErrors.length > 0) {
      const errorMessages = validationErrors
        .map((error) => Object.values(error.constraints || {}).join(", "))
        .join("; ");

      this.logger.warn("Ride creation validation failed", {
        correlationId,
        errors: errorMessages,
        dto: this.sanitizeForLogging(dto),
      });

      throw new ServiceError(
        ServiceErrorType.VALIDATION_ERROR,
        `Validation failed: ${errorMessages}`,
        correlationId,
        { validationErrors }
      );
    }

    // Additional business logic validation
    if (!this.isValidCoordinate(dto.pickup_latitude, dto.pickup_longitude)) {
      throw new ServiceError(
        ServiceErrorType.VALIDATION_ERROR,
        "Invalid pickup coordinates",
        correlationId
      );
    }

    if (
      !this.isValidCoordinate(
        dto.destination_latitude,
        dto.destination_longitude
      )
    ) {
      throw new ServiceError(
        ServiceErrorType.VALIDATION_ERROR,
        "Invalid destination coordinates",
        correlationId
      );
    }

    // Check if client exists and is active
    const client = await this.clientRepository.findOne({
      where: { id: dto.client_id },
    });

    if (!client) {
      throw new ServiceError(
        ServiceErrorType.RESOURCE_NOT_FOUND,
        "Client not found",
        correlationId
      );
    }

    // Add business rules validation here
    if (dto.estimated_distance && dto.estimated_distance > 100000) {
      // 100km limit
      throw new ServiceError(
        ServiceErrorType.VALIDATION_ERROR,
        "Ride distance exceeds maximum allowed",
        correlationId
      );
    }
  }

  private isValidCoordinate(lat: number, lng: number): boolean {
    return (
      typeof lat === "number" &&
      typeof lng === "number" &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180 &&
      !isNaN(lat) &&
      !isNaN(lng)
    );
  }

  private sanitizeForLogging(data: any): any {
    // Remove sensitive information for logging
    const sanitized = { ...data };
    if (sanitized.payment_info) {
      sanitized.payment_info = "[REDACTED]";
    }
    return sanitized;
  }

  // Enhanced retry mechanism with exponential backoff and jitter
  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.maxRetries,
    baseDelay: number = this.config.redis.retryDelayMs,
    correlationId?: string
  ): Promise<T> {
    let lastError: Error | null = null; // Initialize with null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        this.logger.warn(`Operation attempt ${attempt + 1} failed`, {
          correlationId,
          error: error.message,
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
        });

        if (attempt === maxRetries) break;

        // Exponential backoff with jitter
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
          this.config.redis.maxRetryDelay
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // At this point, lastError should always be set, but TypeScript needs assurance
    const errorMessage = lastError?.message ?? "Unknown error occurred";

    throw new ServiceError(
      ServiceErrorType.EXTERNAL_SERVICE_ERROR,
      `Operation failed after ${maxRetries + 1} attempts: ${errorMessage}`,
      correlationId,
      {
        lastError: errorMessage,
        attempts: maxRetries + 1,
      }
    );
  }

  // Enhanced driver matching with atomic operations
  // private async getNearestAvailableDriver(
  //   pickupLat: number,
  //   pickupLng: number,
  //   tariff: TariffType,
  //   correlationId: string
  // ): Promise<{ driverId: number; lockKey: string } | null> {
  //   const timer = driverMatchingDuration.startTimer();
  //     this.logger.info("Starting driver matching process", {
  //       correlationId,
  //       tariff: tariff,
  //       location: { lat: pickupLat, lng: pickupLng },
  //     });

  //   try {
  //     if (!this.isValidCoordinate(pickupLat, pickupLng)) {
  //       throw new ServiceError(
  //         ServiceErrorType.VALIDATION_ERROR,
  //         "Invalid coordinates for driver search",
  //         correlationId
  //       );
  //     }

  //     // QADAM 1: BERILGAN TARIFDA ISHLAY OLADIGAN HAYDOVCHILARNI ANIQLASH
  //     // Bu qadam ma'lumotlar bazasidan (PostgreSQL) ishlaydi
  //     const eligibleCars = await this.Cars.find({
  //       where: {
  //         eligible_tariffs: { name: tariffType }, // 'Tariff' entity'sida 'name' maydoni bo'yicha qidiruv
  //         is_active: true,
  //         driver: { is_active: true }, // Faqat aktiv haydovchilarni olish
  //       },
  //       relations: ["driver"], // Haydovchi ma'lumotlarini birga olish uchun
  //     });

  //     const maxRadius = getMaxSearchRadius(tariff);

  //     this.logger.info("Starting driver search", {
  //       correlationId,
  //       pickupLat,
  //       pickupLng,
  //       tariff,
  //       maxRadius,
  //     });

  //     const nearbyDriverIds = await this.retryOperation(
  //       async () => {
  //         return await this.circuitBreaker.execute(async () => {
  //           return (await redisClient.sendCommand([
  //             "GEORADIUS",
  //             "drivers:geo",
  //             pickupLng.toString(),
  //             pickupLat.toString(),
  //             maxRadius.toString(),
  //             "m",
  //             "COUNT",
  //             this.config.maxCandidateDrivers.toString(),
  //             "ASC",
  //           ])) as string[];
  //         }, correlationId);
  //       },
  //       this.config.maxRetries,
  //       this.config.redis.retryDelayMs,
  //       correlationId
  //     );

  //     if (!nearbyDriverIds?.length) {
  //       this.logger.info("No drivers found in radius", {
  //         correlationId,
  //         maxRadius,
  //         tariff,
  //       });
  //       return null;
  //     }

  //     this.logger.info(`Found ${nearbyDriverIds.length} potential drivers`, {
  //       correlationId,
  //       driverCount: nearbyDriverIds.length,
  //     });

  //     const candidates: { id: number; score: number }[] = [];

  //     // Batch Redis operations for efficiency
  //     const pipeline = redisClient.multi();
  //     const driverIds = nearbyDriverIds
  //       .map((id) => Number(id))
  //       .filter((id) => !isNaN(id));

  //     // Build pipeline for all driver status checks
  //     for (const driverId of driverIds) {
  //       pipeline.get(RedisKeys.driverStatus(driverId));
  //       pipeline.get(RedisKeys.driverRide(driverId));
  //       pipeline.get(RedisKeys.driverAcceptedOffers(driverId));
  //       pipeline.get(RedisKeys.driverTotalOffers(driverId));
  //     }

  //     const results = await this.circuitBreaker.execute(async () => {
  //       return await pipeline.exec();
  //     }, correlationId);

  //     // Process results
  //     for (let i = 0; i < driverIds.length; i++) {
  //       const driverId = driverIds[i];
  //       const baseIndex = i * 4;

  //       const status = results?.[baseIndex]?.[1] as string | null;
  //       const currentRide = results?.[baseIndex + 1]?.[1] as string | null;
  //       const acceptedStr = results?.[baseIndex + 2]?.[1] as string | null;
  //       const totalStr = results?.[baseIndex + 3]?.[1] as string | null;

  //       if (status !== "online" || currentRide) {
  //         continue;
  //       }

  //       const accepted = Number(acceptedStr) || 0;
  //       const total = Number(totalStr) || 0;
  //       const acceptanceRate = total > 0 ? accepted / total : 0.5; // Default to 50% for new drivers
  //       const score = 1 + 2 * acceptanceRate; // Score between 1-3

  //       candidates.push({ id: driverId, score });
  //     }

  //     if (candidates.length === 0) {
  //       this.logger.info("No available drivers found", { correlationId });
  //       return null;
  //     }

  //     // Sort by score (best drivers first)
  //     candidates.sort((a, b) => b.score - a.score);

  //     this.logger.info(`Found ${candidates.length} available drivers`, {
  //       correlationId,
  //       topDriverScore: candidates[0]?.score,
  //     });

  //     // Try to lock the best available driver
  //     for (const candidate of candidates) {
  //       const lockKey = `lock:driver:${candidate.id}`;

  //       try {
  //         const lockAcquired = await acquireLock(
  //           lockKey,
  //           this.config.lockTtlMs,
  //           correlationId
  //         );
  //         if (!lockAcquired) {
  //           this.logger.debug(
  //             `Failed to acquire lock for driver ${candidate.id}`,
  //             {
  //               correlationId,
  //             }
  //           );
  //           continue;
  //         }

  //         // Double-check availability after acquiring lock
  //         const [statusCheck, currentRideCheck] =
  //           await this.circuitBreaker.execute(async () => {
  //             return await Promise.all([
  //               redisClient.get(RedisKeys.driverStatus(candidate.id)),
  //               redisClient.get(RedisKeys.driverRide(candidate.id)),
  //             ]);
  //           }, correlationId);

  //         if (statusCheck === "online" && !currentRideCheck) {
  //           this.logger.info(`Successfully locked driver ${candidate.id}`, {
  //             correlationId,
  //             driverId: candidate.id,
  //             score: candidate.score,
  //           });
  //           return { driverId: candidate.id, lockKey };
  //         } else {
  //           // Release lock if driver is no longer available
  //           await releaseLock(lockKey, correlationId);
  //           this.logger.debug(
  //             `Driver ${candidate.id} became unavailable after lock`,
  //             {
  //               correlationId,
  //             }
  //           );
  //         }
  //       } catch (error) {
  //         this.logger.warn(`Failed to process driver ${candidate.id}`, {
  //           correlationId,
  //           error: error.message,
  //         });
  //         // Try to release lock in case it was acquired
  //         try {
  //           await releaseLock(lockKey, correlationId);
  //         } catch (releaseError) {
  //           this.logger.error(
  //             `Failed to release lock for driver ${candidate.id}`,
  //             {
  //               correlationId,
  //               error: releaseError.message,
  //             }
  //           );
  //         }
  //         continue;
  //       }
  //     }

  //     this.logger.warn("No drivers could be locked", { correlationId });
  //     return null;
  //   } catch (error) {
  //     this.logger.error("Driver matching failed", {
  //       correlationId,
  //       error: error.message,
  //       stack: error.stack,
  //     });
  //     throw error;
  //   } finally {
  //     timer();
  //   }
  // }

  private async debugDriverEligibility(
    tariffType: TariffType,
    correlationId: string
  ) {
    this.logger.info("=== DEBUGGING DRIVER ELIGIBILITY ===", { correlationId });

    try {
      // Check if tables exist (using your actual table names)
      const tablesExist = await this.dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('tariffs', 'cars', 'car_tariffs')
    `);
      this.logger.info("1. Tables existence check:", {
        correlationId,
        existingTables: tablesExist.map((t) => t.table_name),
      });

      // Check tariffs data
      const tariffsCount = await this.dataSource.query(
        "SELECT COUNT(*) FROM tariffs"
      );
      this.logger.info("2. Tariffs count:", {
        correlationId,
        count: parseInt(tariffsCount[0]?.count || "0"),
      });

      if (parseInt(tariffsCount[0]?.count || "0") > 0) {
        const allTariffs = await this.dataSource.query(
          "SELECT id, name, is_active FROM tariffs"
        );
        this.logger.info("2.1. All tariffs:", {
          correlationId,
          tariffs: allTariffs,
        });

        const economyTariff = await this.dataSource.query(
          "SELECT * FROM tariffs WHERE LOWER(name) = LOWER($1)",
          [tariffType]
        );

        this.logger.info("2.2. Economy tariff check:", {
          correlationId,
          tariffType,
          found: economyTariff.length > 0,
          tariff: economyTariff[0] || null,
        });
      }

      // Check junction table
      const junctionExists = await this.dataSource.query(`
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'car_tariffs'
    `);
      this.logger.info("3. Junction table existence:", {
        correlationId,
        exists: parseInt(junctionExists[0]?.count || "0") > 0,
      });

      if (parseInt(junctionExists[0]?.count || "0") > 0) {
        const junctionCount = await this.dataSource.query(
          "SELECT COUNT(*) FROM car_tariffs"
        );
        this.logger.info("3.1. Junction table records:", {
          correlationId,
          count: parseInt(junctionCount[0]?.count || "0"),
        });

        if (parseInt(junctionCount[0]?.count || "0") > 0) {
          const junctionSample = await this.dataSource.query(`
          SELECT ct.car_id, ct.tariff_id, t.name as tariff_name, c.brand, c.model
          FROM car_tariffs ct
          JOIN tariffs t ON t.id = ct.tariff_id
          JOIN cars c ON c.id = ct.car_id
          LIMIT 5
        `);
          this.logger.info("3.2. Junction table sample:", {
            correlationId,
            sample: junctionSample,
          });
        }
      }

      // Check active cars with drivers
      const activeCars = await this.dataSource.query(`
      SELECT c.id, c.driver_id, c.brand, c.model, c.is_active, d.id as driver_real_id, d.is_active as driver_active
      FROM cars c
      LEFT JOIN drivers d ON d.id = c.driver_id
      WHERE c.is_active = true
      LIMIT 5
    `);
      this.logger.info("4. Active cars with drivers:", {
        correlationId,
        cars: activeCars,
      });

      // Check specific query that's failing
      const directQuery = await this.dataSource.query(
        `
      SELECT c.id, c.driver_id, t.name as tariff_name
      FROM cars c
      INNER JOIN car_tariffs ct ON ct.car_id = c.id
      INNER JOIN tariffs t ON t.id = ct.tariff_id
      INNER JOIN drivers d ON d.id = c.driver_id
      WHERE t.name = $1 AND c.is_active = true AND d.is_active = true
    `,
        [tariffType]
      );
      this.logger.info("5. Direct SQL query result:", {
        correlationId,
        tariffType,
        results: directQuery,
      });
    } catch (error) {
      this.logger.error("Debug process failed:", {
        correlationId,
        error: error.message,
        stack: error.stack,
      });
    }
  }

  private async ensureBasicData(correlationId: string) {
    try {
      // Check if we have the economy tariff
      const tariffRepo = this.dataSource.getRepository(Tariff);
      const economyTariff = await tariffRepo.findOne({
        where: { name: ILike("economy") }, // Use ILike for case-insensitive search
      });

      if (!economyTariff) {
        this.logger.warn(
          "Economy tariff not found, this needs to be created first",
          {
            correlationId,
          }
        );
        // You'll need to create tariffs through your admin interface or seeder
        // since tariffs require a service_area_id
        return;
      }

      // Check if we have any car-tariff assignments
      const assignmentCount = await this.dataSource.query(
        "SELECT COUNT(*) FROM car_tariffs"
      );
      const count = parseInt(assignmentCount[0]?.count || "0");

      if (count === 0) {
        this.logger.info("No car-tariff assignments found, creating some...", {
          correlationId,
        });

        // Get all active cars
        const carRepo = this.dataSource.getRepository(Car);
        const activeCars = await carRepo.find({
          where: { is_active: true },
          relations: ["driver"],
        });

        // Assign economy tariff to all active cars
        for (const car of activeCars) {
          if (car.driver) {
            car.eligible_tariffs = [economyTariff];
            await carRepo.save(car);
            this.logger.info(
              `Assigned economy tariff to car ${car.id} (driver ${car.driver.id})`,
              {
                correlationId,
              }
            );
          }
        }
      }
    } catch (error) {
      this.logger.error("Error ensuring basic data:", {
        correlationId,
        error: error.message,
      });
    }
  }

  private async getNearestAvailableDriver(
    pickupLat: number,
    pickupLng: number,
    tariffType: TariffType,
    correlationId: string
  ): Promise<{ driverId: number; lockKey: string } | null> {
    const timer = driverMatchingDuration.startTimer();
    this.logger.info("Starting driver matching process", {
      correlationId,
      tariff: tariffType,
      location: { lat: pickupLat, lng: pickupLng },
    });

    try {
      // Debug first
      await this.debugDriverEligibility(tariffType, correlationId);

      // Ensure we have basic data
      await this.ensureBasicData(correlationId);

      // Koordinatalarni tekshirish
      if (!this.isValidCoordinate(pickupLat, pickupLng)) {
        throw new ServiceError(
          ServiceErrorType.VALIDATION_ERROR,
          "Invalid coordinates for driver search",
          correlationId
        );
      }

      // QADAM 1: Use QueryBuilder for better control
      const eligibleCars = await this.carRepository
        .createQueryBuilder("car")
        .innerJoinAndSelect("car.eligible_tariffs", "tariff")
        .innerJoinAndSelect("car.driver", "driver")
        .where("LOWER(tariff.name) = LOWER(:tariffName)", {
          tariffName: tariffType,
        })
        .andWhere("car.is_active = :carActive", { carActive: true })
        .andWhere("driver.is_active = :driverActive", { driverActive: true })
        .getMany();

      const eligibleDriverIds = eligibleCars
        .map((car) => car.driver?.id)
        .filter((id): id is number => id != null);

      console.log(
        `[DEBUG] STEP 1 (QueryBuilder): Drivers eligible for tariff '${tariffType}'`,
        eligibleDriverIds
      );

      if (eligibleDriverIds.length === 0) {
        // Try alternative approach with raw SQL as fallback
        const rawResults = await this.dataSource.query(
          `
        SELECT DISTINCT c.driver_id
        FROM cars c
        INNER JOIN car_tariffs ct ON ct.car_id = c.id
        INNER JOIN tariffs t ON t.id = ct.tariff_id
        INNER JOIN drivers d ON d.id = c.driver_id
        WHERE LOWER(t.name) = LOWER($1) AND c.is_active = true AND d.is_active = true
        `,
          [tariffType]
        );

        const rawDriverIds = rawResults.map((r) => r.driver_id);

        console.log(
          `[DEBUG] STEP 1 (Raw SQL Fallback): Drivers eligible for tariff '${tariffType}'`,
          rawDriverIds
        );

        if (rawDriverIds.length === 0) {
          this.logger.warn(
            `No drivers are eligible for tariff: ${tariffType}`,
            {
              correlationId,
            }
          );
          return null;
        }
      }

      this.logger.info(
        `Found ${eligibleDriverIds.length} drivers eligible for tariff "${tariffType}"`,
        { correlationId, driverIds: eligibleDriverIds }
      );

      // QADAM 2: REDIS GEOSPATIAL DEBUG AND SEARCH
      const maxRadius = getMaxSearchRadius(tariffType);
      const searchKey = "drivers:geo";

      // === REDIS GEOSPATIAL DEBUG SECTION ===
      this.logger.info("=== REDIS GEOSPATIAL DEBUG ===", {
        correlationId,
        searchKey,
        coordinates: { lat: pickupLat, lng: pickupLng },
        maxRadius,
      });

      try {
        // Check what's actually in Redis geo set
        const allDriversInGeo = (await redisClient.sendCommand([
          "ZRANGE",
          searchKey,
          "0",
          "-1",
          "WITHSCORES",
        ])) as string[];
        this.logger.info("All drivers in geo set:", {
          correlationId,
          driversInGeo: allDriversInGeo,
          count: Array.isArray(allDriversInGeo) ? allDriversInGeo.length : 0,
        });

        // Check specific driver positions for eligible drivers
        for (const driverId of eligibleDriverIds) {
          const driverPosition = (await redisClient.sendCommand([
            "GEOPOS",
            searchKey,
            driverId.toString(),
          ])) as string[][];
          this.logger.info(`Driver ${driverId} position in Redis:`, {
            correlationId,
            driverId,
            position: driverPosition,
          });
        }

        // Test the exact GEORADIUS query with distance info
        const geoRadiusTest = (await redisClient.sendCommand([
          "GEORADIUS",
          searchKey,
          pickupLng.toString(),
          pickupLat.toString(),
          maxRadius.toString(),
          "m",
          "WITHDIST",
          "WITHCOORD",
        ])) as string[][];
        this.logger.info("GEORADIUS test result (with distance and coords):", {
          correlationId,
          result: geoRadiusTest,
          resultCount: Array.isArray(geoRadiusTest) ? geoRadiusTest.length : 0,
          queryUsed: `GEORADIUS ${searchKey} ${pickupLng} ${pickupLat} ${maxRadius} m WITHDIST WITHCOORD`,
        });

        // Also test with a very large radius to see if any drivers exist
        const largeRadiusTest = (await redisClient.sendCommand([
          "GEORADIUS",
          searchKey,
          pickupLng.toString(),
          pickupLat.toString(),
          "100000", // 100km
          "m",
          "WITHDIST",
        ])) as string[][];
        this.logger.info("Large radius test (100km):", {
          correlationId,
          result: largeRadiusTest,
          resultCount: Array.isArray(largeRadiusTest)
            ? largeRadiusTest.length
            : 0,
        });
      } catch (debugError) {
        this.logger.error("Redis debug commands failed:", {
          correlationId,
          error: debugError.message,
          searchKey,
        });
      }

      // === ACTUAL SEARCH ===
      const nearbyDriverIdsStr = await this.retryOperation(async () => {
        return await this.circuitBreaker.execute(async () => {
          const result = (await redisClient.sendCommand([
            "GEORADIUS",
            searchKey,
            pickupLng.toString(),
            pickupLat.toString(),
            maxRadius.toString(),
            "m",
            "COUNT",
            this.config.maxCandidateDrivers.toString(),
            "ASC",
          ])) as string[];

          this.logger.info("GEORADIUS search completed:", {
            correlationId,
            searchKey,
            maxRadius,
            resultCount: result?.length || 0,
            result,
          });

          return result;
        }, correlationId);
      });

      if (!nearbyDriverIdsStr?.length) {
        this.logger.warn("No drivers found in Redis geospatial search", {
          correlationId,
          maxRadius,
          searchKey,
          coordinates: { lat: pickupLat, lng: pickupLng },
          eligibleDriverIds,
        });
        return null;
      }

      const nearbyDriverIds = nearbyDriverIdsStr.map((id) => Number(id));

      console.log(
        `[DEBUG] STEP 2: Drivers found nearby in Redis`,
        nearbyDriverIds
      );

      // QADAM 3: INTERSECTION - Only keep candidates that are both nearby and eligible
      const finalCandidateIds = nearbyDriverIds.filter((id) =>
        eligibleDriverIds.includes(id)
      );

      this.logger.info("Driver filtering results:", {
        correlationId,
        eligibleDriverIds,
        nearbyDriverIds,
        finalCandidateIds,
        intersectionCount: finalCandidateIds.length,
      });

      if (finalCandidateIds.length === 0) {
        this.logger.warn(
          "No eligible drivers found within the geographical radius after intersection",
          {
            correlationId,
            tariff: tariffType,
            eligibleCount: eligibleDriverIds.length,
            nearbyCount: nearbyDriverIds.length,
          }
        );
        return null;
      }

      this.logger.info(
        `Found ${finalCandidateIds.length} final candidates after filtering`,
        { correlationId, candidates: finalCandidateIds }
      );

      // QADAM 4: STATUS CHECK AND SCORING WITH COMPREHENSIVE DEBUG
      const candidatesWithScore: { id: number; score: number }[] = [];
      const pipeline = redisClient.multi();

      // Build pipeline commands
      for (const driverId of finalCandidateIds) {
        pipeline.get(RedisKeys.driverStatus(driverId));
        pipeline.get(RedisKeys.driverRide(driverId));
        pipeline.get(RedisKeys.driverAcceptedOffers(driverId));
        pipeline.get(RedisKeys.driverTotalOffers(driverId));
      }

      const redisResults = await this.circuitBreaker.execute(
        async () => await pipeline.exec(),
        correlationId
      );

      // === COMPREHENSIVE REDIS PIPELINE DEBUG ===
      this.logger.info("=== REDIS PIPELINE DEBUG ===", {
        correlationId,
        finalCandidateIds,
        pipelineCommandsCount: finalCandidateIds.length * 4,
        pipelineCommands: finalCandidateIds.map((driverId) => [
          `GET ${RedisKeys.driverStatus(driverId)}`,
          `GET ${RedisKeys.driverRide(driverId)}`,
          `GET ${RedisKeys.driverAcceptedOffers(driverId)}`,
          `GET ${RedisKeys.driverTotalOffers(driverId)}`,
        ]),
        redisResultsRaw: redisResults,
        redisResultsLength: redisResults?.length || 0,
        redisResultsType: typeof redisResults,
      });

      // Process Redis results with detailed debugging
      // for (let i = 0; i < finalCandidateIds.length; i++) {
      //   const driverId = finalCandidateIds[i];
      //   const baseIndex = i * 4;
      //   const status = redisResults?.[baseIndex]?.[1] as string | null;
      //   const currentRide = redisResults?.[baseIndex + 1]?.[1] as string | null;

      //   // DETAILED DEBUG FOR EACH DRIVER
      //   this.logger.info(
      //     `[DEBUG] Driver ${driverId} Redis pipeline breakdown:`,
      //     {
      //       correlationId,
      //       driverId,
      //       baseIndex,
      //       statusResult: {
      //         fullResult: redisResults?.[baseIndex],
      //         rawValue: redisResults?.[baseIndex]?.[1],
      //         processedValue: status,
      //         expectedKey: RedisKeys.driverStatus(driverId),
      //         valueType: typeof redisResults?.[baseIndex]?.[1],
      //         valueLength: redisResults?.[baseIndex]?.[1]?.length || 0,
      //       },
      //       rideResult: {
      //         fullResult: redisResults?.[baseIndex + 1],
      //         rawValue: redisResults?.[baseIndex + 1]?.[1],
      //         processedValue: currentRide,
      //         expectedKey: RedisKeys.driverRide(driverId),
      //       },
      //       acceptedResult: {
      //         fullResult: redisResults?.[baseIndex + 2],
      //         rawValue: redisResults?.[baseIndex + 2]?.[1],
      //         expectedKey: RedisKeys.driverAcceptedOffers(driverId),
      //       },
      //       totalResult: {
      //         fullResult: redisResults?.[baseIndex + 3],
      //         rawValue: redisResults?.[baseIndex + 3]?.[1],
      //         expectedKey: RedisKeys.driverTotalOffers(driverId),
      //       },
      //     }
      //   );

      //   // Manual Redis check for comparison
      //   try {
      //     const manualStatusCheck = await redisClient.get(
      //       RedisKeys.driverStatus(driverId)
      //     );
      //     this.logger.info(
      //       `[DEBUG] Manual Redis check for driver ${driverId}:`,
      //       {
      //         correlationId,
      //         driverId,
      //         manualStatus: manualStatusCheck,
      //         pipelineStatus: status,
      //         valuesMatch: manualStatusCheck === status,
      //         manualStatusType: typeof manualStatusCheck,
      //         pipelineStatusType: typeof status,
      //       }
      //     );
      //   } catch (manualError) {
      //     this.logger.error(
      //       `Manual Redis check failed for driver ${driverId}:`,
      //       {
      //         correlationId,
      //         driverId,
      //         error: manualError.message,
      //       }
      //     );
      //   }

      //   this.logger.info(`Driver ${driverId} status check:`, {
      //     correlationId,
      //     driverId,
      //     status,
      //     currentRide,
      //     isOnline: status === "online",
      //     isFree: !currentRide,
      //     statusComparison: {
      //       exact: status === "online",
      //       lowercase: status?.toLowerCase() === "online",
      //       trimmed: status?.trim() === "online",
      //       statusString: JSON.stringify(status),
      //       statusCharCodes: status?.split("").map((c) => c.charCodeAt(0)),
      //     },
      //   });

      //   if (status !== "online" || currentRide) {
      //     this.logger.info(`Driver ${driverId} filtered out:`, {
      //       correlationId,
      //       driverId,
      //       reason:
      //         status !== "online"
      //           ? `status is '${status}' (length: ${status?.length}) not 'online'`
      //           : `has active ride: ${currentRide}`,
      //       statusDetails: {
      //         value: status,
      //         type: typeof status,
      //         length: status?.length || 0,
      //         charCodes: status?.split("").map((c) => c.charCodeAt(0)),
      //         isNull: status === null,
      //         isUndefined: status === undefined,
      //         isEmpty: status === "",
      //         jsonStringified: JSON.stringify(status),
      //       },
      //     });
      //     continue; // Only keep online and free drivers
      //   }

      //   const acceptedStr = redisResults?.[baseIndex + 2]?.[1] as string | null;
      //   const totalStr = redisResults?.[baseIndex + 3]?.[1] as string | null;
      //   const accepted = Number(acceptedStr) || 0;
      //   const total = Number(totalStr) || 0;
      //   const acceptanceRate = total > 0 ? accepted / total : 0.5;
      //   const score = 1 + 2 * acceptanceRate;

      //   candidatesWithScore.push({ id: driverId, score });

      //   this.logger.info(`Driver ${driverId} added to candidates:`, {
      //     correlationId,
      //     driverId,
      //     score,
      //     accepted,
      //     total,
      //     acceptanceRate,
      //   });
      // }

      // REPLACE this section in your getNearestAvailableDriver method:

      // Process Redis results with FIXED indexing
      for (let i = 0; i < finalCandidateIds.length; i++) {
        const driverId = finalCandidateIds[i];
        const baseIndex = i * 4;

        // FIX: Use [0] instead of [1] - direct value, not [error, value] structure
        const status = redisResults?.[baseIndex] as string | null;
        const currentRide = redisResults?.[baseIndex + 1] as string | null;
        const acceptedStr = redisResults?.[baseIndex + 2] as string | null;
        const totalStr = redisResults?.[baseIndex + 3] as string | null;

        this.logger.info(`Driver ${driverId} status check:`, {
          correlationId,
          driverId,
          status,
          currentRide,
          isOnline: status === "online",
          isFree: !currentRide,
        });

        if (status !== "online" || currentRide) {
          this.logger.info(`Driver ${driverId} filtered out:`, {
            correlationId,
            driverId,
            reason:
              status !== "online"
                ? `status is '${status}' not 'online'`
                : `has active ride: ${currentRide}`,
          });
          continue; // Only keep online and free drivers
        }

        const accepted = Number(acceptedStr) || 0;
        const total = Number(totalStr) || 0;
        const acceptanceRate = total > 0 ? accepted / total : 0.5;
        const score = 1 + 2 * acceptanceRate;

        candidatesWithScore.push({ id: driverId, score });

        this.logger.info(`Driver ${driverId} added to candidates:`, {
          correlationId,
          driverId,
          score,
          accepted,
          total,
          acceptanceRate,
        });
      }
      if (candidatesWithScore.length === 0) {
        this.logger.info(
          "No available (online and free) drivers found from the final candidates.",
          { correlationId }
        );
        return null;
      }

      // Sort by best score first
      candidatesWithScore.sort((a, b) => b.score - a.score);

      // QADAM 5: LOCK THE BEST CANDIDATE
      for (const candidate of candidatesWithScore) {
        const lockKey = `lock:driver:${candidate.id}`;
        try {
          if (
            !(await acquireLock(lockKey, this.config.lockTtlMs, correlationId))
          ) {
            continue;
          }

          // Double-check after acquiring lock
          const [statusCheck, currentRideCheck] =
            await this.circuitBreaker.execute(async () => {
              return await Promise.all([
                redisClient.get(RedisKeys.driverStatus(candidate.id)),
                redisClient.get(RedisKeys.driverRide(candidate.id)),
              ]);
            }, correlationId);

          if (statusCheck === "online" && !currentRideCheck) {
            this.logger.info(
              `Successfully matched and locked driver ${candidate.id}`,
              {
                correlationId,
                score: candidate.score,
              }
            );
            return { driverId: candidate.id, lockKey };
          } else {
            await releaseLock(lockKey, correlationId);
          }
        } catch (error) {
          this.logger.warn(
            `Error processing candidate driver ${candidate.id}`,
            {
              correlationId,
              error: error.message,
            }
          );
          await releaseLock(lockKey, correlationId).catch(() => {});
          continue;
        }
      }

      this.logger.warn(
        "No drivers could be locked from the available candidates.",
        { correlationId }
      );
      return null;
    } catch (error) {
      this.logger.error("Driver matching process failed", {
        correlationId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    } finally {
      timer();
    }
  }

  private async rollbackRideAssignment(
    driverId: number,
    rideId: number,
    correlationId: string
  ): Promise<void> {
    this.logger.info("Rolling back ride assignment", {
      correlationId,
      driverId,
      rideId,
    });

    try {
      await Promise.allSettled([
        safeDel(RedisKeys.driverRide(driverId)),
        rideId > 0 ? safeDel(RedisKeys.rideStatus(rideId)) : Promise.resolve(),
      ]);
    } catch (error) {
      this.logger.error("Rollback failed", {
        correlationId,
        driverId,
        rideId,
        error: error.message,
      });
    }
  }

  // private async sendRideRequestWithTimeout(
  //   driverId: number,
  //   ride: Ride,
  //   clientId: number,
  //   correlationId: string
  // ): Promise<{ success: boolean; acknowledged: boolean }> {
  //   return new Promise((resolve) => {
  //     let acknowledged = false;

  //     const timeout = setTimeout(() => {
  //       if (!acknowledged) {
  //         this.logger.warn("Driver acknowledgment timeout", {
  //           correlationId,
  //           driverId,
  //           rideId: ride.id,
  //           timeoutMs: this.config.ackTimeoutMs,
  //         });
  //         resolve({ success: false, acknowledged: false });
  //       }
  //     }, this.config.ackTimeoutMs);

  //     this.logger.info("Sending ride request to driver", {
  //       correlationId,
  //       driverId,
  //       rideId: ride.id,
  //     });

  //     this.socketServer.emit(
  //       `rideRequest:${driverId}`,
  //       {
  //         rideId: ride.id,
  //         correlationId,
  //         pickup: {
  //           lat: ride.pickup_latitude,
  //           lng: ride.pickup_longitude,
  //           address: ride.pickup_address,
  //         },
  //         destination: {
  //           lat: ride.destination_latitude,
  //           lng: ride.destination_longitude,
  //           address: ride.destination_address,
  //         },
  //         estimatedFare: ride.estimated_fare,
  //         tariff: ride.tariff_type,
  //         clientId: clientId,
  //         timestamp: new Date().toISOString(),
  //       },
  //       (ack: { success: boolean } | undefined) => {
  //         acknowledged = true;
  //         clearTimeout(timeout);

  //         const result = ack || { success: false };

  //         this.logger.info("Received driver acknowledgment", {
  //           correlationId,
  //           driverId,
  //           rideId: ride.id,
  //           success: result.success,
  //         });

  //         resolve({ ...result, acknowledged: true });
  //       }
  //     );
  //   });
  // }

  // Rate limiting helper

  // Minimal fix: Just add a null check to your existing sendRideRequestWithTimeout:

  private async sendRideRequestWithTimeout(
    driverId: number,
    ride: Ride,
    clientId: number,
    correlationId: string
  ): Promise<{ success: boolean; acknowledged: boolean }> {
    return new Promise((resolve) => {
      let acknowledged = false;
      let responseTimeout: NodeJS.Timeout;

      const cleanup = () => {
        if (responseTimeout) clearTimeout(responseTimeout);
      };

      // Set up timeout
      const timeoutMs = this.config.ackTimeoutMs || 30000; // 30 seconds
      responseTimeout = setTimeout(() => {
        if (!acknowledged) {
          acknowledged = true;
          cleanup();
          this.logger.warn("Driver response timeout", {
            correlationId,
            driverId,
            rideId: ride.id,
            timeoutMs,
          });
          resolve({ success: false, acknowledged: false });
        }
      }, timeoutMs);

      this.logger.info("Sending ride request to driver", {
        correlationId,
        driverId,
        rideId: ride.id,
      });

      // Check if WebSocket server is available
      if (!this.socketServer) {
        this.logger.error("WebSocket server not available", {
          correlationId,
          driverId,
          rideId: ride.id,
        });
        cleanup();
        acknowledged = true;
        resolve({ success: false, acknowledged: false });
        return;
      }

      // Create a unique response channel for this ride
      const responseChannel = `ride:${ride.id}:response`;

      // Set up one-time listener for driver response
      const handleDriverResponse = (response: {
        rideId: number;
        driverId: number;
        accepted: boolean;
        timestamp: number;
      }) => {
        if (
          response.rideId === ride.id &&
          response.driverId === driverId &&
          !acknowledged
        ) {
          acknowledged = true;
          cleanup();

          this.logger.info("Received driver response", {
            correlationId,
            driverId,
            rideId: ride.id,
            accepted: response.accepted,
            responseTime: Date.now() - response.timestamp,
          });

          resolve({ success: response.accepted, acknowledged: true });
        }
      };

      // Listen for driver response
      this.socketServer.on(responseChannel, handleDriverResponse);

      // Send ride request to driver's room
      this.socketServer.to(`driver:${driverId}`).emit("ride:request", {
        rideId: ride.id,
        correlationId,
        pickup: {
          lat: ride.pickup_latitude,
          lng: ride.pickup_longitude,
          address: ride.pickup_address,
        },
        destination: {
          lat: ride.destination_latitude,
          lng: ride.destination_longitude,
          address: ride.destination_address,
        },
        estimatedFare: ride.estimated_fare,
        tariff: ride.tariff_type,
        clientId: clientId,
        timestamp: Date.now(),
        responseChannel, // Tell driver which channel to respond on
        expiresAt: Date.now() + timeoutMs,
      });

      this.logger.info("Ride request sent to driver", {
        correlationId,
        driverId,
        rideId: ride.id,
        room: `driver:${driverId}`,
        responseChannel,
      });
    });
  }

  private async checkRateLimit(
    clientId: number,
    correlationId: string
  ): Promise<void> {
    try {
      await this.rateLimiter.consume(clientId.toString());
    } catch (rateLimitError) {
      this.logger.warn("Rate limit exceeded", {
        correlationId,
        clientId,
        error: rateLimitError,
      });
      throw new ServiceError(
        ServiceErrorType.VALIDATION_ERROR,
        "Rate limit exceeded. Please try again later.",
        correlationId
      );
    }
  }

  // Main create ride method with comprehensive error handling and monitoring
  async create(dto: CreateRideDto, idempotencyKey?: string): Promise<Ride> {
    const correlationId = randomUUID();
    const timer = rideCreationDuration.startTimer();

    let driverLockKey: string | null = null;
    let driverId: number | null = null;
    let queryRunner: QueryRunner | null = null;

    this.logger.info("Starting ride creation", {
      correlationId,
      clientId: dto.client_id,
      tariff: dto.tariff_type,
      idempotencyKey,
    });

    if (idempotencyKey) {
      const cachedRideId = await safeGet(`idempotency:${idempotencyKey}`);
      if (cachedRideId) {
        this.logger.info("Idempotency key already processed", {
          correlationId,
          idempotencyKey,
        });
        const ride = await this.rideRepository.findOne({
          where: { id: +cachedRideId },
        });
        if (ride) return ride;
      }
    }

    try {
      // Step 1: Rate limiting
      await this.checkRateLimit(dto.client_id, correlationId);

      // Step 2: Input validation
      await this.validateCreateRideDto(dto, correlationId);

      // Step 3: Find and lock driver OUTSIDE transaction
      const driverMatch = await this.getNearestAvailableDriver(
        dto.pickup_latitude,
        dto.pickup_longitude,
        dto.tariff_type,
        correlationId
      );

      if (!driverMatch) {
        rideCreationCounter.inc({
          status: "failed",
          tariff_type: dto.tariff_type,
        });
        throw new ServiceError(
          ServiceErrorType.DRIVER_NOT_AVAILABLE,
          "No available drivers nearby",
          correlationId
        );
      }

      driverId = driverMatch.driverId;
      driverLockKey = driverMatch.lockKey;

      this.logger.info("Driver matched and locked", {
        correlationId,
        driverId,
      });

      // Step 4: Execute database transaction with proper rollback
      queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const client = await queryRunner.manager.findOne(Client, {
          where: { id: dto.client_id },
        });

        if (!client) {
          throw new ServiceError(
            ServiceErrorType.RESOURCE_NOT_FOUND,
            "Client not found",
            correlationId
          );
        }

        const driver = await queryRunner.manager.findOne(Driver, {
          where: { id: driverId },
        });

        if (!driver) {
          throw new ServiceError(
            ServiceErrorType.RESOURCE_NOT_FOUND,
            "Matched driver not found in database",
            correlationId
          );
        }

        // Calculate fare
        const estimatedFare = await this.fareCalculator.calculateFare(
          dto.tariff_type,
          dto.service_area_id,
          dto.estimated_distance ?? 0,
          dto.estimated_duration_minutes ?? 0
        );

        // Create ride entity
        const ride = queryRunner.manager.create(Ride, {
          client: { id: dto.client_id },
          driver: { id: driver.id },
          pickup_latitude: dto.pickup_latitude,
          pickup_longitude: dto.pickup_longitude,
          pickup_address: dto.pickup_address,
          destination_latitude: dto.destination_latitude,
          destination_longitude: dto.destination_longitude,
          destination_address: dto.destination_address,
          estimated_distance: dto.estimated_distance,
          estimated_duration_minutes: dto.estimated_duration_minutes,
          estimated_fare: estimatedFare,
          payment_method: dto.payment_method,
          promo_code_id: dto.promo_code_id,
          discount_amount: dto.discount_amount,
          tariff_type: dto.tariff_type ?? TariffType.ECONOMY,
          requested_at: new Date(),
          status: RideStatus.PENDING,
        });

        const savedRide = await queryRunner.manager.save(ride);
        await queryRunner.commitTransaction();

        this.logger.info("Ride saved to database", {
          correlationId,
          rideId: savedRide.id,
        });

        // Step 5: Update Redis state with circuit breaker
        await this.circuitBreaker.execute(async () => {
          const pipeline = redisClient.multi();

          pipeline.set(
            RedisKeys.driverRide(driverId!),
            savedRide.id.toString(),
            { EX: this.config.driverRideTtl }
          );

          pipeline.set(RedisKeys.rideStatus(savedRide.id), RideStatus.PENDING, {
            EX: this.config.rideStatusTtl,
          });

          pipeline.incr(RedisKeys.driverTotalOffers(driverId!));

          await pipeline.exec();
        }, correlationId);

        this.logger.info("Redis state updated", {
          correlationId,
          rideId: savedRide.id,
          driverId,
        });

        // Step 6: Send notification to driver
        const ackResult = await this.sendRideRequestWithTimeout(
          driverId,
          savedRide,
          dto.client_id,
          correlationId
        );

        if (!ackResult.success) {
          // Rollback Redis state
          await this.rollbackRideAssignment(
            driverId,
            savedRide.id,
            correlationId
          );

          if (!ackResult.acknowledged) {
            throw new ServiceError(
              ServiceErrorType.TIMEOUT_ERROR,
              "Driver did not respond in time",
              correlationId
            );
          } else {
            throw new ServiceError(
              ServiceErrorType.DRIVER_NOT_AVAILABLE,
              "Driver rejected the ride request",
              correlationId
            );
          }
        }

        if (idempotencyKey) {
          await safeSet(
            `idempotency:${idempotencyKey}`,
            savedRide.id.toString(),
            86400
          );
        }

        this.logger.info("Ride creation completed successfully", {
          correlationId,
          rideId: savedRide.id,
          driverId,
        });

        rideCreationCounter.inc({
          status: "success",
          tariff_type: dto.tariff_type,
        });
        return savedRide;
      } catch (dbError) {
        if (queryRunner.isTransactionActive) {
          await queryRunner.rollbackTransaction();
          this.logger.warn("Database transaction rolled back", {
            correlationId,
            error: dbError.message,
          });
        }
        throw dbError;
      }
    } catch (error) {
      this.logger.error("Ride creation failed", {
        correlationId,
        error: error.message,
        stack: error.stack,
        driverId,
      });

      // Cleanup Redis state on any error
      if (driverId !== null) {
        await this.rollbackRideAssignment(driverId, 0, correlationId);
      }

      rideCreationCounter.inc({
        status: "failed",
        tariff_type: dto.tariff_type,
      });

      // Re-throw as appropriate exception type
      if (error instanceof ServiceError) {
        throw this.convertServiceErrorToNestException(error);
      }

      throw new InternalServerErrorException(
        "Ride creation failed due to internal error",
        error.message
      );
    } finally {
      // Always release driver lock and close query runner
      if (driverLockKey && driverId) {
        try {
          const released = await releaseLock(driverLockKey, correlationId);
          this.logger.info("Driver lock released", {
            correlationId,
            driverId,
            released,
          });
        } catch (lockError) {
          this.logger.error("Failed to release driver lock", {
            correlationId,
            driverId,
            error: lockError.message,
          });
        }
      }

      if (queryRunner) {
        await queryRunner.release();
      }

      timer();
    }
  }

  // Convert ServiceError to appropriate NestJS exceptions
  private convertServiceErrorToNestException(error: ServiceError): any {
    const context = {
      correlationId: error.correlationId,
      metadata: error.metadata,
    };

    switch (error.type) {
      case ServiceErrorType.VALIDATION_ERROR:
        return new BadRequestException({
          message: error.message,
          error: "Bad Request",
          statusCode: 400,
          ...context,
        });
      case ServiceErrorType.RESOURCE_NOT_FOUND:
        return new NotFoundException({
          message: error.message,
          error: "Not Found",
          statusCode: 404,
          ...context,
        });
      case ServiceErrorType.PERMISSION_DENIED:
        return new ForbiddenException({
          message: error.message,
          error: "Forbidden",
          statusCode: 403,
          ...context,
        });
      case ServiceErrorType.DRIVER_NOT_AVAILABLE:
        return new NotFoundException({
          message: error.message,
          error: "Driver Not Available",
          statusCode: 404,
          ...context,
        });
      case ServiceErrorType.TIMEOUT_ERROR:
        return new BadRequestException({
          message: error.message,
          error: "Timeout Error",
          statusCode: 400,
          ...context,
        });
      default:
        return new InternalServerErrorException({
          message: error.message,
          error: "Internal Server Error",
          statusCode: 500,
          ...context,
        });
    }
  }

  // Enhanced ride state management methods
  async acceptRide(rideId: number, driverId: number): Promise<Ride> {
    const correlationId = randomUUID();

    this.logger.info("Processing ride acceptance", {
      correlationId,
      rideId,
      driverId,
    });

    try {
      const ride = await this.rideRepository.findOne({
        where: { id: rideId },
        relations: ["driver", "client"],
      });

      if (!ride) {
        throw new ServiceError(
          ServiceErrorType.RESOURCE_NOT_FOUND,
          "Ride not found",
          correlationId
        );
      }

      if (ride.status !== RideStatus.PENDING) {
        throw new ServiceError(
          ServiceErrorType.VALIDATION_ERROR,
          `Ride is not available for acceptance. Current status: ${ride.status}`,
          correlationId
        );
      }

      if (ride.driver?.id !== driverId) {
        throw new ServiceError(
          ServiceErrorType.PERMISSION_DENIED,
          "You are not assigned to this ride",
          correlationId
        );
      }

      // Update ride status
      ride.status = RideStatus.ACCEPTED;
      ride.accepted_at = new Date();

      const updatedRide = await this.rideRepository.save(ride);

      // Update Redis state atomically
      await this.circuitBreaker.execute(async () => {
        const pipeline = redisClient.multi();
        pipeline.setEx(
          RedisKeys.rideStatus(rideId),
          this.config.rideStatusTtl,
          RideStatus.ACCEPTED
        );
        pipeline.incr(RedisKeys.driverAcceptedOffers(driverId));
        await pipeline.exec();
      }, correlationId);

      // Notify client
      if (ride.client?.id) {
        this.socketServer.emit(`rideAccepted:${ride.client.id}`, {
          rideId: ride.id,
          driverId: driverId,
          estimatedArrival: ride.estimated_duration_minutes,
          correlationId,
        });
      }

      this.logger.info("Ride accepted successfully", {
        correlationId,
        rideId,
        driverId,
      });

      return updatedRide;
    } catch (error) {
      this.logger.error("Ride acceptance failed", {
        correlationId,
        rideId,
        driverId,
        error: error.message,
      });

      if (error instanceof ServiceError) {
        throw this.convertServiceErrorToNestException(error);
      }
      throw new InternalServerErrorException("Failed to accept ride");
    }
  }

  async startRide(rideId: number, driverId: number): Promise<Ride> {
    const correlationId = randomUUID();

    this.logger.info("Processing ride start", {
      correlationId,
      rideId,
      driverId,
    });

    try {
      const ride = await this.rideRepository.findOne({
        where: { id: rideId },
        relations: ["driver", "client"],
      });

      if (!ride) {
        throw new ServiceError(
          ServiceErrorType.RESOURCE_NOT_FOUND,
          "Ride not found",
          correlationId
        );
      }

      if (ride.driver?.id !== driverId) {
        throw new ServiceError(
          ServiceErrorType.PERMISSION_DENIED,
          "You are not assigned to this ride",
          correlationId
        );
      }

      if (ride.status !== RideStatus.ACCEPTED) {
        throw new ServiceError(
          ServiceErrorType.VALIDATION_ERROR,
          `Ride cannot be started. Current status: ${ride.status}`,
          correlationId
        );
      }

      ride.status = RideStatus.STARTED;
      ride.started_at = new Date();

      const updated = await this.rideRepository.save(ride);

      await this.circuitBreaker.execute(async () => {
        await safeSet(
          RedisKeys.rideStatus(ride.id),
          RideStatus.STARTED,
          this.config.rideStatusTtl
        );
      }, correlationId);

      // Notify client
      if (ride.client?.id) {
        this.socketServer.emit(`rideStarted:${ride.client.id}`, {
          rideId: ride.id,
          startedAt: ride.started_at,
          correlationId,
        });
      }

      this.logger.info("Ride started successfully", {
        correlationId,
        rideId,
        driverId,
      });

      return updated;
    } catch (error) {
      this.logger.error("Ride start failed", {
        correlationId,
        rideId,
        driverId,
        error: error.message,
      });

      if (error instanceof ServiceError) {
        throw this.convertServiceErrorToNestException(error);
      }
      throw new InternalServerErrorException("Failed to start ride");
    }
  }

  async completeRide(
    rideId: number,
    driverId: number,
    completionData?: {
      actualDistance?: number;
      actualDuration?: number;
      finalFare?: number;
    }
  ): Promise<Ride> {
    const correlationId = randomUUID();

    this.logger.info("Processing ride completion", {
      correlationId,
      rideId,
      driverId,
      completionData,
    });

    try {
      const ride = await this.rideRepository.findOne({
        where: { id: rideId },
        relations: ["driver", "client"],
      });

      if (!ride) {
        throw new ServiceError(
          ServiceErrorType.RESOURCE_NOT_FOUND,
          "Ride not found",
          correlationId
        );
      }

      if (ride.driver?.id !== driverId) {
        throw new ServiceError(
          ServiceErrorType.PERMISSION_DENIED,
          "You are not assigned to this ride",
          correlationId
        );
      }

      if (ride.status !== RideStatus.STARTED) {
        throw new ServiceError(
          ServiceErrorType.VALIDATION_ERROR,
          `Ride cannot be completed. Current status: ${ride.status}`,
          correlationId
        );
      }

      // Update ride with completion data
      ride.status = RideStatus.COMPLETED;
      ride.completed_at = new Date();

      if (completionData) {
        if (completionData.actualDistance) {
          ride.actual_distance_km = completionData.actualDistance;
        }
        if (completionData.actualDuration) {
          ride.actual_duration_minutes = completionData.actualDuration;
        }
        if (completionData.finalFare) {
          ride.final_fare = completionData.finalFare;
        }
      }

      const updated = await this.rideRepository.save(ride);

      // Clear driver assignment and update status
      await this.circuitBreaker.execute(async () => {
        const pipeline = redisClient.multi();

        pipeline.del(RedisKeys.driverRide(driverId));

        pipeline.set(RedisKeys.rideStatus(ride.id), RideStatus.COMPLETED, {
          EX: this.config.rideStatusTtl,
        });

        await pipeline.exec();
      }, correlationId);

      // Notify client
      if (ride.client?.id) {
        this.socketServer.emit(`rideCompleted:${ride.client.id}`, {
          rideId: ride.id,
          completedAt: ride.completed_at,
          finalFare: ride.final_fare || ride.estimated_fare,
          correlationId,
        });
      }

      this.logger.info("Ride completed successfully", {
        correlationId,
        rideId,
        driverId,
      });

      return updated;
    } catch (error) {
      this.logger.error("Ride completion failed", {
        correlationId,
        rideId,
        driverId,
        error: error.message,
      });

      if (error instanceof ServiceError) {
        throw this.convertServiceErrorToNestException(error);
      }
      throw new InternalServerErrorException("Failed to complete ride");
    }
  }

  async cancelRide(
    rideId: number,
    userId: number,
    role: "driver" | "client",
    reason?: string
  ): Promise<Ride> {
    const correlationId = randomUUID();

    this.logger.info("Processing ride cancellation", {
      correlationId,
      rideId,
      userId,
      role,
      reason,
    });

    try {
      const ride = await this.rideRepository.findOne({
        where: { id: rideId },
        relations: ["driver", "client"],
      });

      if (!ride) {
        throw new ServiceError(
          ServiceErrorType.RESOURCE_NOT_FOUND,
          "Ride not found",
          correlationId
        );
      }

      const isAuthorized =
        (role === "driver" && ride.driver?.id === userId) ||
        (role === "client" && ride.client?.id === userId);

      if (!isAuthorized) {
        throw new ServiceError(
          ServiceErrorType.PERMISSION_DENIED,
          "You are not allowed to cancel this ride",
          correlationId
        );
      }

      if (
        [RideStatus.COMPLETED, RideStatus.CANCELLED, RideStatus.PAID].includes(
          ride.status
        )
      ) {
        throw new ServiceError(
          ServiceErrorType.VALIDATION_ERROR,
          `Cannot cancel ride with status: ${ride.status}`,
          correlationId
        );
      }

      ride.status = RideStatus.CANCELLED;
      ride.cancelled_at = new Date();
      ride.cancellation_reason = reason || `Cancelled by ${role}`;

      const updated = await this.rideRepository.save(ride);

      // Cleanup Redis state
      await this.circuitBreaker.execute(async () => {
        const pipeline = redisClient.multi();

        if (ride.driver?.id) {
          pipeline.del(RedisKeys.driverRide(ride.driver.id));
        }

        pipeline.set(RedisKeys.rideStatus(ride.id), RideStatus.CANCELLED, {
          EX: 1800,
        });

        await pipeline.exec();
      }, correlationId);

      // Notify the other party
      const notifyUserId =
        role === "driver" ? ride.client?.id : ride.driver?.id;
      if (notifyUserId) {
        this.socketServer.emit(`rideCancelled:${notifyUserId}`, {
          rideId: ride.id,
          cancelledBy: role,
          reason: ride.cancellation_reason,
          cancelledAt: ride.cancelled_at,
          correlationId,
        });
      }

      this.logger.info("Ride cancelled successfully", {
        correlationId,
        rideId,
        userId,
        role,
      });

      return updated;
    } catch (error) {
      this.logger.error("Ride cancellation failed", {
        correlationId,
        rideId,
        userId,
        role,
        error: error.message,
      });

      if (error instanceof ServiceError) {
        throw this.convertServiceErrorToNestException(error);
      }
      throw new InternalServerErrorException("Failed to cancel ride");
    }
  }

  // Query methods with pagination and filtering
  async getClientRides(
    clientId: number,
    options: {
      page?: number;
      limit?: number;
      status?: RideStatus;
      from?: Date;
      to?: Date;
    } = {}
  ): Promise<{ rides: Ride[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, status, from, to } = options;

    const queryBuilder = this.rideRepository
      .createQueryBuilder("ride")
      .leftJoinAndSelect("ride.driver", "driver")
      .where("ride.client_id = :clientId", { clientId })
      .orderBy("ride.requested_at", "DESC");

    if (status) {
      queryBuilder.andWhere("ride.status = :status", { status });
    }

    if (from) {
      queryBuilder.andWhere("ride.requested_at >= :from", { from });
    }

    if (to) {
      queryBuilder.andWhere("ride.requested_at <= :to", { to });
    }

    const [rides, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { rides, total, page, limit };
  }

  async getDriverRides(
    driverId: number,
    options: {
      page?: number;
      limit?: number;
      status?: RideStatus;
      from?: Date;
      to?: Date;
    } = {}
  ): Promise<{ rides: Ride[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, status, from, to } = options;

    const queryBuilder = this.rideRepository
      .createQueryBuilder("ride")
      .leftJoinAndSelect("ride.client", "client")
      .where("ride.driver_id = :driverId", { driverId })
      .orderBy("ride.requested_at", "DESC");

    if (status) {
      queryBuilder.andWhere("ride.status = :status", { status });
    }

    if (from) {
      queryBuilder.andWhere("ride.requested_at >= :from", { from });
    }

    if (to) {
      queryBuilder.andWhere("ride.requested_at <= :to", { to });
    }

    const [rides, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { rides, total, page, limit };
  }

  async getDriverAcceptanceRate(driverId: number): Promise<{
    acceptanceRate: number | null;
    totalOffers: number;
    acceptedOffers: number;
  }> {
    try {
      const [acceptedStr, totalStr] = await this.circuitBreaker.execute(
        async () => {
          return await redisClient.mGet([
            RedisKeys.driverAcceptedOffers(driverId),
            RedisKeys.driverTotalOffers(driverId),
          ]);
        }
      );

      const accepted = parseInt(acceptedStr || "0", 10);
      const total = parseInt(totalStr || "0", 10);
      const acceptanceRate = total > 0 ? accepted / total : null;

      return {
        acceptanceRate,
        totalOffers: total,
        acceptedOffers: accepted,
      };
    } catch (error) {
      this.logger.error("Failed to get driver acceptance rate", {
        driverId,
        error: error.message,
      });
      return {
        acceptanceRate: null,
        totalOffers: 0,
        acceptedOffers: 0,
      };
    }
  }

  // Enhanced health check with detailed status
  async getHealthStatus(): Promise<{
    database: boolean;
    redis: boolean;
    circuitBreaker: any;
    rateLimit: boolean;
    metrics: boolean;
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    version: string;
  }> {
    const health = {
      database: false,
      redis: false,
      circuitBreaker: this.circuitBreaker.getState(),
      rateLimit: false,
      metrics: false,
      status: "unhealthy" as "healthy" | "degraded" | "unhealthy",
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || "unknown",
    };

    // Database health check
    try {
      await this.rideRepository.query("SELECT 1");
      health.database = true;
    } catch (error) {
      this.logger.error("Database health check failed", {
        error: error.message,
      });
    }

    // Redis health check
    try {
      const pingResult = await redisClient.ping();
      health.redis = pingResult === "PONG";
    } catch (error) {
      this.logger.error("Redis health check failed", { error: error.message });
    }

    // Rate limiter health check
    try {
      // Try to get rate limit info for a test key
      await this.rateLimiter.get("health_check");
      health.rateLimit = true;
    } catch (error) {
      this.logger.error("Rate limiter health check failed", {
        error: error.message,
      });
    }

    // Metrics health check
    try {
      const metrics = await register.metrics();
      health.metrics = Boolean(metrics);
    } catch (error) {
      this.logger.error("Metrics health check failed", {
        error: error.message,
      });
    }

    // Determine overall health status
    if (health.database && health.redis && health.rateLimit) {
      health.status = "healthy";
    } else if (health.database) {
      health.status = "degraded"; // Can operate without Redis but with reduced functionality
    }

    return health;
  }

  // Metrics endpoint
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  async getServiceStatistics(): Promise<{
    activeRides: number;
    totalRidesLast24h: number;
    averageResponseTime: number;
    circuitBreakerState: any;
    topTariffs: Array<{ tariff: TariffType; count: number }>;
  }> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

    const activeRides = await this.rideRepository.count({
      where: {
        status: RideStatus.STARTED,
      },
    });

    const totalRidesLast24h = await this.rideRepository.count({
      where: {
        requested_at: MoreThanOrEqual(startTime),
      },
    });

    const tariffStats = await this.rideRepository
      .createQueryBuilder("ride")
      .select("ride.tariff_type", "tariff")
      .addSelect("COUNT(*)", "count")
      .where("ride.requested_at >= :startTime", { startTime })
      .groupBy("ride.tariff_type")
      .orderBy("count", "DESC")
      .limit(5)
      .getRawMany();

    return {
      activeRides,
      totalRidesLast24h,
      averageResponseTime: 0, // Would be calculated from metrics
      circuitBreakerState: this.circuitBreaker.getState(),
      topTariffs: tariffStats.map((stat) => ({
        tariff: stat.tariff,
        count: parseInt(stat.count, 10),
      })),
    };
  }

  // async estimateFare(
  //   pickupLat: number,
  //   pickupLng: number,
  //   destinationLat: number,
  //   destinationLng: number,
  //   carTypeId: number
  // ): Promise<number> {
  //   // In a real application, you would calculate distance and duration
  //   // using a mapping service (e.g., Google Maps Distance Matrix API)
  //   // For this example, we'll use a dummy distance and duration.
  //   const dummyDistance = 10; // km
  //   const dummyDuration = 20; // minutes

  //   return this.fareCalculator.calculateFare(
  //     tariffType,
  //     1, // Assuming a default service area ID for estimation
  //     dummyDistance,
  //     dummyDuration
  //   );
  // }

  // Graceful shutdown
  async onApplicationShutdown(): Promise<void> {
    this.logger.info("Shutting down RidesService");

    // Close Redis connection gracefully
    try {
      await redisClient.quit();
    } catch (error) {
      this.logger.error("Error closing Redis connection", {
        error: error.message,
      });
    }
  }

  // --- 1. Payment Integration and Financial Operations ---

  async processPayment(rideId: number): Promise<any> {
    const correlationId = randomUUID();
    this.logger.info("Processing payment", { correlationId, rideId });

    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    if (!ride) {
      throw new ServiceError(
        ServiceErrorType.RESOURCE_NOT_FOUND,
        "Ride not found",
        correlationId
      );
    }

    // In a real application, you would integrate with a payment gateway like Stripe.
    // For now, we'll simulate a successful payment.
    const paymentGateway = {
      charge: async (amount, currency, source) => {
        return { success: true, transactionId: randomUUID() };
      },
    };

    try {
      const paymentResult = await paymentGateway.charge(
        ride.final_fare,
        "UZS",
        "card_id" // This would come from the client's saved payment methods
      );

      if (paymentResult.success) {
        ride.status = RideStatus.PAID;
        await this.rideRepository.save(ride);
        this.logger.info("Payment successful", { correlationId, rideId });
        return {
          status: "success",
          transactionId: paymentResult.transactionId,
        };
      } else {
        ride.status = RideStatus.PAYMENT_FAILED;
        await this.rideRepository.save(ride);
        this.logger.warn("Payment failed", { correlationId, rideId });
        return { status: "failed" };
      }
    } catch (error) {
      this.logger.error("Payment processing error", {
        correlationId,
        rideId,
        error: error.message,
      });
      throw new ServiceError(
        ServiceErrorType.EXTERNAL_SERVICE_ERROR,
        "Payment gateway error",
        correlationId
      );
    }
  }

  async handleRefund(
    rideId: number,
    amount: number,
    reason: string
  ): Promise<any> {
    const correlationId = randomUUID();
    this.logger.info("Handling refund", {
      correlationId,
      rideId,
      amount,
      reason,
    });

    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    if (!ride) {
      throw new ServiceError(
        ServiceErrorType.RESOURCE_NOT_FOUND,
        "Ride not found",
        correlationId
      );
    }

    // In a real application, you would integrate with a payment gateway like Stripe.
    const paymentGateway = {
      refund: async (transactionId, amount, reason) => {
        return { success: true, refundId: randomUUID() };
      },
    };

    try {
      const refundResult = await paymentGateway.refund(
        "transaction_id", // This would be stored from the original payment
        amount,
        reason
      );

      if (refundResult.success) {
        // Log the refund for auditing
        this.logger.info("Refund successful", {
          correlationId,
          rideId,
          amount,
          reason,
          refundId: refundResult.refundId,
        });
        return { status: "success", refundId: refundResult.refundId };
      } else {
        this.logger.warn("Refund failed", { correlationId, rideId });
        return { status: "failed" };
      }
    } catch (error) {
      this.logger.error("Refund processing error", {
        correlationId,
        rideId,
        error: error.message,
      });
      throw new ServiceError(
        ServiceErrorType.EXTERNAL_SERVICE_ERROR,
        "Payment gateway error",
        correlationId
      );
    }
  }

  async reassignDriver(rideId: number, reason: string): Promise<Ride> {
    const correlationId = randomUUID();
    this.logger.info("Reassigning driver", { correlationId, rideId, reason });

    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
      relations: ["driver"],
    });
    if (!ride) {
      throw new ServiceError(
        ServiceErrorType.RESOURCE_NOT_FOUND,
        "Ride not found",
        correlationId
      );
    }

    const originalDriverId = ride.driver.id;

    // 1. Cancel the ride for the original driver
    await this.cancelRide(rideId, originalDriverId, "driver", reason);

    // 2. Find a new driver, excluding the original one
    const driverMatch = await this.getNearestAvailableDriver(
      ride.pickup_latitude,
      ride.pickup_longitude,
      ride.tariff_type,
      correlationId
    );

    if (!driverMatch) {
      throw new ServiceError(
        ServiceErrorType.DRIVER_NOT_AVAILABLE,
        "No available drivers for reassignment",
        correlationId
      );
    }

    const newDriver = await this.driverRepository.findOne({
      where: { id: driverMatch.driverId },
    });
    if (!newDriver) {
      throw new ServiceError(
        ServiceErrorType.RESOURCE_NOT_FOUND,
        "New driver not found",
        correlationId
      );
    }

    // 3. Update the ride with the new driver
    ride.driver = newDriver;
    ride.status = RideStatus.PENDING;
    const updatedRide = await this.rideRepository.save(ride);

    // Notify the client
    this.socketServer.emit(`rideReassigned:${ride.client.id}`, {
      rideId: ride.id,
      newDriverId: newDriver.id,
    });

    return updatedRide;
  }

  async updateDriverLocation(
    driverId: number,
    lat: number,
    lng: number
  ): Promise<void> {
    const correlationId = randomUUID();
    this.logger.info("Updating driver location", {
      correlationId,
      driverId,
      lat,
      lng,
    });

    await this.circuitBreaker.execute(async () => {
      await redisClient.geoAdd("drivers:geo", {
        longitude: lng,
        latitude: lat,
        member: driverId.toString(),
      });
    }, correlationId);

    const ride = await this.rideRepository.findOne({
      where: { driver: { id: driverId }, status: RideStatus.STARTED },
      relations: ["client"],
    });
    if (ride) {
      this.socketServer.emit(`driverLocationUpdated:${ride.client.id}`, {
        rideId: ride.id,
        lat,
        lng,
      });
    }
  }

  async addSupportForScheduledRides(dto: any): Promise<Ride> {
    const correlationId = randomUUID();
    this.logger.info("Adding support for scheduled rides", {
      correlationId,
      dto,
    });

    const ride: Ride = this.rideRepository.create({
      pickup_latitude: dto.pickup_latitude,
      pickup_longitude: dto.pickup_longitude,
      pickup_address: dto.pickup_address,
      destination_latitude: dto.destination_latitude,
      destination_longitude: dto.destination_longitude,
      destination_address: dto.destination_address,
      estimated_distance: dto.estimated_distance,
      estimated_duration_minutes: dto.estimated_duration_minutes,
      payment_method: dto.payment_method,
      promo_code_id: dto.promo_code_id,
      discount_amount: dto.discount_amount,
      tariff_type: dto.tariff_type,
      client: { id: dto.client_id },
      status: RideStatus.SCHEDULED,
      requested_at: new Date(),
    });

    return this.rideRepository.save(ride);
  }

  async getSystemPerformanceMetrics(): Promise<any> {
    const correlationId = randomUUID();
    this.logger.info("Getting system performance metrics", { correlationId });

    const onlineDrivers = await redisClient.zCard("drivers:geo");
    const pendingRides = await this.rideRepository.count({
      where: { status: RideStatus.PENDING },
    });

    const conversionFunnel = {
      drivers_found: 0, // This would require more detailed metrics
      driver_assigned: 0,
      accepted: 0,
      completed: 0,
    };

    return {
      driverSupplyDemand: {
        onlineDrivers,
        pendingRides,
      },
      conversionFunnel,
      pricingAnalytics: {},
    };
  }

  async findOne(id: number): Promise<Ride | null> {
    return this.rideRepository.findOne({
      where: { id },
      relations: ["client", "driver"],
    });
  }
}
