import { Module } from '@nestjs/common';
import { DriverPayoutsController } from './driver-payouts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverPayout } from './entities/driver-payout.entity';
import { DriverPayoutService } from './driver-payouts.service';
import { Driver } from '../driver/entities/driver.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:[TypeOrmModule.forFeature([DriverPayout, Driver]), AuthModule],
  controllers: [DriverPayoutsController],
  providers: [DriverPayoutService],
})
export class DriverPayoutsModule {}
