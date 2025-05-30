import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Ride } from "./entities/ride.entity";
import { CreateRideDto } from "./dto/create-ride.dto";
import { UpdateRideDto } from "./dto/update-ride.dto";


@Injectable()
export class RideService {
  constructor(
    @InjectRepository(Ride)
    private readonly rideRepository: Repository<Ride>
  ) {}

  async create(createRideDto: CreateRideDto): Promise<Ride> {
    const ride = this.rideRepository.create({
      ...createRideDto,
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
