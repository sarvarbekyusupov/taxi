import { Module } from '@nestjs/common';
import { DriverSessionService } from './driver-session.service';
import { DriverSessionController } from './driver-session.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverSession } from './entities/driver-session.entity';
import { Driver } from '../driver/entities/driver.entity';

@Module({
  imports:[TypeOrmModule.forFeature([DriverSession, Driver])],
  controllers: [DriverSessionController],
  providers: [DriverSessionService],
})
export class DriverSessionModule {}
