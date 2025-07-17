import { Module } from '@nestjs/common';
import { CarService } from './car.service';
import { CarController } from './car.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Car } from './entities/car.entity';
import { Driver } from '../driver/entities/driver.entity';
import { AuthModule } from '../auth/auth.module';
import { CarType } from '../car-type/entities/car-type.entity';



@Module({
  imports: [TypeOrmModule.forFeature([Car, Driver, CarType]), AuthModule],
  controllers: [CarController],
  providers: [CarService],
})
export class CarModule {}
