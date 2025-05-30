import { Injectable } from '@nestjs/common';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SupportTicket } from "./entities/support-ticket.entity";

@Injectable()
export class SupportTicketService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly ticketRepository: Repository<SupportTicket>
  ) {}

  async create(dto: CreateSupportTicketDto): Promise<SupportTicket> {
    // Step 1: Save without ticket_number
    const partialTicket = this.ticketRepository.create(dto);
    const saved = await this.ticketRepository.save(partialTicket);

    // Step 2: Generate ticket_number using saved.id
    saved.ticket_number = `TCKT-${saved.id.toString().padStart(5, "0")}`;

    // Step 3: Update ticket_number in DB
    return this.ticketRepository.save(saved);
  }

  async findAll() {
    return await this.ticketRepository.find();
  }

  async findOne(id: number) {
    return await this.ticketRepository.findOneBy({ id });
  }

  async update(id: number, dto: UpdateSupportTicketDto) {
    await this.ticketRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    return await this.ticketRepository.delete(id);
  }
}
