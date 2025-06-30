import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PromoCodeUsage } from "./entities/promo-code-usage.entity";
import { CreatePromoCodeUsageDto } from "./dto/create-promo-code-usage.dto";
import { UpdatePromoCodeUsageDto } from "./dto/update-promo-code-usage.dto";

@Injectable()
export class PromoCodeUsageService {
  constructor(
    @InjectRepository(PromoCodeUsage)
    private readonly repo: Repository<PromoCodeUsage>
  ) {}

  async create(dto: CreatePromoCodeUsageDto): Promise<PromoCodeUsage> {
    const usage = this.repo.create(dto);
    return await this.repo.save(usage);
  }

  async findAll(): Promise<PromoCodeUsage[]> {
    return await this.repo.find();
  }

  async findOne(id: number): Promise<PromoCodeUsage> {
    const usage = await this.repo.findOneBy({ id });
    if (!usage)
      throw new NotFoundException(`Promo code usage with ID ${id} not found`);
    return usage;
  }

  async update(
    id: number,
    dto: UpdatePromoCodeUsageDto
  ): Promise<PromoCodeUsage> {
    const existing = await this.findOne(id);
    Object.assign(existing, dto);
    return await this.repo.save(existing);
  }

  async remove(id: number): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Promo code usage with ID ${id} not found`);
    }
  }
}
