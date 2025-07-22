import { Module } from '@nestjs/common';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ride } from './entities/ride.entity';
import { Client } from '../client/entities/client.entity';
import { Driver } from '../driver/entities/driver.entity';
import { AuthModule } from '../auth/auth.module';
import { DriverModule } from '../driver/driver.module';
import { FareCalculationService } from './fare.calculation.service';
import { Tariff } from '../tariff/entities/tariff.entity';
import { Car } from '../car/entities/car.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ride, Client, Driver, Tariff,Car]),
    AuthModule,
    DriverModule,
  ],
  controllers: [RidesController, ],
  providers: [RidesService, FareCalculationService],
})
export class RidesModule {}
