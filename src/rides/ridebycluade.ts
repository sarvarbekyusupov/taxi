// import {
//   BadRequestException,
//   ForbiddenException,
//   Injectable,
//   NotFoundException,
//   InternalServerErrorException,
//   Logger,
// } from "@nestjs/common";
// import { InjectRepository } from "@nestjs/typeorm";
// import { Repository, DataSource, QueryRunner, MoreThanOrEqual } from "typeorm";
// import { Server } from "socket.io";
// import { validate } from "class-validator";
// import { plainToClass } from "class-transformer";
// import { Ride, RideStatus, TariffType } from "./entities/ride.entity";
// import { CreateRideDto } from "./dto/create-ride.dto";
// import { UpdateRideDto } from "./dto/update-ride.dto";
// import { Client } from "../client/entities/client.entity";
// import { Driver } from "../driver/entities/driver.entity";
// import { FareCalculationService } from "./fare.calculation.service";
// import { redisClient } from "../redis/redis.provider";
// import { RedisKeys } from "../constants/redis.keys";
// import { safeSet, safeDel, safeGet } from "../redis/redis.safe";
// import { SOCKET_IO_SERVER } from "../socket/socket.constants";
// import { ConfigService } from "@nestjs/config";
// import { RateLimiterRedis } from "rate-limiter-flexible";
// import { randomUUID } from "crypto";
// import {  register } from "prom-client";
// import { Inject } from "@nestjs/common";
// import { Counter, Histogram } from "prom-client";
// import { typedLogger, AppLogger } from "../common/loggers/winston.logger";


// // Metrics

// const rideCreationDuration = new Histogram({
//   name: "ride_creation_duration_seconds",
//   help: "Duration of ride creation operations",
//   buckets: [0.1, 0.5, 1, 2, 5],
// });

// const driverMatchingDuration = new Histogram({
//   name: "driver_matching_duration_seconds",
//   help: "Duration of driver matching operations",
//   buckets: [0.1, 0.5, 1, 2, 5],
// });


// // Fix the histogram declaration - use observe() instead of inc()
// const redisOperationDuration = new Histogram({
//   name: 'redis_operation_duration_seconds',
//   help: 'Duration of Redis operations in seconds',
//   labelNames: ['operation']
// });

// // Add the missing counter
// const redisOperationCounter = new Counter({
//   name: 'redis_operations_total',
//   help: 'Total number of Redis operations',
//   labelNames: ['operation', 'status']
// });

// const rideCreationCounter = new Counter({
//   name: "ride_creation_total",
//   help: "Total number of ride creation attempts",
//   labelNames: ["status", "tariff_type"],
// });






// // Register metrics
// register.registerMetric(rideCreationCounter);
// register.registerMetric(rideCreationDuration);
// register.registerMetric(driverMatchingDuration);
// register.registerMetric(redisOperationDuration);

// // Configuration interface with validation
// interface RideServiceConfig {
//   lockTtlMs: number;
//   ackTimeoutMs: number;
//   rideStatusTtl: number;
//   driverRideTtl: number;
//   maxRetries: number;
//   maxCandidateDrivers: number;
//   circuitBreakerFailureThreshold: number;
//   circuitBreakerRecoveryTimeout: number;
//   rateLimit: {
//     maxRequests: number;
//     windowMs: number;
//   };
//   redis: {
//     retryDelayMs: number;
//     maxRetryDelay: number;
//   };
// }

// // Error categories for better handling
// enum ServiceErrorType {
//   VALIDATION_ERROR = "VALIDATION_ERROR",
//   DRIVER_NOT_AVAILABLE = "DRIVER_NOT_AVAILABLE",
//   EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
//   RACE_CONDITION = "RACE_CONDITION",
//   TIMEOUT_ERROR = "TIMEOUT_ERROR",
//   PERMISSION_DENIED = "PERMISSION_DENIED",
//   RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
//   SYSTEM_ERROR = "SYSTEM_ERROR",
// }

// class ServiceError extends Error {
//   constructor(
//     public type: ServiceErrorType,
//     message: string,
//     public correlationId?: string,
//     public metadata?: Record<string, any>
//   ) {
//     super(message);
//     this.name = "ServiceError";
//   }
// }

// const MAX_RADIUS_BY_TARIFF: Record<TariffType, number> = {
//   [TariffType.ECONOMY]: 2000,
//   [TariffType.COMFORT]: 3000,
//   [TariffType.BUSINESS]: 4000,
//   [TariffType.TIME_BASED]: 2500,
//   [TariffType.DELIVERY]: 3000,
// };

// function getMaxSearchRadius(tariff: TariffType): number {
//   return MAX_RADIUS_BY_TARIFF[tariff] ?? 2000;
// }

// // Enhanced Redis operations with monitoring
// async function acquireLock(
//   key: string,
//   ttl: number,
//   correlationId: string
// ): Promise<boolean> {
//   const timer = redisOperationDuration.startTimer({
//     operation: "acquire_lock",
//   });
//   try {
//     const result = await redisClient.set(key, correlationId, {
//       NX: true,
//       PX: ttl,
//     });

//     const startTime = Date.now();
//     const durationInSeconds = (Date.now() - startTime) / 1000;


//     redisOperationDuration.observe(
//       {
//         operation: "acquire_lock",
//       },
//       durationInSeconds
//     );
//     return result === "OK";
//   } catch (error) {
//     const startTime = Date.now();
//     const durationInSeconds = (Date.now() - startTime) / 1000;


//     redisOperationDuration.observe(
//       { operation: "acquire_lock" },
//       durationInSeconds
//     );
//     throw error;
//   } finally {
//     timer();
//   }
// }

// async function releaseLock(
//   key: string,
//   correlationId: string
// ): Promise<boolean> {
//   // Use histogram timer (assuming redisOperationDuration is your histogram)
//   const timer = redisOperationDuration.startTimer({
//     operation: "release_lock",
//   });

//   try {
//     // Use Lua script to ensure we only release our own lock
//     const luaScript = `
//         if redis.call("GET", KEYS[1]) == ARGV[1] then
//           return redis.call("DEL", KEYS[1])
//         else
//           return 0
//         end
//       `;
//     const result = (await redisClient.eval(luaScript, {
//       keys: [key],
//       arguments: [correlationId],
//     })) as number;

//     redisOperationCounter.inc({ operation: "release_lock", status: "success" });
//     return result === 1;
//   } catch (error) {
//     redisOperationCounter.inc({ operation: "release_lock", status: "error" });
//     throw error;
//   } finally {
//     // End the timer
//     timer();
//   }
// }


