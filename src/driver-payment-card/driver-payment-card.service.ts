import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DriverPaymentCard } from "./entities/driver-payment-card.entity";
import { CreateDriverPaymentCardDto } from "./dto/create-driver-payment-card.dto";
import { UpdateDriverPaymentCardDto } from "./dto/update-driver-payment-card.dto";

@Injectable()
export class DriverPaymentCardService {
  constructor(
    @InjectRepository(DriverPaymentCard)
    private readonly repo: Repository<DriverPaymentCard>
  ) {}

  create(dto: CreateDriverPaymentCardDto) {
    const card = this.repo.create(dto);
    return this.repo.save(card);
  }

  findAll() {
    return this.repo.find();
  }

  findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  update(id: number, dto: UpdateDriverPaymentCardDto) {
    return this.repo.update(id, dto);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }
}
