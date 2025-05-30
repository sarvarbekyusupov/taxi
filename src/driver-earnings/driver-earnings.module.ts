import { Module } from '@nestjs/common';
import { DriverEarningService } from './driver-earnings.service';
import { DriverEarningsController } from './driver-earnings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverEarning } from './entities/driver-earning.entity';

@Module({
  imports:[TypeOrmModule.forFeature([DriverEarning])],
  controllers: [DriverEarningsController],
  providers: [DriverEarningService],
})
export class DriverEarningsModule {}
