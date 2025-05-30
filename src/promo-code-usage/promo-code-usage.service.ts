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

  create(dto: CreatePromoCodeUsageDto) {
    const usage = this.repo.create(dto);
    return this.repo.save(usage);
  }

  findAll() {
    return this.repo.find();
  }

  async findOne(id: number) {
    const record = await this.repo.findOneBy({ id });
    if (!record)
      throw new NotFoundException(`Promo code usage ${id} not found`);
    return record;
  }

  update(id: number, dto: UpdatePromoCodeUsageDto) {
    return this.repo.update(id, dto);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }
}
