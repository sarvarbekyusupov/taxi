import { Injectable } from '@nestjs/common';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Rating } from "./entities/rating.entity";

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepo: Repository<Rating>
  ) {}

  async create(dto: CreateRatingDto): Promise<Rating> {
    const rating = this.ratingRepo.create(dto);
    return await this.ratingRepo.save(rating);
  }

  async findAll(): Promise<Rating[]> {
    return await this.ratingRepo.find();
  }

  async findOne(id: number){
    return await this.ratingRepo.findOneBy({ id });
  }

  async update(id: number, dto: UpdateRatingDto): Promise<void> {
    await this.ratingRepo.update(id, dto);
  }

  async remove(id: number): Promise<void> {
    await this.ratingRepo.delete(id);
  }
}