// // Enhanced Circuit Breaker with monitoring
// class RedisCircuitBreaker {
//   private failureCount = 0;
//   private lastFailureTime = 0;
//   private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
//   private consecutiveSuccesses = 0;

//   constructor(
//     private failureThreshold = 5,
//     private recoveryTimeout = 30000,
//     private halfOpenMaxCalls = 3,
//     private readonly logger: AppLogger
//   ) {}

//   async execute<T>(
//     operation: () => Promise<T>,
//     correlationId?: string
//   ): Promise<T> {
//     if (this.state === "OPEN") {
//       if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
//         this.state = "HALF_OPEN";
//         this.consecutiveSuccesses = 0;
//         this.logger?.warn(`Circuit breaker transitioning to HALF_OPEN`, {
//           correlationId,
//         });
//       } else {
//         throw new ServiceError(
//           ServiceErrorType.EXTERNAL_SERVICE_ERROR,
//           "Circuit breaker is OPEN - Redis unavailable",
//           correlationId
//         );
//       }
//     }

//     if (
//       this.state === "HALF_OPEN" &&
//       this.consecutiveSuccesses >= this.halfOpenMaxCalls
//     ) {
//       throw new ServiceError(
//         ServiceErrorType.EXTERNAL_SERVICE_ERROR,
//         "Circuit breaker HALF_OPEN limit exceeded",
//         correlationId
//       );
//     }

//     try {
//       const result = await operation();
//       this.onSuccess(correlationId);
//       return result;
//     } catch (error) {
//       this.onFailure(error, correlationId);
//       throw error;
//     }
//   }

//   private onSuccess(correlationId?: string) {
//     this.failureCount = 0;
//     this.consecutiveSuccesses++;

//     if (
//       this.state === "HALF_OPEN" &&
//       this.consecutiveSuccesses >= this.halfOpenMaxCalls
//     ) {
//       this.state = "CLOSED";

//       // NestJS Logger uses log() method instead of info()
//       this.logger?.info(`Circuit breaker transitioned to CLOSED`, {
//         correlationId,
//         consecutiveSuccesses: this.consecutiveSuccesses,
//         halfOpenMaxCalls: this.halfOpenMaxCalls,
//       });
//     }
//   }

//   private onFailure(error: any, correlationId?: string) {
//     this.failureCount++;
//     this.lastFailureTime = Date.now();
//     this.consecutiveSuccesses = 0;

//     if (this.failureCount >= this.failureThreshold) {
//       this.state = "OPEN";
//       this.logger?.error(
//         `Circuit breaker opened after ${this.failureCount} failures`,
//         {
//           error: error.message,
//           correlationId,
//         }
//       );
//     }
//   }

//   getState() {
//     return {
//       state: this.state,
//       failureCount: this.failureCount,
//       lastFailureTime: this.lastFailureTime,
//       consecutiveSuccesses: this.consecutiveSuccesses,
//     };
//   }
// }

// @Injectable()
// export class RidesService {
//   private readonly circuitBreaker: RedisCircuitBreaker;
//   private readonly config: RideServiceConfig;
//   private readonly rateLimiter: RateLimiterRedis;

//   constructor(
//     @InjectRepository(Ride) private readonly rideRepository: Repository<Ride>,
//     @InjectRepository(Client)
//     private readonly clientRepository: Repository<Client>,
//     @InjectRepository(Driver)
//     private readonly driverRepository: Repository<Driver>,
//     @Inject(SOCKET_IO_SERVER) private readonly socketServer: Server,
//     private readonly logger: AppLogger = typedLogger,
//     private readonly fareCalculator: FareCalculationService,
//     private readonly dataSource: DataSource,
//     private readonly configService: ConfigService
//   ) {
//     // Load and validate configuration
//     this.config = this.loadConfiguration();
//     this.validateConfiguration();

//     // Initialize circuit breaker
//     this.circuitBreaker = new RedisCircuitBreaker(
//       this.config.circuitBreakerFailureThreshold,
//       this.config.circuitBreakerRecoveryTimeout,
//       3, // halfOpenMaxCalls
//       this.logger
//     );

//     // Initialize rate limiter
//     this.rateLimiter = new RateLimiterRedis({
//       storeClient: redisClient,
//       keyPrefix: "ride_service_rl",
//       points: this.config.rateLimit.maxRequests,
//       duration: this.config.rateLimit.windowMs / 1000,
//     });
//   }

//   private loadConfiguration(): RideServiceConfig {
//     return {
//       lockTtlMs: this.configService.get<number>("RIDE_LOCK_TTL_MS", 10000),
//       ackTimeoutMs: this.configService.get<number>("RIDE_ACK_TIMEOUT_MS", 5000),
//       rideStatusTtl: this.configService.get<number>("RIDE_STATUS_TTL", 3600),
//       driverRideTtl: this.configService.get<number>("DRIVER_RIDE_TTL", 1800),
//       maxRetries: this.configService.get<number>("RIDE_MAX_RETRIES", 3),
//       maxCandidateDrivers: this.configService.get<number>(
//         "MAX_CANDIDATE_DRIVERS",
//         10
//       ),
//       circuitBreakerFailureThreshold: this.configService.get<number>(
//         "CB_FAILURE_THRESHOLD",
//         5
//       ),
//       circuitBreakerRecoveryTimeout: this.configService.get<number>(
//         "CB_RECOVERY_TIMEOUT",
//         30000
//       ),
//       rateLimit: {
//         maxRequests: this.configService.get<number>(
//           "RATE_LIMIT_MAX_REQUESTS",
//           100
//         ),
//         windowMs: this.configService.get<number>("RATE_LIMIT_WINDOW_MS", 60000),
//       },
//       redis: {
//         retryDelayMs: this.configService.get<number>(
//           "REDIS_RETRY_DELAY_MS",
//           1000
//         ),
//         maxRetryDelay: this.configService.get<number>(
//           "REDIS_MAX_RETRY_DELAY",
//           5000
//         ),
//       },
//     };
//   }

//   private validateConfiguration(): void {
//     const requiredFields = [
//       "lockTtlMs",
//       "ackTimeoutMs",
//       "rideStatusTtl",
//       "driverRideTtl",
//       "maxRetries",
//       "maxCandidateDrivers",
//     ];

//     for (const field of requiredFields) {
//       if (!this.config[field] || this.config[field] <= 0) {
//         throw new Error(
//           `Invalid configuration: ${field} must be a positive number`
//         );
//       }
//     }
//   }

