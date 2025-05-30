import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DriverEarning } from "./entities/driver-earning.entity";
import { CreateDriverEarningDto } from "./dto/create-driver-earning.dto";
import { UpdateDriverEarningDto } from "./dto/update-driver-earning.dto";

@Injectable()
export class DriverEarningService {
  constructor(
    @InjectRepository(DriverEarning)
    private readonly earnings: Repository<DriverEarning>
  ) {}

  async create(createDriverEarningDto: CreateDriverEarningDto) {
    const entry = this.earnings.create(createDriverEarningDto);
    return this.earnings.save(entry);
  }

  findAll(): Promise<DriverEarning[]> {
    return this.earnings.find();
  }

  findOne(id: number) {
    return this.earnings.findOneBy({ id });
  }

  async update(id: number, updateDriverEarningDto: UpdateDriverEarningDto) {
    await this.earnings.update({ id }, updateDriverEarningDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.earnings.delete(id);
  }
}
