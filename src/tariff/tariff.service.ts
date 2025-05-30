import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Tariff } from "./entities/tariff.entity";
import { CreateTariffDto } from "./dto/create-tariff.dto";
import { UpdateTariffDto } from "./dto/update-tariff.dto";

@Injectable()
export class TariffService {
  constructor(
    @InjectRepository(Tariff)
    private readonly tariffRepository: Repository<Tariff>
  ) {}

  async create(createTariffDto: CreateTariffDto) {
    const newTariff = this.tariffRepository.create(createTariffDto);
    return await this.tariffRepository.save(newTariff);
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