//   // Enhanced validation with detailed error messages
//   private async validateCreateRideDto(
//     dto: CreateRideDto,
//     correlationId: string
//   ): Promise<void> {
//     const dtoInstance = plainToClass(CreateRideDto, dto);
//     const validationErrors = await validate(dtoInstance);

//     if (validationErrors.length > 0) {
//       const errorMessages = validationErrors
//         .map((error) => Object.values(error.constraints || {}).join(", "))
//         .join("; ");

//       this.logger.warn("Ride creation validation failed", {
//         correlationId,
//         errors: errorMessages,
//         dto: this.sanitizeForLogging(dto),
//       });

//       throw new ServiceError(
//         ServiceErrorType.VALIDATION_ERROR,
//         `Validation failed: ${errorMessages}`,
//         correlationId,
//         { validationErrors }
//       );
//     }

//     // Additional business logic validation
//     if (!this.isValidCoordinate(dto.pickup_latitude, dto.pickup_longitude)) {
//       throw new ServiceError(
//         ServiceErrorType.VALIDATION_ERROR,
//         "Invalid pickup coordinates",
//         correlationId
//       );
//     }

//     if (
//       !this.isValidCoordinate(
//         dto.destination_latitude,
//         dto.destination_longitude
//       )
//     ) {
//       throw new ServiceError(
//         ServiceErrorType.VALIDATION_ERROR,
//         "Invalid destination coordinates",
//         correlationId
//       );
//     }

//     // Check if client exists and is active
//     const client = await this.clientRepository.findOne({
//       where: { id: dto.client_id },
//     });

//     if (!client) {
//       throw new ServiceError(
//         ServiceErrorType.RESOURCE_NOT_FOUND,
//         "Client not found",
//         correlationId
//       );
//     }

//     // Add business rules validation here
//     if (dto.estimated_distance && dto.estimated_distance > 100000) {
//       // 100km limit
//       throw new ServiceError(
//         ServiceErrorType.VALIDATION_ERROR,
//         "Ride distance exceeds maximum allowed",
//         correlationId
//       );
//     }
//   }

//   private isValidCoordinate(lat: number, lng: number): boolean {
//     return (
//       typeof lat === "number" &&
//       typeof lng === "number" &&
//       lat >= -90 &&
//       lat <= 90 &&
//       lng >= -180 &&
//       lng <= 180 &&
//       !isNaN(lat) &&
//       !isNaN(lng)
//     );
//   }

//   private sanitizeForLogging(data: any): any {
//     // Remove sensitive information for logging
//     const sanitized = { ...data };
//     if (sanitized.payment_info) {
//       sanitized.payment_info = "[REDACTED]";
//     }
//     return sanitized;
//   }

//   // Enhanced retry mechanism with exponential backoff and jitter
//   private async retryOperation<T>(
//     operation: () => Promise<T>,
//     maxRetries: number = this.config.maxRetries,
//     baseDelay: number = this.config.redis.retryDelayMs,
//     correlationId?: string
//   ): Promise<T> {
//     let lastError: Error | null = null; // Initialize with null

//     for (let attempt = 0; attempt <= maxRetries; attempt++) {
//       try {
//         return await operation();
//       } catch (error) {
//         lastError = error as Error;

//         this.logger.warn(`Operation attempt ${attempt + 1} failed`, {
//           correlationId,
//           error: error.message,
//           attempt: attempt + 1,
//           maxRetries: maxRetries + 1,
//         });

//         if (attempt === maxRetries) break;

//         // Exponential backoff with jitter
//         const delay = Math.min(
//           baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
//           this.config.redis.maxRetryDelay
//         );

//         await new Promise((resolve) => setTimeout(resolve, delay));
//       }
//     }

//     // At this point, lastError should always be set, but TypeScript needs assurance
//     const errorMessage = lastError?.message ?? "Unknown error occurred";

//     throw new ServiceError(
//       ServiceErrorType.EXTERNAL_SERVICE_ERROR,
//       `Operation failed after ${maxRetries + 1} attempts: ${errorMessage}`,
//       correlationId,
//       {
//         lastError: errorMessage,
//         attempts: maxRetries + 1,
//       }
//     );
//   }

//   // Enhanced driver matching with atomic operations
//   private async getNearestAvailableDriver(
//     pickupLat: number,
//     pickupLng: number,
//     tariff: TariffType,
//     correlationId: string
//   ): Promise<{ driverId: number; lockKey: string } | null> {
//     const timer = driverMatchingDuration.startTimer();

//     try {
//       if (!this.isValidCoordinate(pickupLat, pickupLng)) {
//         throw new ServiceError(
//           ServiceErrorType.VALIDATION_ERROR,
//           "Invalid coordinates for driver search",
//           correlationId
//         );
//       }

//       const maxRadius = getMaxSearchRadius(tariff);

//       this.logger.info("Starting driver search", {
//         correlationId,
//         pickupLat,
//         pickupLng,
//         tariff,
//         maxRadius,
//       });

//       const nearbyDriverIds = await this.retryOperation(
//         async () => {
//           return await this.circuitBreaker.execute(async () => {
//             return (await redisClient.sendCommand([
//               "GEORADIUS",
//               "drivers:geo",
//               pickupLng.toString(),
//               pickupLat.toString(),
//               maxRadius.toString(),
//               "m",
//               "COUNT",
//               this.config.maxCandidateDrivers.toString(),
//               "ASC",
//             ])) as string[];
//           }, correlationId);
//         },
//         this.config.maxRetries,
//         this.config.redis.retryDelayMs,
//         correlationId
//       );

//       if (!nearbyDriverIds?.length) {
//         this.logger.info("No drivers found in radius", {
//           correlationId,
//           maxRadius,
//           tariff,
//         });
//         return null;
//       }

//       this.logger.info(`Found ${nearbyDriverIds.length} potential drivers`, {
//         correlationId,
//         driverCount: nearbyDriverIds.length,
//       });

//       const candidates: { id: number; score: number }[] = [];

//       // Batch Redis operations for efficiency
//       const pipeline = redisClient.multi();
//       const driverIds = nearbyDriverIds
//         .map((id) => Number(id))
//         .filter((id) => !isNaN(id));

//       // Build pipeline for all driver status checks
//       for (const driverId of driverIds) {
//         pipeline.get(RedisKeys.driverStatus(driverId));
//         pipeline.get(RedisKeys.driverRide(driverId));
//         pipeline.get(RedisKeys.driverAcceptedOffers(driverId));
//         pipeline.get(RedisKeys.driverTotalOffers(driverId));
//       }

