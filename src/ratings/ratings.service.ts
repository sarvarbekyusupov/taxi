import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Rating } from "./entities/rating.entity";
import { Ride } from '../rides/entities/ride.entity';
import { Client } from '../client/entities/client.entity';
import { Driver } from '../driver/entities/driver.entity';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepo: Repository<Rating>,

    @InjectRepository(Ride)
    private readonly rideRepository: Repository<Ride>,

    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,

    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>
  ) {}

  async create(dto: CreateRatingDto): Promise<Rating> {
    const ride = await this.rideRepository.findOne({
      where: { id: dto.ride_id },
      relations: ["client", "driver"],
    });

    if (!ride) {
      throw new NotFoundException("Ride not found");
    }

    if (!ride.client || !ride.driver) {
      throw new BadRequestException(
        "Ride is not associated with both a client and a driver"
      );
    }

    if (ride.client.id !== dto.client_id || ride.driver.id !== dto.driver_id) {
      throw new BadRequestException(
        "Ride does not match provided client or driver"
      );
    }

    const client = await this.clientRepository.findOneBy({ id: dto.client_id });
    if (!client) {
      throw new NotFoundException("Client not found");
    }

    const driver = await this.driverRepository.findOneBy({ id: dto.driver_id });
    if (!driver) {
      throw new NotFoundException("Driver not found");
    }

    const rating = this.ratingRepo.create(dto);
    return this.ratingRepo.save(rating);
  }

  async findAll(): Promise<Rating[]> {
    return await this.ratingRepo.find();
  }

  async findOne(id: number) {
    return await this.ratingRepo.findOneBy({ id });
  }

  async update(id: number, dto: UpdateRatingDto): Promise<void> {
    await this.ratingRepo.update(id, dto);
  }

  async remove(id: number): Promise<void> {
    await this.ratingRepo.delete(id);
  }
}
