import { Module } from '@nestjs/common';
import { DriverEarningService } from './driver-earnings.service';
import { DriverEarningsController } from './driver-earnings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverEarning } from './entities/driver-earning.entity';
import { Ride } from '../rides/entities/ride.entity';
import { Driver } from '../driver/entities/driver.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:[TypeOrmModule.forFeature([DriverEarning, Ride, Driver]), AuthModule],
  controllers: [DriverEarningsController],
  providers: [DriverEarningService],
})
export class DriverEarningsModule {}
