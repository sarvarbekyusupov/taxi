import { Module } from '@nestjs/common';
import { SupportTicketsController } from './support-tickets.controller';
import { SupportTicketService } from './support-tickets.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportTicket } from './entities/support-ticket.entity';

@Module({
  imports:[TypeOrmModule.forFeature([SupportTicket])],
  controllers: [SupportTicketsController],
  providers: [SupportTicketService],
})
export class SupportTicketsModule {}