//       const results = await this.circuitBreaker.execute(async () => {
//         return await pipeline.exec();
//       }, correlationId);

//       // Process results
//       for (let i = 0; i < driverIds.length; i++) {
//         const driverId = driverIds[i];
//         const baseIndex = i * 4;

//         const status = results?.[baseIndex]?.[1] as string | null;
//         const currentRide = results?.[baseIndex + 1]?.[1] as string | null;
//         const acceptedStr = results?.[baseIndex + 2]?.[1] as string | null;
//         const totalStr = results?.[baseIndex + 3]?.[1] as string | null;

//         if (status !== "online" || currentRide) {
//           continue;
//         }

//         const accepted = Number(acceptedStr) || 0;
//         const total = Number(totalStr) || 0;
//         const acceptanceRate = total > 0 ? accepted / total : 0.5; // Default to 50% for new drivers
//         const score = 1 + 2 * acceptanceRate; // Score between 1-3

//         candidates.push({ id: driverId, score });
//       }

//       if (candidates.length === 0) {
//         this.logger.info("No available drivers found", { correlationId });
//         return null;
//       }

//       // Sort by score (best drivers first)
//       candidates.sort((a, b) => b.score - a.score);

//       this.logger.info(`Found ${candidates.length} available drivers`, {
//         correlationId,
//         topDriverScore: candidates[0]?.score,
//       });

//       // Try to lock the best available driver
//       for (const candidate of candidates) {
//         const lockKey = `lock:driver:${candidate.id}`;

//         try {
//           const lockAcquired = await acquireLock(
//             lockKey,
//             this.config.lockTtlMs,
//             correlationId
//           );
//           if (!lockAcquired) {
//             this.logger.debug(
//               `Failed to acquire lock for driver ${candidate.id}`,
//               {
//                 correlationId,
//               }
//             );
//             continue;
//           }

//           // Double-check availability after acquiring lock
//           const [statusCheck, currentRideCheck] =
//             await this.circuitBreaker.execute(async () => {
//               return await Promise.all([
//                 redisClient.get(RedisKeys.driverStatus(candidate.id)),
//                 redisClient.get(RedisKeys.driverRide(candidate.id)),
//               ]);
//             }, correlationId);

//           if (statusCheck === "online" && !currentRideCheck) {
//             this.logger.info(`Successfully locked driver ${candidate.id}`, {
//               correlationId,
//               driverId: candidate.id,
//               score: candidate.score,
//             });
//             return { driverId: candidate.id, lockKey };
//           } else {
//             // Release lock if driver is no longer available
//             await releaseLock(lockKey, correlationId);
//             this.logger.debug(
//               `Driver ${candidate.id} became unavailable after lock`,
//               {
//                 correlationId,
//               }
//             );
//           }
//         } catch (error) {
//           this.logger.warn(`Failed to process driver ${candidate.id}`, {
//             correlationId,
//             error: error.message,
//           });
//           // Try to release lock in case it was acquired
//           try {
//             await releaseLock(lockKey, correlationId);
//           } catch (releaseError) {
//             this.logger.error(
//               `Failed to release lock for driver ${candidate.id}`,
//               {
//                 correlationId,
//                 error: releaseError.message,
//               }
//             );
//           }
//           continue;
//         }
//       }

//       this.logger.warn("No drivers could be locked", { correlationId });
//       return null;
//     } catch (error) {
//       this.logger.error("Driver matching failed", {
//         correlationId,
//         error: error.message,
//         stack: error.stack,
//       });
//       throw error;
//     } finally {
//       timer();
//     }
//   }

//   private async rollbackRideAssignment(
//     driverId: number,
//     rideId: number,
//     correlationId: string
//   ): Promise<void> {
//     this.logger.info("Rolling back ride assignment", {
//       correlationId,
//       driverId,
//       rideId,
//     });

//     try {
//       await Promise.allSettled([
//         safeDel(RedisKeys.driverRide(driverId)),
//         rideId > 0 ? safeDel(RedisKeys.rideStatus(rideId)) : Promise.resolve(),
//       ]);
//     } catch (error) {
//       this.logger.error("Rollback failed", {
//         correlationId,
//         driverId,
//         rideId,
//         error: error.message,
//       });
//     }
//   }

//   private async sendRideRequestWithTimeout(
//     driverId: number,
//     ride: Ride,
//     clientId: number,
//     correlationId: string
//   ): Promise<{ success: boolean; acknowledged: boolean }> {
//     return new Promise((resolve) => {
//       let acknowledged = false;

//       const timeout = setTimeout(() => {
//         if (!acknowledged) {
//           this.logger.warn("Driver acknowledgment timeout", {
//             correlationId,
//             driverId,
//             rideId: ride.id,
//             timeoutMs: this.config.ackTimeoutMs,
//           });
//           resolve({ success: false, acknowledged: false });
//         }
//       }, this.config.ackTimeoutMs);

//       this.logger.info("Sending ride request to driver", {
//         correlationId,
//         driverId,
//         rideId: ride.id,
//       });

//       this.socketServer.emit(
//         `rideRequest:${driverId}`,
//         {
//           rideId: ride.id,
//           correlationId,
//           pickup: {
//             lat: ride.pickup_latitude,
//             lng: ride.pickup_longitude,
//             address: ride.pickup_address,
//           },
//           destination: {
//             lat: ride.destination_latitude,
//             lng: ride.destination_longitude,
//             address: ride.destination_address,
//           },
//           estimatedFare: ride.estimated_fare,
//           tariff: ride.tariff_type,
//           clientId: clientId,
//           timestamp: new Date().toISOString(),
//         },
//         (ack: { success: boolean } | undefined) => {
//           acknowledged = true;
//           clearTimeout(timeout);

//           const result = ack || { success: false };

//           this.logger.info("Received driver acknowledgment", {
//             correlationId,
//             driverId,
//             rideId: ride.id,
//             success: result.success,
//           });

//           resolve({ ...result, acknowledged: true });
//         }
//       );
//     });
//   }

//   // Rate limiting helper
//   private async checkRateLimit(
//     clientId: number,
//     correlationId: string
//   ): Promise<void> {
//     try {
//       await this.rateLimiter.consume(clientId.toString());
//     } catch (rateLimitError) {
//       this.logger.warn("Rate limit exceeded", {
//         correlationId,
//         clientId,
//         error: rateLimitError,
//       });
//       throw new ServiceError(
//         ServiceErrorType.VALIDATION_ERROR,
//         "Rate limit exceeded. Please try again later.",
//         correlationId
//       );
//     }
//   }

