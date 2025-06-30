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

  async findAll(): Promise<Car[]> {
    return this.cars.find({ relations: ["driver"] });
  }

  async findOne(id: number): Promise<Car> {
    const car = await this.cars.findOne({
      where: { id },
      relations: ["driver"],
    });
    if (!car) {
      throw new BadRequestException(`Car with ID ${id} not found`);
    }
    return car;
  }

  async update(id: number, dto: UpdateCarDto): Promise<{ message: string }> {
    const car = await this.cars.findOneBy({ id });
    if (!car) {
      throw new BadRequestException(`Car with ID ${id} not found`);
    }
    await this.cars.update({ id }, dto);
    return { message: "Car updated successfully" };
  }

  async remove(id: number): Promise<{ message: string }> {
    const car = await this.cars.findOneBy({ id });
    if (!car) {
      throw new BadRequestException(`Car with ID ${id} not found`);
    }
    await this.cars.delete({ id });
    return { message: "Car deleted successfully" };
  }
}
