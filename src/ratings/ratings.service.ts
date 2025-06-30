import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Rating } from "./entities/rating.entity";
import { Ride } from "../rides/entities/ride.entity";
import { Client } from "../client/entities/client.entity";
import { Driver } from "../driver/entities/driver.entity";
import { CreateRatingDto } from "./dto/create-rating.dto";
import { UpdateRatingDto } from "./dto/update-rating.dto";

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepo: Repository<Rating>,

    @InjectRepository(Ride)
    private readonly rideRepo: Repository<Ride>,

    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,

    @InjectRepository(Driver)
    private readonly driverRepo: Repository<Driver>
  ) {}

  async create(dto: CreateRatingDto): Promise<Rating> {
    // Check if ride exists and includes client & driver
    const ride = await this.rideRepo.findOne({
      where: { id: dto.ride_id },
      relations: ["client", "driver"],
    });
    if (!ride) throw new NotFoundException("Ride not found");

    // Prevent duplicate ratings per ride (optional but recommended)
    const existing = await this.ratingRepo.findOne({
      where: { ride: { id: dto.ride_id } },
    });
    if (existing) {
      throw new BadRequestException("Rating already exists for this ride.");
    }

    // Validate client and driver match ride
    if (ride.client.id !== dto.client_id || ride.driver.id !== dto.driver_id) {
      throw new BadRequestException("Client or driver does not match the ride");
    }

    const client = await this.clientRepo.findOneBy({ id: dto.client_id });
    if (!client) throw new NotFoundException("Client not found");

    const driver = await this.driverRepo.findOneBy({ id: dto.driver_id });
    if (!driver) throw new NotFoundException("Driver not found");

    const rating = this.ratingRepo.create({
      ...dto,
      ride,
      client,
      driver,
    });

    return await this.ratingRepo.save(rating);
  }

  async findAll(): Promise<Rating[]> {
    return await this.ratingRepo.find({
      relations: ["ride", "client", "driver"],
      order: { created_at: "DESC" },
    });
  }

  async findOne(id: number): Promise<Rating> {
    const rating = await this.ratingRepo.findOne({
      where: { id },
      relations: ["ride", "client", "driver"],
    });
    if (!rating) throw new NotFoundException("Rating not found");
    return rating;
  }

  async update(id: number, dto: UpdateRatingDto): Promise<Rating> {
    const rating = await this.ratingRepo.findOneBy({ id });
    if (!rating) throw new NotFoundException("Rating not found");

    await this.ratingRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const rating = await this.ratingRepo.findOneBy({ id });
    if (!rating) throw new NotFoundException("Rating not found");

    await this.ratingRepo.delete(id);
  }
}
