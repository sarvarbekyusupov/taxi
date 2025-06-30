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
import haversine from "haversine-distance";
import { Server } from "socket.io";
import { Inject } from "@nestjs/common";
import { SOCKET_IO_SERVER } from "../socket/socket.constants";
import { FareCalculationService } from "./fare.calculation.service";


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

    private readonly fareCalculator: FareCalculationService
  ) {}

  async create(dto: CreateRideDto): Promise<Ride> {
    const client = await this.clientRepository.findOne({
      where: { id: dto.client_id },
    });
    if (!client) throw new NotFoundException("Client not found");

    // 🔍 Auto-match nearest online driver using Redis
    const keys = await redisClient.keys("driver:*:status");
    const candidates: { id: number; distance: number }[] = [];

    for (const key of keys) {
      const driverId = +key.split(":")[1];
      const status = await redisClient.get(key);
      if (status !== "online") continue;

      const locationStr = await redisClient.get(`driver:${driverId}:location`);
      if (!locationStr) continue;

      const location = JSON.parse(locationStr);
      const distance = haversine(
        { lat: dto.pickup_latitude, lon: dto.pickup_longitude },
        { lat: location.lat, lon: location.lng }
      );

      candidates.push({ id: driverId, distance });
    }

    if (candidates.length === 0) {
      throw new NotFoundException("No available drivers nearby");
    }

    // 🎯 Select closest driver
    candidates.sort((a, b) => a.distance - b.distance);
    const matchedId = candidates[0].id;

    const driver = await this.driverRepository.findOne({
      where: { id: matchedId },
    });
    if (!driver) throw new NotFoundException("Matched driver not found");

    // fare

    const estimatedFare = await this.fareCalculator.calculateFare(
      dto.tariff_type, // car_type like 'Economy'
      dto.service_area_id, // from request
      dto.estimated_distance ?? 0,
      dto.estimated_duration_minutes ?? 0
    );
  
    

    // 📝 Create ride entity
    const ride = this.rideRepository.create({
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

    // 💾 Save ride to DB
    const savedRide = await this.rideRepository.save(ride);

    // 📡 Emit to assigned driver via socket
    this.socketServer.emit(`rideRequest:${driver.id}`, {
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
    });

    return savedRide;
  }

  async update(id: number, dto: UpdateRideDto): Promise<Ride> {
    const ride = await this.rideRepository.preload({
      id,
      ...dto,
      client: dto.client_id ? { id: dto.client_id } : undefined,
      driver: dto.driver_id ? { id: dto.driver_id } : undefined,
      payment_method: dto.payment_method as PaymentMethod,
    });

    if (!ride) throw new NotFoundException(`Ride with ID ${id} not found`);
    return this.rideRepository.save(ride);
  }

  async findAll(): Promise<Ride[]> {
    return this.rideRepository.find({
      relations: [
        "client",
        "driver",
        "rating",
        "payment",
        "support_ticket",
        "promo_code_usage",
        "chat_messages",
      ],
    });
  }

  async findOne(id: number): Promise<Ride> {
    const ride = await this.rideRepository.findOne({
      where: { id },
      relations: [
        "client",
        "driver",
        "rating",
        "payment",
        "support_ticket",
        "promo_code_usage",
        "chat_messages",
      ],
    });
    if (!ride) throw new NotFoundException(`Ride with ID ${id} not found`);
    return ride;
  }

  async remove(id: number): Promise<void> {
    const ride = await this.findOne(id);
    await this.rideRepository.remove(ride);
  }

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

    // Store rideId in Redis for real-time tracking
    await redisClient.set(`driver:${driverId}:ride`, rideId.toString());

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

    ride.status = RideStatus.STARTED;
    ride.started_at = new Date();

    return this.rideRepository.save(ride);
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

    ride.status = RideStatus.COMPLETED;
    ride.completed_at = new Date();

    return this.rideRepository.save(ride);
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

    // ✅ Only client, admin, or super_admin can mark as paid
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

    ride.status = RideStatus.PAID;

    return this.rideRepository.save(ride);
  }

  async findNearestDriver(
    pickupLat: number,
    pickupLng: number
  ): Promise<number | null> {
    const keys = await redisClient.keys("driver:*:status");
    const driverIds = keys
      .filter((key) => key.endsWith(":status"))
      .map((key) => key.split(":")[1]);

    const availableDriverIds: string[] = [];

    for (const id of driverIds) {
      const status = await redisClient.get(`driver:${id}:status`);
      const currentRide = await redisClient.get(`driver:${id}:ride`);
      if (status === "online" && !currentRide) {
        availableDriverIds.push(id);
      }
    }

    let nearestDriver: string | null = null;
    let minDistance = Infinity;

    for (const id of availableDriverIds) {
      const locationJSON = await redisClient.get(`driver:${id}:location`);
      if (!locationJSON) continue;

      const location = JSON.parse(locationJSON);
      const distance = haversineDistance(
        pickupLat,
        pickupLng,
        location.lat,
        location.lng
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestDriver = id;
      }
    }

    return nearestDriver ? +nearestDriver : null;
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

    // Only the assigned driver or client can cancel
    const isAuthorized =
      (role === "driver" && ride.driver?.id === userId) ||
      (role === "client" && ride.client?.id === userId);

    if (!isAuthorized) {
      throw new ForbiddenException("You are not allowed to cancel this ride");
    }

    if (
      ride.status === RideStatus.COMPLETED ||
      ride.status === RideStatus.CANCELLED ||
      ride.status === RideStatus.PAID
    ) {
      throw new BadRequestException("Cannot cancel this ride");
    }

    ride.status = RideStatus.CANCELLED;
    ride.cancelled_at = new Date();
    ride.cancellation_reason = reason || "Cancelled by user";

    // Remove from Redis
    if (ride.driver?.id) {
      await redisClient.del(`driver:${ride.driver.id}:ride`);
    }

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
}
