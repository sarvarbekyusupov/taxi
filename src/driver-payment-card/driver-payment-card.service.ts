import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DriverPaymentCard } from "./entities/driver-payment-card.entity";
import { CreateDriverPaymentCardDto } from "./dto/create-driver-payment-card.dto";
import { UpdateDriverPaymentCardDto } from "./dto/update-driver-payment-card.dto";
import { Driver } from "../driver/entities/driver.entity";

@Injectable()
export class DriverPaymentCardService {
  constructor(
    @InjectRepository(DriverPaymentCard)
    private readonly repo: Repository<DriverPaymentCard>,

    @InjectRepository(Driver)
    private driversRepository: Repository<Driver>
  ) {}

  async create(
    createDto: CreateDriverPaymentCardDto
  ): Promise<DriverPaymentCard> {
    const {
      driver_id,
      card_token,
      last_four_digits,
      card_brand,
      cardholder_name,
      is_default,
      is_active,
    } = createDto;

    const driver = await this.driversRepository.findOne({
      where: { id: driver_id },
    });
    if (!driver) {
      throw new BadRequestException("Driver not found");
    }

    const newCard = this.repo.create({
      driver,
      card_token,
      last_four_digits,
      card_brand,
      cardholder_name,
      is_default,
      is_active,
      created_at: new Date(),
    });

    return this.repo.save(newCard);
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
