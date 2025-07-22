import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Tariff } from "./entities/tariff.entity";
import { CreateTariffDto } from "./dto/create-tariff.dto";
import { UpdateTariffDto } from "./dto/update-tariff.dto";
import { ServiceArea } from "../service-areas/entities/service-area.entity";
import { ServiceAreaService } from "../service-areas/service-areas.service";

@Injectable()
export class TariffService {
  constructor(
    @InjectRepository(Tariff)
    private readonly tariffRepository: Repository<Tariff>,
    @InjectRepository(ServiceArea)
    private readonly serviceAreaRepository: Repository<ServiceArea>,


    private readonly serviceAreaService: ServiceAreaService
  ) {}

  async create(dto: CreateTariffDto): Promise<Tariff> {
    // 1. Fetch both related entities concurrently for efficiency
    const [serviceArea,] = await Promise.all([
      this.serviceAreaRepository.findOneBy({ id: dto.service_area_id }),
    ]);

    // 2. Validate that both entities were found
    if (!serviceArea) {
      throw new NotFoundException(
        `Service area with ID ${dto.service_area_id} not found`
      );
    }
  

    // 3. Create a new tariff instance
    const tariff = this.tariffRepository.create({
      // Spread the DTO for primitive fields like base_fare, per_km_rate, etc.
      ...dto,
      // Explicitly assign the fetched relation objects. This is the key fix.
      service_area: serviceArea,
    });

    // 4. Save the new tariff with its relations correctly linked
    return this.tariffRepository.save(tariff);
  }

  async findAll() {
    return await this.tariffRepository.find({
      relations: ["service_area"],
      order: { created_at: "DESC" },
    });
  }

  async findOne(id: number) {
    const tariff = await this.tariffRepository.findOne({
      where: { id },
      relations: ["service_area"],
    });
    if (!tariff) throw new NotFoundException("Tariff not found");
    return tariff;
  }

  async update(id: number, updateTariffDto: UpdateTariffDto) {
    return await this.tariffRepository.update({ id }, updateTariffDto);
  }

  async remove(id: number) {
    return await this.tariffRepository.delete({ id });
  }

  /**
   * Finds active tariffs for a given geographic location.
   * @param lat - The latitude of the location.
   * @param lng - The longitude of the location.
   * @returns A list of matching tariffs.
   */
  async findTariffsByLocation(lat: number, lng: number): Promise<Tariff[]> {
    // 1. Find the service area using the dedicated service
    const serviceArea = await this.serviceAreaService.findAreaByCoordinates(
      lat,
      lng
    );

    if (!serviceArea) {
      throw new NotFoundException(
        "No active service area found for the provided coordinates."
      );
    }

    // 2. Find all active tariffs for that service area using the Query Builder for reliability.
    // This explicitly joins the tables and filters on the joined table's alias.
    const tariffs = await this.tariffRepository
      .createQueryBuilder("tariff")
      .leftJoinAndSelect("tariff.service_area", "service_area")
      .leftJoinAndSelect("tariff.car_type", "car_type")
      .where("service_area.id = :serviceAreaId", {
        serviceAreaId: serviceArea.id,
      })
      .andWhere("tariff.is_active = :isActive", { isActive: true })
      .getMany();

    if (!tariffs || tariffs.length === 0) {
      throw new NotFoundException(
        `No active tariffs found for service area '${serviceArea.name}'.`
      );
    }

    return tariffs;
  }
}
