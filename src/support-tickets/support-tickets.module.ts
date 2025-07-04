import { Module } from '@nestjs/common';
import { SupportTicketsController } from './support-tickets.controller';
import { SupportTicketService } from './support-tickets.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportTicket } from './entities/support-ticket.entity';
import { Ride } from '../rides/entities/ride.entity';
import { AuthModule } from '../auth/auth.module';
import { PublicSupportTicketsController } from './public-support-ticket.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SupportTicket, Ride]), AuthModule],
  controllers: [SupportTicketsController, PublicSupportTicketsController],
  providers: [SupportTicketService],
})
export class SupportTicketsModule {}
