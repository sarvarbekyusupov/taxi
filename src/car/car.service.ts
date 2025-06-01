import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Car } from "./entities/car.entity";
import { CreateCarDto } from "./dto/create-car.dto";
import { UpdateCarDto } from "./dto/update-car.dto";
import { Driver } from "../driver/entities/driver.entity";

@Injectable()
export class CarService {
  constructor(
    @InjectRepository(Car)
    private readonly cars: Repository<Car>,

    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>
  ) {}

  async create(dto: CreateCarDto): Promise<Car> {
    const {
      driver_id,
      brand,
      model,
      year,
      license_plate,
      color,
      car_type,
      registration_document_url,
      insurance_document_url,
      is_active,
    } = dto;

    const driver = await this.driverRepository.findOne({
      where: { id: driver_id },
    });
    if (!driver) {
      throw new BadRequestException("Driver not found");
    }

    const car = this.cars.create({
      driver,
      brand,
      model,
      year,
      license_plate,
      color,
      car_type,
      registration_document_url,
      insurance_document_url,
      is_active,
    });

    return this.cars.save(car);
  }

  findAll() {
    return this.cars.find();
  }

  findOne(id: number) {
    return this.cars.findOneBy({ id });
  }

  update(id: number, dto: UpdateCarDto) {
    return this.cars.update({ id }, dto);
  }

  remove(id: number) {
    return this.cars.delete({ id });
  }
}
