import { Module } from '@nestjs/common';
import { DriverPayoutsController } from './driver-payouts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverPayout } from './entities/driver-payout.entity';
import { DriverPayoutService } from './driver-payouts.service';

@Module({
  imports:[TypeOrmModule.forFeature([DriverPayout])],
  controllers: [DriverPayoutsController],
  providers: [DriverPayoutService],
})
export class DriverPayoutsModule {}
