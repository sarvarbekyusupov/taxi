import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Ride } from "./entities/ride.entity";
import { CreateRideDto } from "./dto/create-ride.dto";
import { UpdateRideDto } from "./dto/update-ride.dto";
import { Client } from "../client/entities/client.entity";
import { Driver } from "../driver/entities/driver.entity";


@Injectable()
export class RideService {
  constructor(
    @InjectRepository(Ride)
    private readonly rideRepository: Repository<Ride>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>
  ) {}

  async create(dto: CreateRideDto): Promise<Ride> {
    const client = await this.clientRepository.findOne({
      where: { id: dto.client_id },
    });
    if (!client) {
      throw new NotFoundException("Client not found");
    }

    const driver = await this.driverRepository.findOne({
      where: { id: dto.driver_id },
    });
    if (!driver) {
      throw new NotFoundException("Driver not found");
    }

    const ride = this.rideRepository.create({
      client,
      driver,
      pickup_latitude: dto.pickup_latitude,
      pickup_longitude: dto.pickup_longitude,
      pickup_address: dto.pickup_address,
      destination_latitude: dto.destination_latitude,
      destination_longitude: dto.destination_longitude,
      destination_address: dto.destination_address,
      estimated_distance: dto.estimated_distance,
      estimated_duration_minutes: dto.estimated_duration_minutes,
      estimated_fare: dto.estimated_fare,
      payment_method: dto.payment_method,
      promo_code_id: dto.promo_code_id,
      discount_amount: dto.discount_amount,
      status: "ACCEPTED",
      requested_at: new Date(),
    });

    return this.rideRepository.save(ride);
  }

  async findAll(): Promise<Ride[]> {
    return this.rideRepository.find();
  }

  async findOne(id: number): Promise<Ride> {
    const ride = await this.rideRepository.findOneBy({ id });
    if (!ride) {
      throw new NotFoundException(`Ride with ID ${id} not found`);
    }
    return ride;
  }

  async update(id: number, updateRideDto: UpdateRideDto): Promise<Ride> {
    const ride = await this.rideRepository.preload({
      id,
      ...updateRideDto,
    });

    if (!ride) {
      throw new NotFoundException(`Ride with ID ${id} not found`);
    }

    return this.rideRepository.save(ride);
  }

  async remove(id: number): Promise<void> {
    const result = await this.rideRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Ride with ID ${id} not found`);
    }
  }
}
