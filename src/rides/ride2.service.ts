import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Ride, RideStatus, TariffType } from "./entities/ride.entity";
import { CreateRideDto } from "./dto/create-ride.dto";
import { UpdateRideDto } from "./dto/update-ride.dto";
import { Client } from "../client/entities/client.entity";
import { Driver } from "../driver/entities/driver.entity";
import { PaymentMethod } from "./entities/ride.entity";
import { redisClient } from "../redis/redis.provider";
import { haversineDistance } from "../common/helpers/haversine";
import { Server } from "socket.io";
import { SOCKET_IO_SERVER } from "../socket/socket.constants";
import { FareCalculationService } from "./fare.calculation.service";
import { RedisKeys } from "../constants/redis.keys";
import { safeDel, safeGet } from "../redis/redis.safe";
import { safeSet } from "../redis/redis.safe";
import {  Inject, LoggerService } from "@nestjs/common";
import { Logger } from "winston";
import { DataSource } from "typeorm";



const MAX_RADIUS_BY_TARIFF: Record<TariffType, number> = {
  [TariffType.ECONOMY]: 2000,
  [TariffType.COMFORT]: 3000,
  [TariffType.BUSINESS]: 4000,
  [TariffType.TIME_BASED]: 2500,
  [TariffType.DELIVERY]: 3000,
};

function getMaxSearchRadius(tariff: TariffType): number {
  return MAX_RADIUS_BY_TARIFF[tariff] ?? 2000;
}

async function acquireLock(key: string, ttl: number): Promise<boolean> {
  return (await redisClient.set(key, "locked", { NX: true, PX: ttl })) === "OK";
}

async function releaseLock(key: string): Promise<void> {
  await redisClient.del(key);
}


@Injectable()
export class RidesService {
  constructor(
    @InjectRepository(Ride)
    private readonly rideRepository: Repository<Ride>,

    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,

    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,

    @Inject(SOCKET_IO_SERVER)
    private readonly socketServer: Server,

    @Inject(Logger) private readonly logger: LoggerService,

    private readonly fareCalculator: FareCalculationService,
    private readonly dataSource: DataSource
  ) {}

  // 🔁 Find the nearest online, free driver based on pickup coordinates
  private async getNearestAvailableDriver(
    pickupLat: number,
    pickupLng: number,
    tariff: TariffType
  ): Promise<number | null> {
    const maxRadius = getMaxSearchRadius(tariff);

    const nearbyDriverIds = (await redisClient.sendCommand([
      "GEORADIUS",
      "drivers:geo",
      pickupLng.toString(),
      pickupLat.toString(),
      maxRadius.toString(),
      "m",
      "COUNT",
      "10",
      "ASC",
    ])) as string[];

    if (!nearbyDriverIds || nearbyDriverIds.length === 0) return null;

    const candidates: { id: number; score: number }[] = [];

    for (const idStr of nearbyDriverIds) {
      const driverId = Number(idStr);

      const [status, currentRide, acceptedStr, totalStr] = await Promise.all([
        redisClient.get(RedisKeys.driverStatus(driverId)),
        redisClient.get(RedisKeys.driverRide(driverId)),
        redisClient.get(RedisKeys.driverAcceptedOffers(driverId)),
        redisClient.get(RedisKeys.driverTotalOffers(driverId)),
      ]);

      if (status !== "online" || currentRide) continue;

      // 🔒 Try to acquire lock
      const lockKey = `lock:driver:${driverId}`;
      const lockAcquired = await acquireLock(lockKey, 5000); // 5 sec lock
      if (!lockAcquired) continue;

      const accepted = Number(acceptedStr) || 0;
      const total = Number(totalStr) || 0;
      const acceptanceRate = total > 0 ? accepted / total : 0;

      const distanceWeight = 1;
      const acceptanceWeight = 2;
      const score = distanceWeight + acceptanceWeight * acceptanceRate;

      candidates.push({ id: driverId, score });
    }

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => b.score - a.score);

