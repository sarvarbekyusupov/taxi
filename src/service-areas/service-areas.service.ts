import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreateServiceAreaDto } from "./dto/create-service-area.dto";
import { UpdateServiceAreaDto } from "./dto/update-service-area.dto";
import { ServiceArea } from "./entities/service-area.entity";

@Injectable()
export class ServiceAreaService {
  constructor(
    @InjectRepository(ServiceArea)
    private readonly serviceAreaRepository: Repository<ServiceArea>
  ) {}

  async create(createDto: CreateServiceAreaDto): Promise<ServiceArea> {
    const serviceArea = this.serviceAreaRepository.create(createDto);
    return await this.serviceAreaRepository.save(serviceArea);
  }

  async findAll(): Promise<ServiceArea[]> {
    return await this.serviceAreaRepository.find();
  }

  async findOne(id: number): Promise<ServiceArea | null> {
    return await this.serviceAreaRepository.findOneBy({ id });
  }

  async update(id: number, updateDto: UpdateServiceAreaDto): Promise<void> {
    await this.serviceAreaRepository.update(id, updateDto);
  }

  async remove(id: number): Promise<void> {
    await this.serviceAreaRepository.delete(id);
  }
}
