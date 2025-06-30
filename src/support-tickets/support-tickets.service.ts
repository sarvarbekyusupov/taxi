import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateSupportTicketDto } from "./dto/create-support-ticket.dto";
import { UpdateSupportTicketDto } from "./dto/update-support-ticket.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SupportTicket } from "./entities/support-ticket.entity";
import { Ride } from "../rides/entities/ride.entity";

@Injectable()
export class SupportTicketService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly ticketRepository: Repository<SupportTicket>,
    @InjectRepository(Ride)
    private readonly rideRepository: Repository<Ride>
  ) {}

  async create(dto: CreateSupportTicketDto): Promise<SupportTicket> {
    let ride: Ride | null = null;

    if (dto.ride_id) {
      ride = await this.rideRepository.findOneBy({ id: dto.ride_id });
      if (!ride) throw new NotFoundException("Ride not found");

      const existingTicket = await this.ticketRepository.findOneBy({
        ride: { id: dto.ride_id },
      });
      if (existingTicket) {
        throw new BadRequestException(
          "Only one support ticket can be created per ride."
        );
      }
    }

    function generateTicketNumber(): string {
      const random = Math.floor(1000 + Math.random() * 9000);
      return `TCKT-${Date.now().toString().slice(-5)}-${random}`;
    }

    const ticket = this.ticketRepository.create({
      ticket_number: generateTicketNumber(),
      user_id: dto.user_id,
      user_type: dto.user_type,
      ride: ride ?? undefined,
      category: dto.category,
      status: dto.status,
      subject: dto.subject,
      description: dto.description,
    });

    return this.ticketRepository.save(ticket);
  }

  async findAll() {
    return this.ticketRepository.find({
      relations: ["ride"],
      order: { created_at: "DESC" },
    });
  }

  async findOne(id: number) {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ["ride"],
    });
    if (!ticket) throw new NotFoundException("Support ticket not found");
    return ticket;
  }

  async update(id: number, dto: UpdateSupportTicketDto) {
    await this.ticketRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    return await this.ticketRepository.delete(id);
  }
}