//   // Main create ride method with comprehensive error handling and monitoring
//   async create(dto: CreateRideDto): Promise<Ride> {
//     const correlationId = randomUUID();
//     const timer = rideCreationDuration.startTimer();

//     let driverLockKey: string | null = null;
//     let driverId: number | null = null;
//     let queryRunner: QueryRunner | null = null;

//     this.logger.info("Starting ride creation", {
//       correlationId,
//       clientId: dto.client_id,
//       tariff: dto.tariff_type,
//     });

//     try {
//       // Step 1: Rate limiting
//       await this.checkRateLimit(dto.client_id, correlationId);

//       // Step 2: Input validation
//       await this.validateCreateRideDto(dto, correlationId);

//       // Step 3: Find and lock driver OUTSIDE transaction
//       const driverMatch = await this.getNearestAvailableDriver(
//         dto.pickup_latitude,
//         dto.pickup_longitude,
//         dto.tariff_type,
//         correlationId
//       );

//       if (!driverMatch) {
//         rideCreationCounter.inc({
//           status: "failed",
//           tariff_type: dto.tariff_type,
//         });
//         throw new ServiceError(
//           ServiceErrorType.DRIVER_NOT_AVAILABLE,
//           "No available drivers nearby",
//           correlationId
//         );
//       }

//       driverId = driverMatch.driverId;
//       driverLockKey = driverMatch.lockKey;

//       this.logger.info("Driver matched and locked", {
//         correlationId,
//         driverId,
//       });

//       // Step 4: Execute database transaction with proper rollback
//       queryRunner = this.dataSource.createQueryRunner();
//       await queryRunner.connect();
//       await queryRunner.startTransaction();

//       try {
//         const client = await queryRunner.manager.findOne(Client, {
//           where: { id: dto.client_id },
//         });

//         if (!client) {
//           throw new ServiceError(
//             ServiceErrorType.RESOURCE_NOT_FOUND,
//             "Client not found",
//             correlationId
//           );
//         }

//         const driver = await queryRunner.manager.findOne(Driver, {
//           where: { id: driverId },
//         });

//         if (!driver) {
//           throw new ServiceError(
//             ServiceErrorType.RESOURCE_NOT_FOUND,
//             "Matched driver not found in database",
//             correlationId
//           );
//         }

//         // Calculate fare
//         const estimatedFare = await this.fareCalculator.calculateFare(
//           dto.tariff_type,
//           dto.service_area_id,
//           dto.estimated_distance ?? 0,
//           dto.estimated_duration_minutes ?? 0
//         );

//         // Create ride entity
//         const ride = queryRunner.manager.create(Ride, {
//           client: { id: dto.client_id },
//           driver: { id: driver.id },
//           pickup_latitude: dto.pickup_latitude,
//           pickup_longitude: dto.pickup_longitude,
//           pickup_address: dto.pickup_address,
//           destination_latitude: dto.destination_latitude,
//           destination_longitude: dto.destination_longitude,
//           destination_address: dto.destination_address,
//           estimated_distance: dto.estimated_distance,
//           estimated_duration_minutes: dto.estimated_duration_minutes,
//           estimated_fare: estimatedFare,
//           payment_method: dto.payment_method,
//           promo_code_id: dto.promo_code_id,
//           discount_amount: dto.discount_amount,
//           tariff_type: dto.tariff_type ?? TariffType.ECONOMY,
//           requested_at: new Date(),
//           status: RideStatus.PENDING,
//         });

//         const savedRide = await queryRunner.manager.save(ride);
//         await queryRunner.commitTransaction();

//         this.logger.info("Ride saved to database", {
//           correlationId,
//           rideId: savedRide.id,
//         });

//         // Step 5: Update Redis state with circuit breaker
//         await this.circuitBreaker.execute(async () => {
//           const pipeline = redisClient.multi();

//           pipeline.set(
//             RedisKeys.driverRide(driverId!),
//             savedRide.id.toString(),
//             { EX: this.config.driverRideTtl }
//           );

//           pipeline.set(RedisKeys.rideStatus(savedRide.id), RideStatus.PENDING, {
//             EX: this.config.rideStatusTtl,
//           });

//           pipeline.incr(RedisKeys.driverTotalOffers(driverId!));

//           await pipeline.exec();
//         }, correlationId);
        

//         this.logger.info("Redis state updated", {
//           correlationId,
//           rideId: savedRide.id,
//           driverId,
//         });

//         // Step 6: Send notification to driver
//         const ackResult = await this.sendRideRequestWithTimeout(
//           driverId,
//           savedRide,
//           dto.client_id,
//           correlationId
//         );

//         if (!ackResult.success) {
//           // Rollback Redis state
//           await this.rollbackRideAssignment(
//             driverId,
//             savedRide.id,
//             correlationId
//           );

//           if (!ackResult.acknowledged) {
//             throw new ServiceError(
//               ServiceErrorType.TIMEOUT_ERROR,
//               "Driver did not respond in time",
//               correlationId
//             );
//           } else {
//             throw new ServiceError(
//               ServiceErrorType.DRIVER_NOT_AVAILABLE,
//               "Driver rejected the ride request",
//               correlationId
//             );
//           }
//         }

//         this.logger.info("Ride creation completed successfully", {
//           correlationId,
//           rideId: savedRide.id,
//           driverId,
//         });

//         rideCreationCounter.inc({
//           status: "success",
//           tariff_type: dto.tariff_type,
//         });
//         return savedRide;
//       } catch (dbError) {
//         if (queryRunner.isTransactionActive) {
//           await queryRunner.rollbackTransaction();
//           this.logger.warn("Database transaction rolled back", {
//             correlationId,
//             error: dbError.message,
//           });
//         }
//         throw dbError;
//       }
//     } catch (error) {
//       this.logger.error("Ride creation failed", {
//         correlationId,
//         error: error.message,
//         stack: error.stack,
//         driverId,
//       });

//       // Cleanup Redis state on any error
//       if (driverId !== null) {
//         await this.rollbackRideAssignment(driverId, 0, correlationId);
//       }

//       rideCreationCounter.inc({
//         status: "failed",
//         tariff_type: dto.tariff_type,
//       });

//       // Re-throw as appropriate exception type
//       if (error instanceof ServiceError) {
//         throw this.convertServiceErrorToNestException(error);
//       }

