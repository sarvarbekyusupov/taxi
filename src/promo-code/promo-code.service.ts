import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PromoCode } from "./entities/promo-code.entity";
import { CreatePromoCodeDto } from "./dto/create-promo-code.dto";
import { UpdatePromoCodeDto } from "./dto/update-promo-code.dto";

@Injectable()
export class PromoCodeService {
  constructor(
    @InjectRepository(PromoCode)
    private readonly promoCodeRepo: Repository<PromoCode>
  ) {}

  async create(createDto: CreatePromoCodeDto): Promise<PromoCode> {
    const promo = this.promoCodeRepo.create(createDto);
    return this.promoCodeRepo.save(promo);
  }

  async findAll(): Promise<PromoCode[]> {
    return this.promoCodeRepo.find();
  }

  async findOne(id: number): Promise<PromoCode> {
    const promo = await this.promoCodeRepo.findOneBy({ id });
    if (!promo)
      throw new NotFoundException(`Promo code with ID ${id} not found`);
    return promo;
  }

  async update(id: number, updateDto: UpdatePromoCodeDto): Promise<PromoCode> {
    const promo = await this.findOne(id);
    Object.assign(promo, updateDto);
    return this.promoCodeRepo.save(promo);
  }

  async remove(id: number): Promise<void> {
    const result = await this.promoCodeRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Promo code with ID ${id} not found`);
    }
  }
}