    return candidates[0].id;
  }

  // 📦 Create a new ride and assign it to nearest driver
  async create(dto: CreateRideDto): Promise<Ride> {
    return await this.dataSource.transaction(async (manager) => {
      const client = await manager.findOne(Client, {
        where: { id: dto.client_id },
      });
      if (!client) throw new NotFoundException("Client not found");

      const matchedId = await this.getNearestAvailableDriver(
        dto.pickup_latitude,
        dto.pickup_longitude,
        dto.tariff_type
      );
      if (!matchedId)
        throw new NotFoundException("No available drivers nearby");

      const driver = await manager.findOne(Driver, {
        where: { id: matchedId },
      });
      if (!driver) throw new NotFoundException("Matched driver not found");

      const estimatedFare = await this.fareCalculator.calculateFare(
        dto.tariff_type,
        dto.service_area_id,
        dto.estimated_distance ?? 0,
        dto.estimated_duration_minutes ?? 0
      );

      const ride = manager.create(Ride, {
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
      });

      const savedRide = await manager.save(ride);

      try {
        try {
          await redisClient.set(
            RedisKeys.driverRide(driver.id),
            savedRide.id.toString(),
            { EX: 1800 }
          );

          await redisClient.set(
            RedisKeys.rideStatus(savedRide.id),
            RideStatus.PENDING,
            { EX: 3600 }
          );

          await redisClient.incr(RedisKeys.driverTotalOffers(driver.id));
        } catch (redisError) {
          this.logger.error("❌ Redis write failed:", redisError);
        }

        let finalStatus: string | null = null;
        try {
          finalStatus = await redisClient.get(
            RedisKeys.driverStatus(driver.id)
          );
        } catch (redisError) {
          this.logger.error("❌ Redis read failed:", redisError);
        }

        if (finalStatus === "online") {
          const ackTimeoutMs = 5000;

          const ackPromise = new Promise<{ success: boolean }>((resolve) => {
            this.socketServer.emit(
              `rideRequest:${driver.id}`,
              {
                rideId: savedRide.id,
                pickup: {
                  lat: savedRide.pickup_latitude,
                  lng: savedRide.pickup_longitude,
                  address: savedRide.pickup_address,
                },
                destination: {
                  lat: savedRide.destination_latitude,
                  lng: savedRide.destination_longitude,
                  address: savedRide.destination_address,
                },
                estimatedFare: savedRide.estimated_fare,
                tariff: savedRide.tariff_type,
                clientId: dto.client_id,
              },
              (ack: { success: boolean }) => {
                resolve(ack || { success: false });
              }
            );
          });

          const timeoutPromise = new Promise<{ success: boolean }>((resolve) =>
            setTimeout(() => resolve({ success: false }), ackTimeoutMs)
          );

          const ackResult = await Promise.race([ackPromise, timeoutPromise]);

          if (!ackResult.success) {
            try {
              await redisClient.del(RedisKeys.driverRide(driver.id));
              await redisClient.del(RedisKeys.rideStatus(savedRide.id));
            } catch (redisError) {
              this.logger.warn("⚠️ Redis rollback failed:", redisError);
            }

            this.logger.warn(
              `Driver ${driver.id} did not ACK ride ${savedRide.id}`
            );
            throw new Error("Driver did not respond in time");
          }
        }
      } catch (redisOrSocketError) {
        this.logger.error(
          "❌ Critical Redis or Socket error:",
          redisOrSocketError
        );
      }

      return savedRide;
    });
  }

  // 🔍 Proxy to shared driver-matching logic
  async findNearestDriver(
    pickupLat: number,
    pickupLng: number,
    tariff: TariffType
  ): Promise<number | null> {
    return this.getNearestAvailableDriver(pickupLat, pickupLng, tariff);
  }

  // ✅ Mark ride as accepted by specific driver
  async acceptRide(rideId: number, driverId: number): Promise<Ride> {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
      relations: ["driver"],
    });
    if (!ride) throw new NotFoundException("Ride not found");

    if (ride.status !== RideStatus.PENDING) {
      throw new BadRequestException("Ride is not available for acceptance");
    }

    const driver = await this.driverRepository.findOne({
      where: { id: driverId },
    });
    if (!driver) throw new NotFoundException("Driver not found");

    ride.driver = driver;
    ride.status = RideStatus.ACCEPTED;
    ride.accepted_at = new Date();

    const updatedRide = await this.rideRepository.save(ride);

    // 📍 Update Redis: driver ride + ride status
    await redisClient.set(
      RedisKeys.driverRide(driverId),
      rideId.toString(),
      { EX: 1800 } // 30 minutes
    );

    await redisClient.set(
      RedisKeys.rideStatus(rideId),
      RideStatus.ACCEPTED,
      { EX: 3600 } // 60 minutes
    );

    // ✅ Increment driver's accepted offers count
    await redisClient.incr(RedisKeys.driverAcceptedOffers(driverId));

    return updatedRide;
  }

  async startRide(rideId: number, driverId: number): Promise<Ride> {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
      relations: ["driver"],
    });

    if (!ride) throw new NotFoundException("Ride not found");

    if (ride.driver?.id !== driverId) {
      throw new ForbiddenException("You are not assigned to this ride");
    }

    if (ride.status !== RideStatus.ACCEPTED) {
      throw new BadRequestException("Ride is not in an accepted state");
    }

    // 🟡 Update ride entity
    ride.status = RideStatus.STARTED;
    ride.started_at = new Date();

    const updated = await this.rideRepository.save(ride);

    // 🟢 Sync Redis ride status with TTL (1 hour)
    await safeSet(RedisKeys.rideStatus(ride.id), RideStatus.STARTED, 3600);

    return updated;
  }

  async completeRide(rideId: number, driverId: number): Promise<Ride> {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
      relations: ["driver"],
    });

    if (!ride) throw new NotFoundException("Ride not found");

    if (ride.driver?.id !== driverId) {
      throw new ForbiddenException("You are not assigned to this ride");
    }

    if (ride.status !== RideStatus.STARTED) {
      throw new BadRequestException("Ride is not in progress");
    }

    // 🟡 Update DB ride status
    ride.status = RideStatus.COMPLETED;
    ride.completed_at = new Date();

    const updated = await this.rideRepository.save(ride);

    // 🧹 Clear Redis driver:ride key (driver is now free)
    await redisClient.del(RedisKeys.driverRide(driverId));

    // 🟢 Sync Redis ride status (with TTL)
    await safeSet(RedisKeys.rideStatus(ride.id), RideStatus.COMPLETED, 3600);

    return updated;
  }

  async markRideAsPaid(
    rideId: number,
    userId: number,
    role: string
  ): Promise<Ride> {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
      relations: ["client"],
    });

    if (!ride) throw new NotFoundException("Ride not found");

    // ✅ Check if user is authorized to mark as paid
    const allowed =
      (role === "client" && ride.client?.id === userId) ||
      role === "admin" ||
      role === "super_admin";

    if (!allowed) {
      throw new ForbiddenException(
        "You are not authorized to mark this ride as paid"
      );
    }

    if (ride.status !== RideStatus.COMPLETED) {
      throw new BadRequestException("Ride is not yet completed");
    }

    // 🟡 Update DB entity
    ride.status = RideStatus.PAID;

    const updated = await this.rideRepository.save(ride);

    // 🟢 Reflect change in Redis with TTL (1 hour)
    await safeSet(RedisKeys.rideStatus(ride.id), RideStatus.PAID, 3600);

    return updated;
  }

  async cancelRide(
    rideId: number,
    userId: number,
    role: "driver" | "client",
    reason?: string
  ): Promise<Ride> {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
      relations: ["driver", "client"],
    });

    if (!ride) throw new NotFoundException("Ride not found");

    // ✅ Check authorization
    const isAuthorized =
      (role === "driver" && ride.driver?.id === userId) ||
      (role === "client" && ride.client?.id === userId);

    if (!isAuthorized) {
      throw new ForbiddenException("You are not allowed to cancel this ride");
    }

    // ❌ Disallow cancellation if already closed
    if (
      ride.status === RideStatus.COMPLETED ||
      ride.status === RideStatus.CANCELLED ||
      ride.status === RideStatus.PAID
    ) {
      throw new BadRequestException("Cannot cancel this ride");
    }

    // 🟠 Update DB ride status
    ride.status = RideStatus.CANCELLED;
    ride.cancelled_at = new Date();
    ride.cancellation_reason = reason || "Cancelled by user";

    // 🧹 Safe Redis cleanup and update
    if (ride.driver?.id) {
      await safeDel(RedisKeys.driverRide(ride.driver.id));
    }

    await safeSet(RedisKeys.rideStatus(ride.id), RideStatus.CANCELLED, 1800); // optional 30min TTL

    return this.rideRepository.save(ride);
  }

  async getClientRides(clientId: number): Promise<Ride[]> {
    return this.rideRepository.find({
      where: { client: { id: clientId } },
      order: { requested_at: "DESC" },
      relations: ["driver"],
    });
  }

  async getDriverRides(driverId: number): Promise<Ride[]> {
    return this.rideRepository.find({
      where: { driver: { id: driverId } },
      order: { requested_at: "DESC" },
      relations: ["client"],
    });
  }

  async getDriverAcceptanceRate(driverId: number): Promise<number | null> {
    const [acceptedStr, totalStr] = await redisClient.mGet([
      RedisKeys.driverAcceptedOffers(driverId),
      RedisKeys.driverTotalOffers(driverId),
    ]);

    const accepted = parseInt(acceptedStr || "0", 10);
    const total = parseInt(totalStr || "0", 10);

    if (total === 0) return null; // Avoid division by 0

    return accepted / total;
  }
}
