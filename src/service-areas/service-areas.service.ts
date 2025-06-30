import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreateServiceAreaDto } from "./dto/create-service-area.dto";
import { UpdateServiceAreaDto } from "./dto/update-service-area.dto";
import { ServiceArea } from "./entities/service-area.entity";

@Injectable()
export class ServiceAreaService {
  constructor(
    @InjectRepository(ServiceArea)
    private readonly repo: Repository<ServiceArea>
  ) {}

  async create(dto: CreateServiceAreaDto): Promise<ServiceArea> {
    const area = this.repo.create(dto);
    return await this.repo.save(area);
  }

  async findAll(): Promise<ServiceArea[]> {
    return this.repo.find({
      relations: ["tariffs", "daily_stats"],
      order: { id: "ASC" },
    });
  }

  async findOne(id: number): Promise<ServiceArea> {
    const area = await this.repo.findOne({
      where: { id },
      relations: ["tariffs", "daily_stats"],
    });

    if (!area) {
      throw new NotFoundException(`Service area with ID ${id} not found`);
    }

    return area;
  }

  async update(id: number, dto: UpdateServiceAreaDto): Promise<ServiceArea> {
    const existing = await this.repo.findOneBy({ id });
    if (!existing) {
      throw new NotFoundException(`Service area with ID ${id} not found`);
    }

    const updated = this.repo.merge(existing, dto);
    return await this.repo.save(updated);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.repo.findOneBy({ id });
    if (!existing) {
      throw new NotFoundException(`Service area with ID ${id} not found`);
    }

    await this.repo.remove(existing);
  }
}
