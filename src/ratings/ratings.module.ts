import { Module } from '@nestjs/common';
import { RatingService } from './ratings.service';
import { RatingsController } from './ratings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rating } from './entities/rating.entity';
import { Ride } from '../rides/entities/ride.entity';
import { Client } from '../client/entities/client.entity';
import { Driver } from '../driver/entities/driver.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Rating, Ride, Client, Driver])],
  controllers: [RatingsController],
  providers: [RatingService],
})
export class RatingsModule {}
