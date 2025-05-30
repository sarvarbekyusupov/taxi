import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ClientPaymentCard } from "./entities/client-payment-card.entity";
import { CreateClientPaymentCardDto } from "./dto/create-client-payment-card.dto";
import { UpdateClientPaymentCardDto } from "./dto/update-client-payment-card.dto";

@Injectable()
export class ClientPaymentCardService {
  constructor(
    @InjectRepository(ClientPaymentCard)
    private readonly cards: Repository<ClientPaymentCard>
  ) {}

  create(data: CreateClientPaymentCardDto) {
    const card = this.cards.create(data);
    return this.cards.save(card);
  }

  findAll() {
    return this.cards.find();
  }

  findOne(id: number) {
    return this.cards.findOne({ where: { id } });
  }

  update(id: number, data: UpdateClientPaymentCardDto) {
    return this.cards.update({ id }, data);
  }

  remove(id: number) {
    return this.cards.delete(id);
  }
}
