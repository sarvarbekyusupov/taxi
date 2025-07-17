import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Car } from "./entities/car.entity";
import { CreateCarDto } from "./dto/create-car.dto";
import { UpdateCarDto } from "./dto/update-car.dto";
import { Driver } from "../driver/entities/driver.entity";
import { CarType } from "../car-type/entities/car-type.entity";

@Injectable()
export class CarService {
  constructor(
    @InjectRepository(Car)
    private readonly cars: Repository<Car>,

    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,

    @InjectRepository(CarType) // <-- Add this
    private readonly carTypeRepository: Repository<CarType>
  ) {}

  // async create(dto: CreateCarDto): Promise<Car> {
  //   const {
  //     driver_id,
  //     brand,
  //     model,
  //     year,
  //     license_plate,
  //     color,
  //     car_type,
  //     registration_document_url,
  //     insurance_document_url,
  //     is_active,
  //   } = dto;

  //   const driver = await this.driverRepository.findOne({
  //     where: { id: driver_id },
  //   });
  //   if (!driver) {
  //     throw new BadRequestException("Driver not found");
  //   }

  //   const car = this.cars.create({
  //     driver,
  //     brand,
  //     model,
  //     year,
  //     license_plate,
  //     color,
  //     car_type,
  //     registration_document_url,
  //     insurance_document_url,
  //     is_active,
  //   });

  //   return this.cars.save(car);
  // }

  async create(dto: CreateCarDto): Promise<Car> {
    // Assuming your DTO has driver_id and car_type_id
    const { driver_id, car_type_id, ...carDetails } = dto;

    // 1. Fetch both related entities at the same time for better performance
    const [driver, carType] = await Promise.all([
      this.driverRepository.findOneBy({ id: driver_id }),
      this.carTypeRepository.findOneBy({ id: car_type_id }),
    ]);

    // 2. Validate that both entities were found
    if (!driver) {
      // NotFoundException is more specific here than BadRequestException
      throw new NotFoundException(`Driver with ID ${driver_id} not found`);
    }
    if (!carType) {
      throw new NotFoundException(`CarType with ID ${car_type_id} not found`);
    }

    // 3. Create the car instance
    const car = this.cars.create({
      ...carDetails, // Spread the rest of the properties (brand, model, etc.)
      driver: driver, // Assign the full Driver object
      car_type: carType, // Assign the full CarType object
    });

    // 4. Save the new car with its relations correctly linked
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
