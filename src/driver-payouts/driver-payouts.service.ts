import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DriverPayout } from "./entities/driver-payout.entity";
import { CreateDriverPayoutDto } from "./dto/create-driver-payout.dto";
import { UpdateDriverPayoutDto } from "./dto/update-driver-payout.dto";

@Injectable()
export class DriverPayoutService {
  constructor(
    @InjectRepository(DriverPayout)
    private readonly payoutRepo: Repository<DriverPayout>
  ) {}

  async create(dto: CreateDriverPayoutDto): Promise<DriverPayout> {
    const payout = this.payoutRepo.create(dto);
    return this.payoutRepo.save(payout);
  }

  async findAll(): Promise<DriverPayout[]> {
    return this.payoutRepo.find();
  }

  async findOne(id: number): Promise<DriverPayout> {
    const payout = await this.payoutRepo.findOneBy({ id });
    if (!payout) throw new NotFoundException(`Payout with ID ${id} not found`);
    return payout;
  }

  async update(id: number, dto: UpdateDriverPayoutDto): Promise<DriverPayout> {
    const payout = await this.findOne(id);
    Object.assign(payout, dto);
    return this.payoutRepo.save(payout);
  }

  async remove(id: number): Promise<void> {
    const result = await this.payoutRepo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Payout with ID ${id} not found`);
  }
}
