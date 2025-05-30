import { Module } from '@nestjs/common';
import { RatingService } from './ratings.service';
import { RatingsController } from './ratings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rating } from './entities/rating.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Rating])],
  controllers: [RatingsController],
  providers: [RatingService],
})
export class RatingsModule {}