//       throw new InternalServerErrorException(
//         "Ride creation failed due to internal error",
//         error.message
//       );
//     } finally {
//       // Always release driver lock and close query runner
//       if (driverLockKey && driverId) {
//         try {
//           const released = await releaseLock(driverLockKey, correlationId);
//           this.logger.info("Driver lock released", {
//             correlationId,
//             driverId,
//             released,
//           });
//         } catch (lockError) {
//           this.logger.error("Failed to release driver lock", {
//             correlationId,
//             driverId,
//             error: lockError.message,
//           });
//         }
//       }

//       if (queryRunner) {
//         await queryRunner.release();
//       }

//       timer();
//     }
//   }

//   // Convert ServiceError to appropriate NestJS exceptions
//   private convertServiceErrorToNestException(error: ServiceError): any {
//     const context = {
//       correlationId: error.correlationId,
//       metadata: error.metadata,
//     };

//     switch (error.type) {
//       case ServiceErrorType.VALIDATION_ERROR:
//         return new BadRequestException({
//           message: error.message,
//           error: "Bad Request",
//           statusCode: 400,
//           ...context,
//         });
//       case ServiceErrorType.RESOURCE_NOT_FOUND:
//         return new NotFoundException({
//           message: error.message,
//           error: "Not Found",
//           statusCode: 404,
//           ...context,
//         });
//       case ServiceErrorType.PERMISSION_DENIED:
//         return new ForbiddenException({
//           message: error.message,
//           error: "Forbidden",
//           statusCode: 403,
//           ...context,
//         });
//       case ServiceErrorType.DRIVER_NOT_AVAILABLE:
//         return new NotFoundException({
//           message: error.message,
//           error: "Driver Not Available",
//           statusCode: 404,
//           ...context,
//         });
//       case ServiceErrorType.TIMEOUT_ERROR:
//         return new BadRequestException({
//           message: error.message,
//           error: "Timeout Error",
//           statusCode: 400,
//           ...context,
//         });
//       default:
//         return new InternalServerErrorException({
//           message: error.message,
//           error: "Internal Server Error",
//           statusCode: 500,
//           ...context,
//         });
//     }
//   }

//   // Enhanced ride state management methods
//   async acceptRide(rideId: number, driverId: number): Promise<Ride> {
//     const correlationId = randomUUID();

//     this.logger.info("Processing ride acceptance", {
//       correlationId,
//       rideId,
//       driverId,
//     });

//     try {
//       const ride = await this.rideRepository.findOne({
//         where: { id: rideId },
//         relations: ["driver", "client"],
//       });

//       if (!ride) {
//         throw new ServiceError(
//           ServiceErrorType.RESOURCE_NOT_FOUND,
//           "Ride not found",
//           correlationId
//         );
//       }

//       if (ride.status !== RideStatus.PENDING) {
//         throw new ServiceError(
//           ServiceErrorType.VALIDATION_ERROR,
//           `Ride is not available for acceptance. Current status: ${ride.status}`,
//           correlationId
//         );
//       }

//       if (ride.driver?.id !== driverId) {
//         throw new ServiceError(
//           ServiceErrorType.PERMISSION_DENIED,
//           "You are not assigned to this ride",
//           correlationId
//         );
//       }

//       // Update ride status
//       ride.status = RideStatus.ACCEPTED;
//       ride.accepted_at = new Date();

//       const updatedRide = await this.rideRepository.save(ride);

//       // Update Redis state atomically
//       await this.circuitBreaker.execute(async () => {
//         const pipeline = redisClient.multi();
//         pipeline.setEx(
//           RedisKeys.rideStatus(rideId),
//           this.config.rideStatusTtl,
//           RideStatus.ACCEPTED
//         );
//         pipeline.incr(RedisKeys.driverAcceptedOffers(driverId));
//         await pipeline.exec();
//       }, correlationId);

//       // Notify client
//       if (ride.client?.id) {
//         this.socketServer.emit(`rideAccepted:${ride.client.id}`, {
//           rideId: ride.id,
//           driverId: driverId,
//           estimatedArrival: ride.estimated_duration_minutes,
//           correlationId,
//         });
//       }

//       this.logger.info("Ride accepted successfully", {
//         correlationId,
//         rideId,
//         driverId,
//       });

//       return updatedRide;
//     } catch (error) {
//       this.logger.error("Ride acceptance failed", {
//         correlationId,
//         rideId,
//         driverId,
//         error: error.message,
//       });

//       if (error instanceof ServiceError) {
//         throw this.convertServiceErrorToNestException(error);
//       }
//       throw new InternalServerErrorException("Failed to accept ride");
//     }
//   }

//   async startRide(rideId: number, driverId: number): Promise<Ride> {
//     const correlationId = randomUUID();

//     this.logger.info("Processing ride start", {
//       correlationId,
//       rideId,
//       driverId,
//     });

//     try {
//       const ride = await this.rideRepository.findOne({
//         where: { id: rideId },
//         relations: ["driver", "client"],
//       });

//       if (!ride) {
//         throw new ServiceError(
//           ServiceErrorType.RESOURCE_NOT_FOUND,
//           "Ride not found",
//           correlationId
//         );
//       }

//       if (ride.driver?.id !== driverId) {
//         throw new ServiceError(
//           ServiceErrorType.PERMISSION_DENIED,
//           "You are not assigned to this ride",
//           correlationId
//         );
//       }

//       if (ride.status !== RideStatus.ACCEPTED) {
//         throw new ServiceError(
//           ServiceErrorType.VALIDATION_ERROR,
//           `Ride cannot be started. Current status: ${ride.status}`,
//           correlationId
//         );
//       }

//       ride.status = RideStatus.STARTED;
//       ride.started_at = new Date();

//       const updated = await this.rideRepository.save(ride);

//       await this.circuitBreaker.execute(async () => {
//         await safeSet(
//           RedisKeys.rideStatus(ride.id),
//           RideStatus.STARTED,
//           this.config.rideStatusTtl
//         );
//       }, correlationId);

//       // Notify client
//       if (ride.client?.id) {
//         this.socketServer.emit(`rideStarted:${ride.client.id}`, {
//           rideId: ride.id,
//           startedAt: ride.started_at,
//           correlationId,
//         });
//       }

//       this.logger.info("Ride started successfully", {
//         correlationId,
//         rideId,
//         driverId,
//       });

//       return updated;
//     } catch (error) {
//       this.logger.error("Ride start failed", {
//         correlationId,
//         rideId,
//         driverId,
//         error: error.message,
//       });

