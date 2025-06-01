// SERVICE: daily-stats.service.ts

import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DailyStats } from "./entities/daily-stat.entity";
import { CreateDailyStatsDto } from "./dto/create-daily-stat.dto";
import { UpdateDailyStatDto } from "./dto/update-daily-stat.dto";
import { ServiceArea } from "../service-areas/entities/service-area.entity";

@Injectable()
export class DailyStatsService {
  constructor(
    @InjectRepository(DailyStats)
    private readonly statsRepo: Repository<DailyStats>,

    @InjectRepository(ServiceArea)
    private readonly serviceAreaRepository: Repository<ServiceArea>
  ) {}

  async create(dto: CreateDailyStatsDto): Promise<DailyStats> {
    const { date, service_area_id } = dto;

    const existing = await this.statsRepo.findOne({
      where: { date, service_area_id },
    });

    if (existing) {
      throw new ConflictException(
        "Stats for this date and service area already exist."
      );
    }

    let service_area: ServiceArea | undefined;
    if (service_area_id) {
      const foundServiceArea = await this.serviceAreaRepository.findOne({
        where: { id: service_area_id },
      });
      if (!foundServiceArea) {
        throw new NotFoundException("Service area not found");
      }
      service_area = foundServiceArea;
    }

    const dailyStats = this.statsRepo.create({
      ...dto,
      ...(service_area ? { service_area } : {}),
    });

    return this.statsRepo.save(dailyStats);
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
