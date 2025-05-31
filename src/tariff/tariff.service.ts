import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Tariff } from "./entities/tariff.entity";
import { CreateTariffDto } from "./dto/create-tariff.dto";
import { UpdateTariffDto } from "./dto/update-tariff.dto";
import { ServiceArea } from "../service-areas/entities/service-area.entity";

@Injectable()
export class TariffService {
  constructor(
    @InjectRepository(Tariff)
    private readonly tariffRepository: Repository<Tariff>,
    @InjectRepository(ServiceArea)
    private readonly serviceAreaRepository: Repository<ServiceArea>
  ) {}

  // async create(createTariffDto: CreateTariffDto) {
  //   const newTariff = this.tariffRepository.create(createTariffDto);
  //   return await this.tariffRepository.save(newTariff);
  // }

  async create(dto: CreateTariffDto): Promise<Tariff> {
    const serviceArea = await this.serviceAreaRepository.findOneBy({
      id: dto.service_area_id,
    });

    if (!serviceArea) {
      throw new NotFoundException("Service area not found");
    }

    const tariff = this.tariffRepository.create({
      car_type: dto.car_type,
      base_fare: dto.base_fare,
      per_km_rate: dto.per_km_rate,
      per_minute_rate: dto.per_minute_rate,
      minimum_fare: dto.minimum_fare,
      cancellation_fee: dto.cancellation_fee,
      is_active: dto.is_active,
      service_area: serviceArea,
    });

    return this.tariffRepository.save(tariff);
  }

  async findAll() {
    return await this.tariffRepository.find();
  }

  async findOne(id: number) {
    return await this.tariffRepository.findOneBy({ id });
  }

  async update(id: number, updateTariffDto: UpdateTariffDto) {
    return await this.tariffRepository.update({ id }, updateTariffDto);
  }

  async remove(id: number) {
    return await this.tariffRepository.delete({ id });
  }
}