//       if (error instanceof ServiceError) {
//         throw this.convertServiceErrorToNestException(error);
//       }
//       throw new InternalServerErrorException("Failed to start ride");
//     }
//   }

//   async completeRide(
//     rideId: number,
//     driverId: number,
//     completionData?: {
//       actualDistance?: number;
//       actualDuration?: number;
//       finalFare?: number;
//     }
//   ): Promise<Ride> {
//     const correlationId = randomUUID();

//     this.logger.info("Processing ride completion", {
//       correlationId,
//       rideId,
//       driverId,
//       completionData,
//     });

//     try {
//       const ride = await this.rideRepository.findOne({
//         where: { id: rideId },
//         relations: ["driver", "client"],
//       });

//       if (!ride) {
//         throw new ServiceError(
//           ServiceErrorType.RESOURCE_NOT_FOUND,
//           "Ride not found",
//           correlationId
//         );
//       }

//       if (ride.driver?.id !== driverId) {
//         throw new ServiceError(
//           ServiceErrorType.PERMISSION_DENIED,
//           "You are not assigned to this ride",
//           correlationId
//         );
//       }

//       if (ride.status !== RideStatus.STARTED) {
//         throw new ServiceError(
//           ServiceErrorType.VALIDATION_ERROR,
//           `Ride cannot be completed. Current status: ${ride.status}`,
//           correlationId
//         );
//       }

//       // Update ride with completion data
//       ride.status = RideStatus.COMPLETED;
//       ride.completed_at = new Date();

//       if (completionData) {
//         if (completionData.actualDistance) {
//           ride.actual_distance_km = completionData.actualDistance;
//         }
//         if (completionData.actualDuration) {
//           ride.actual_duration_minutes = completionData.actualDuration;
//         }
//         if (completionData.finalFare) {
//           ride.final_fare = completionData.finalFare;
//         }
//       }

//       const updated = await this.rideRepository.save(ride);

//       // Clear driver assignment and update status
//       await this.circuitBreaker.execute(async () => {
//         const pipeline = redisClient.multi();

//         pipeline.del(RedisKeys.driverRide(driverId));

//         pipeline.set(RedisKeys.rideStatus(ride.id), RideStatus.COMPLETED, {
//           EX: this.config.rideStatusTtl,
//         });

//         await pipeline.exec();
//       }, correlationId);
      

//       // Notify client
//       if (ride.client?.id) {
//         this.socketServer.emit(`rideCompleted:${ride.client.id}`, {
//           rideId: ride.id,
//           completedAt: ride.completed_at,
//           finalFare: ride.final_fare || ride.estimated_fare,
//           correlationId,
//         });
//       }

//       this.logger.info("Ride completed successfully", {
//         correlationId,
//         rideId,
//         driverId,
//       });

//       return updated;
//     } catch (error) {
//       this.logger.error("Ride completion failed", {
//         correlationId,
//         rideId,
//         driverId,
//         error: error.message,
//       });

//       if (error instanceof ServiceError) {
//         throw this.convertServiceErrorToNestException(error);
//       }
//       throw new InternalServerErrorException("Failed to complete ride");
//     }
//   }

//   async cancelRide(
//     rideId: number,
//     userId: number,
//     role: "driver" | "client",
//     reason?: string
//   ): Promise<Ride> {
//     const correlationId = randomUUID();

//     this.logger.info("Processing ride cancellation", {
//       correlationId,
//       rideId,
//       userId,
//       role,
//       reason,
//     });

//     try {
//       const ride = await this.rideRepository.findOne({
//         where: { id: rideId },
//         relations: ["driver", "client"],
//       });

//       if (!ride) {
//         throw new ServiceError(
//           ServiceErrorType.RESOURCE_NOT_FOUND,
//           "Ride not found",
//           correlationId
//         );
//       }

//       const isAuthorized =
//         (role === "driver" && ride.driver?.id === userId) ||
//         (role === "client" && ride.client?.id === userId);

//       if (!isAuthorized) {
//         throw new ServiceError(
//           ServiceErrorType.PERMISSION_DENIED,
//           "You are not allowed to cancel this ride",
//           correlationId
//         );
//       }

//       if (
//         [RideStatus.COMPLETED, RideStatus.CANCELLED, RideStatus.PAID].includes(
//           ride.status
//         )
//       ) {
//         throw new ServiceError(
//           ServiceErrorType.VALIDATION_ERROR,
//           `Cannot cancel ride with status: ${ride.status}`,
//           correlationId
//         );
//       }

//       ride.status = RideStatus.CANCELLED;
//       ride.cancelled_at = new Date();
//       ride.cancellation_reason = reason || `Cancelled by ${role}`;

//       const updated = await this.rideRepository.save(ride);

//       // Cleanup Redis state
//       await this.circuitBreaker.execute(async () => {
//         const pipeline = redisClient.multi();

//         if (ride.driver?.id) {
//           pipeline.del(RedisKeys.driverRide(ride.driver.id));
//         }

//         pipeline.set(RedisKeys.rideStatus(ride.id), RideStatus.CANCELLED, {
//           EX: 1800,
//         });

//         await pipeline.exec();
//       }, correlationId);

//       // Notify the other party
//       const notifyUserId =
//         role === "driver" ? ride.client?.id : ride.driver?.id;
//       if (notifyUserId) {
//         this.socketServer.emit(`rideCancelled:${notifyUserId}`, {
//           rideId: ride.id,
//           cancelledBy: role,
//           reason: ride.cancellation_reason,
//           cancelledAt: ride.cancelled_at,
//           correlationId,
//         });
//       }

//       this.logger.info("Ride cancelled successfully", {
//         correlationId,
//         rideId,
//         userId,
//         role,
//       });

//       return updated;
//     } catch (error) {
//       this.logger.error("Ride cancellation failed", {
//         correlationId,
//         rideId,
//         userId,
//         role,
//         error: error.message,
//       });

//       if (error instanceof ServiceError) {
//         throw this.convertServiceErrorToNestException(error);
//       }
//       throw new InternalServerErrorException("Failed to cancel ride");
//     }
//   }

//   // Query methods with pagination and filtering
//   async getClientRides(
//     clientId: number,
//     options: {
//       page?: number;
//       limit?: number;
//       status?: RideStatus;
//       from?: Date;
//       to?: Date;
//     } = {}
//   ): Promise<{ rides: Ride[]; total: number; page: number; limit: number }> {
//     const { page = 1, limit = 20, status, from, to } = options;

//     const queryBuilder = this.rideRepository
//       .createQueryBuilder("ride")
//       .leftJoinAndSelect("ride.driver", "driver")
//       .where("ride.client_id = :clientId", { clientId })
//       .orderBy("ride.requested_at", "DESC");

