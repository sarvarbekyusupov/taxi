import { Module } from '@nestjs/common';
import { DriverPaymentCardService } from './driver-payment-card.service';
import { DriverPaymentCardController } from './driver-payment-card.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverPaymentCard } from './entities/driver-payment-card.entity';
import { Driver } from '../driver/entities/driver.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:[TypeOrmModule.forFeature([DriverPaymentCard, Driver]), AuthModule],
  controllers: [DriverPaymentCardController],
  providers: [DriverPaymentCardService],
})
export class DriverPaymentCardModule {}
