import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
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

  /**
   * Create a new promo code
   */
  async create(dto: CreatePromoCodeDto): Promise<PromoCode> {
    const existing = await this.promoCodeRepo.findOneBy({
      code: dto.code,
    });
    if (existing) {
      throw new BadRequestException("Promo code already exists");
    }

    const promo = this.promoCodeRepo.create(dto);
    return await this.promoCodeRepo.save(promo);
  }

  /**
   * Get all promo codes
   */
  async findAll(): Promise<PromoCode[]> {
    return await this.promoCodeRepo.find({
      order: { created_at: "DESC" },
    });
  }

  /**
   * Get a single promo code by ID
   */
  async findOne(id: number): Promise<PromoCode> {
    const promo = await this.promoCodeRepo.findOneBy({ id });
    if (!promo) {
      throw new NotFoundException(`Promo code with ID ${id} not found`);
    }
    return promo;
  }

  /**
   * Update a promo code
   */
  async update(id: number, dto: UpdatePromoCodeDto): Promise<PromoCode> {
    const promo = await this.findOne(id);
    Object.assign(promo, dto);
    return await this.promoCodeRepo.save(promo);
  }

  /**
   * Delete a promo code
   */
  async remove(id: number): Promise<void> {
    const promo = await this.findOne(id);
    await this.promoCodeRepo.remove(promo);
  }
}
