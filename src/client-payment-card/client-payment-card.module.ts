import { Module } from '@nestjs/common';
import { ClientPaymentCardService } from './client-payment-card.service';
import { ClientPaymentCardController } from './client-payment-card.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientPaymentCard } from './entities/client-payment-card.entity';

@Module({
  imports:[TypeOrmModule.forFeature([ClientPaymentCard])],
  controllers: [ClientPaymentCardController],
  providers: [ClientPaymentCardService],
})
export class ClientPaymentCardModule {}
