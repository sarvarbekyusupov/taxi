import { Module } from '@nestjs/common';
import { RideService } from './rides.service';
import { RidesController } from './rides.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ride } from './entities/ride.entity';
import { Client } from '../client/entities/client.entity';
import { Driver } from '../driver/entities/driver.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:[TypeOrmModule.forFeature([Ride, Client, Driver]), AuthModule],
  controllers: [RidesController],
  providers: [RideService],
})
export class RidesModule {}
