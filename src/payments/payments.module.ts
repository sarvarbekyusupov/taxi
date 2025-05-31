import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Ride } from '../rides/entities/ride.entity';
import { ClientPaymentCard } from '../client-payment-card/entities/client-payment-card.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Payment, Ride, ClientPaymentCard])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
