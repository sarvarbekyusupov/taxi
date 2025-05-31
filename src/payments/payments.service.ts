import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Payment } from "./entities/payment.entity";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { UpdatePaymentDto } from "./dto/update-payment.dto";
import { Ride } from "../rides/entities/ride.entity";
import { ClientPaymentCard } from "../client-payment-card/entities/client-payment-card.entity";

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,

    @InjectRepository(Ride)
    private readonly rideRepo: Repository<Ride>,

    @InjectRepository(ClientPaymentCard)
    private readonly paymentCardRepo: Repository<ClientPaymentCard>
  ) {}

  async create(dto: CreatePaymentDto): Promise<Payment> {
    const ride = await this.rideRepo.findOne({ where: { id: dto.ride_id } });
    if (!ride) {
      throw new NotFoundException(`Ride with ID ${dto.ride_id} not found`);
    }

    let paymentCard: ClientPaymentCard | undefined;
    if (dto.payment_card_id) {
      const foundCard = await this.paymentCardRepo.findOne({
        where: { id: dto.payment_card_id },
      });

      if (!foundCard) {
        throw new NotFoundException(
          `Payment card with ID ${dto.payment_card_id} not found`
        );
      }

      paymentCard = foundCard;
    }

    const payment = this.paymentRepo.create({
      amount: dto.amount,
      payment_method: dto.payment_method,
      status: dto.status,
      transaction_id: dto.transaction_id,
      processed_at: dto.processed_at,
      ride: ride,
      payment_card: paymentCard,
    });

    return this.paymentRepo.save(payment);
  }
  
  async findAll(): Promise<Payment[]> {
    return this.paymentRepo.find();
  }

  async findOne(id: number): Promise<Payment> {
    const payment = await this.paymentRepo.findOneBy({ id });
    if (!payment)
      throw new NotFoundException(`Payment with ID ${id} not found`);
    return payment;
  }

  async update(id: number, dto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.findOne(id);
    Object.assign(payment, dto);
    return this.paymentRepo.save(payment);
  }

  async remove(id: number): Promise<void> {
    const result = await this.paymentRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
  }
}