//     if (status) {
//       queryBuilder.andWhere("ride.status = :status", { status });
//     }

//     if (from) {
//       queryBuilder.andWhere("ride.requested_at >= :from", { from });
//     }

//     if (to) {
//       queryBuilder.andWhere("ride.requested_at <= :to", { to });
//     }

//     const [rides, total] = await queryBuilder
//       .skip((page - 1) * limit)
//       .take(limit)
//       .getManyAndCount();

//     return { rides, total, page, limit };
//   }

//   async getDriverRides(
//     driverId: number,
//     options: {
//       page?: number;
//       limit?: number;
//       status?: RideStatus;
//       from?: Date;
//       to?: Date;
//     } = {}
//   ): Promise<{ rides: Ride[]; total: number; page: number; limit: number }> {
//     const { page = 1, limit = 20, status, from, to } = options;

//     const queryBuilder = this.rideRepository
//       .createQueryBuilder("ride")
//       .leftJoinAndSelect("ride.client", "client")
//       .where("ride.driver_id = :driverId", { driverId })
//       .orderBy("ride.requested_at", "DESC");

//     if (status) {
//       queryBuilder.andWhere("ride.status = :status", { status });
//     }

//     if (from) {
//       queryBuilder.andWhere("ride.requested_at >= :from", { from });
//     }

//     if (to) {
//       queryBuilder.andWhere("ride.requested_at <= :to", { to });
//     }

//     const [rides, total] = await queryBuilder
//       .skip((page - 1) * limit)
//       .take(limit)
//       .getManyAndCount();

//     return { rides, total, page, limit };
//   }

//   async getDriverAcceptanceRate(driverId: number): Promise<{
//     acceptanceRate: number | null;
//     totalOffers: number;
//     acceptedOffers: number;
//   }> {
//     try {
//       const [acceptedStr, totalStr] = await this.circuitBreaker.execute(
//         async () => {
//           return await redisClient.mGet([
//             RedisKeys.driverAcceptedOffers(driverId),
//             RedisKeys.driverTotalOffers(driverId),
//           ]);
//         }
//       );

//       const accepted = parseInt(acceptedStr || "0", 10);
//       const total = parseInt(totalStr || "0", 10);
//       const acceptanceRate = total > 0 ? accepted / total : null;

//       return {
//         acceptanceRate,
//         totalOffers: total,
//         acceptedOffers: accepted,
//       };
//     } catch (error) {
//       this.logger.error("Failed to get driver acceptance rate", {
//         driverId,
//         error: error.message,
//       });
//       return {
//         acceptanceRate: null,
//         totalOffers: 0,
//         acceptedOffers: 0,
//       };
//     }
//   }

//   // Enhanced health check with detailed status
//   async getHealthStatus(): Promise<{
//     database: boolean;
//     redis: boolean;
//     circuitBreaker: any;
//     rateLimit: boolean;
//     metrics: boolean;
//     status: "healthy" | "degraded" | "unhealthy";
//     timestamp: string;
//     version: string;
//   }> {
//     const health = {
//       database: false,
//       redis: false,
//       circuitBreaker: this.circuitBreaker.getState(),
//       rateLimit: false,
//       metrics: false,
//       status: "unhealthy" as "healthy" | "degraded" | "unhealthy",
//       timestamp: new Date().toISOString(),
//       version: process.env.APP_VERSION || "unknown",
//     };

//     // Database health check
//     try {
//       await this.rideRepository.query("SELECT 1");
//       health.database = true;
//     } catch (error) {
//       this.logger.error("Database health check failed", {
//         error: error.message,
//       });
//     }

//     // Redis health check
//     try {
//       const pingResult = await redisClient.ping();
//       health.redis = pingResult === "PONG";
//     } catch (error) {
//       this.logger.error("Redis health check failed", { error: error.message });
//     }

//     // Rate limiter health check
//     try {
//       // Try to get rate limit info for a test key
//       await this.rateLimiter.get("health_check");
//       health.rateLimit = true;
//     } catch (error) {
//       this.logger.error("Rate limiter health check failed", {
//         error: error.message,
//       });
//     }

//     // Metrics health check
//     try {
//       const metrics = await register.metrics();
//       health.metrics = Boolean(metrics);
//     } catch (error) {
//       this.logger.error("Metrics health check failed", {
//         error: error.message,
//       });
//     }

//     // Determine overall health status
//     if (health.database && health.redis && health.rateLimit) {
//       health.status = "healthy";
//     } else if (health.database) {
//       health.status = "degraded"; // Can operate without Redis but with reduced functionality
//     }

//     return health;
//   }

//   // Metrics endpoint
//   async getMetrics(): Promise<string> {
//     return register.metrics();
//   }

//   // Administrative methods
//   async getServiceStatistics(): Promise<{
//     activeRides: number;
//     totalRidesLast24h: number;
//     averageResponseTime: number;
//     circuitBreakerState: any;
//     topTariffs: Array<{ tariff: TariffType; count: number }>;
//   }> {
//     const endTime = new Date();
//     const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

//     const activeRides = await this.rideRepository.count({
//       where: {
//         status: RideStatus.STARTED,
//       },
//     });

//     const totalRidesLast24h = await this.rideRepository.count({
//       where: {
//         requested_at: MoreThanOrEqual(startTime),
//       },
//     });
    

//     const tariffStats = await this.rideRepository
//       .createQueryBuilder("ride")
//       .select("ride.tariff_type", "tariff")
//       .addSelect("COUNT(*)", "count")
//       .where("ride.requested_at >= :startTime", { startTime })
//       .groupBy("ride.tariff_type")
//       .orderBy("count", "DESC")
//       .limit(5)
//       .getRawMany();

//     return {
//       activeRides,
//       totalRidesLast24h,
//       averageResponseTime: 0, // Would be calculated from metrics
//       circuitBreakerState: this.circuitBreaker.getState(),
//       topTariffs: tariffStats.map((stat) => ({
//         tariff: stat.tariff,
//         count: parseInt(stat.count, 10),
//       })),
//     };
//   }

//   // Graceful shutdown
//   async onApplicationShutdown(): Promise<void> {
//     this.logger.info("Shutting down RidesService");

//     // Close Redis connection gracefully
//     try {
//       await redisClient.quit();
//     } catch (error) {
//       this.logger.error("Error closing Redis connection", {
//         error: error.message,
//       });
//     }
//   }
// }
