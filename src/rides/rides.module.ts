import { Module } from '@nestjs/common';
import { RideService } from './rides.service';
import { RidesController } from './rides.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ride } from './entities/ride.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Ride])],
  controllers: [RidesController],
  providers: [RideService],
})
export class RidesModule {}
