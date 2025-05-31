import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DriverPayout } from "./entities/driver-payout.entity";
import { CreateDriverPayoutDto } from "./dto/create-driver-payout.dto";
import { UpdateDriverPayoutDto } from "./dto/update-driver-payout.dto";
import { Driver } from "../driver/entities/driver.entity";

@Injectable()
export class DriverPayoutService {
  constructor(
    @InjectRepository(DriverPayout)
    private readonly payoutRepo: Repository<DriverPayout>,

    @InjectRepository(Driver)
    private driversRepository: Repository<Driver>
  ) {}

  async create(createDto: CreateDriverPayoutDto): Promise<DriverPayout> {
    const {
      driver_id,
      amount,
      payment_card_id,
      status,
      transaction_id,
      requested_at,
      processed_at,
    } = createDto;

    const driver = await this.driversRepository.findOne({
      where: { id: driver_id },
    });
    if (!driver) {
      throw new BadRequestException("Driver not found");
    }

    const payout = this.payoutRepo.create({
      driver,
      amount,
      payment_card_id,
      status,
      transaction_id,
      requested_at,
      processed_at,
    });

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
