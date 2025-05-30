import { Module } from '@nestjs/common';
import { DriverSessionService } from './driver-session.service';
import { DriverSessionController } from './driver-session.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverSession } from './entities/driver-session.entity';

@Module({
  imports:[TypeOrmModule.forFeature([DriverSession])],
  controllers: [DriverSessionController],
  providers: [DriverSessionService],
})
export class DriverSessionModule {}
