import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ClientPaymentCard } from "./entities/client-payment-card.entity";
import { CreateClientPaymentCardDto } from "./dto/create-client-payment-card.dto";
import { UpdateClientPaymentCardDto } from "./dto/update-client-payment-card.dto";
import { Client } from "../client/entities/client.entity";

@Injectable()
export class ClientPaymentCardService {
  constructor(
    @InjectRepository(ClientPaymentCard)
    private readonly cards: Repository<ClientPaymentCard>,

    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>
  ) {}

  async create(dto: CreateClientPaymentCardDto): Promise<ClientPaymentCard> {
    const {
      client_id,
      card_token,
      last_four_digits,
      card_brand,
      cardholder_name,
      expiry_month,
      expiry_year,
      is_default,
      is_active,
    } = dto;

    const client = await this.clientRepository.findOne({
      where: { id: client_id },
    });
    if (!client) {
      throw new BadRequestException("Client not found");
    }

    if (is_default) {
      await this.cards.update(
        { client: { id: client_id } },
        { is_default: false }
      );
    }

    const card = this.cards.create({
      client,
      card_token,
      last_four_digits,
      card_brand,
      cardholder_name,
      expiry_month,
      expiry_year,
      is_default,
      is_active,
    });

    return this.cards.save(card);
  }

  async findAll(): Promise<ClientPaymentCard[]> {
    return this.cards.find({ relations: ["client"] });
  }

  async findOne(id: number): Promise<ClientPaymentCard> {
    const card = await this.cards.findOne({
      where: { id },
      relations: ["client"],
    });
    if (!card) {
      throw new BadRequestException(`Payment card with ID ${id} not found`);
    }
    return card;
  }

  async update(
    id: number,
    data: UpdateClientPaymentCardDto
  ): Promise<{ message: string }> {
    const card = await this.cards.findOne({ where: { id } });
    if (!card) {
      throw new BadRequestException(`Payment card with ID ${id} not found`);
    }

    await this.cards.update({ id }, data);
    return { message: "Payment card updated successfully" };
  }

  async remove(id: number): Promise<{ message: string }> {
    const card = await this.cards.findOne({ where: { id } });
    if (!card) {
      throw new BadRequestException(`Payment card with ID ${id} not found`);
    }

    await this.cards.delete({ id });
    return { message: "Payment card deleted successfully" };
  }
}
