// SERVICE: daily-stats.service.ts

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DailyStats } from "./entities/daily-stat.entity";
import { CreateDailyStatsDto } from "./dto/create-daily-stat.dto";
import { UpdateDailyStatDto } from "./dto/update-daily-stat.dto";

@Injectable()
export class DailyStatsService {
  constructor(
    @InjectRepository(DailyStats)
    private readonly statsRepo: Repository<DailyStats>
  ) {}

  async create(payload: CreateDailyStatsDto) {
    const record = this.statsRepo.create(payload);
    return this.statsRepo.save(record);
  }

  async findAll() {
    return this.statsRepo.find();
  }

  async findOne(id: number) {
    return this.statsRepo.findOneBy({ id });
  }

  async update(id: number, updates: UpdateDailyStatDto) {
    await this.statsRepo.update(id, updates);
    return this.findOne(id);
  }

  async remove(id: number) {
    return this.statsRepo.delete(id);
  }
}
