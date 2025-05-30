import { Module } from '@nestjs/common';
import { DriverPaymentCardService } from './driver-payment-card.service';
import { DriverPaymentCardController } from './driver-payment-card.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverPaymentCard } from './entities/driver-payment-card.entity';

@Module({
  imports:[TypeOrmModule.forFeature([DriverPaymentCard])],
  controllers: [DriverPaymentCardController],
  providers: [DriverPaymentCardService],
})
export class DriverPaymentCardModule {}
