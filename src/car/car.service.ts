import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Car } from "./entities/car.entity";
import { CreateCarDto } from "./dto/create-car.dto";
import { UpdateCarDto } from "./dto/update-car.dto";
import { Driver } from "../driver/entities/driver.entity";
import { Tariff } from "../tariff/entities/tariff.entity";

@Injectable()
export class CarService {
  constructor(
    @InjectRepository(Car)
    private readonly cars: Repository<Car>,

    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,

    @InjectRepository(Tariff)
    private readonly tariffRepository: Repository<Tariff>
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
    const [driver] = await Promise.all([
      this.driverRepository.findOneBy({ id: driver_id }),
    ]);

    // 2. Validate that both entities were found
    if (!driver) {
      // NotFoundException is more specific here than BadRequestException
      throw new NotFoundException(`Driver with ID ${driver_id} not found`);
    }

    // 3. Create the car instance
    const car = this.cars.create({
      ...carDetails, // Spread the rest of the properties (brand, model, etc.)
      driver: driver, // Assign the full Driver object
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

  /**
   * Aniq bir mashinaga ruxsat etilgan tariflarni biriktiradi.
   * @param carId - Mashinaning ID'si
   * @param tariffIds - Biriktirilishi kerak bo'lgan tariflarning ID'lari massivi
   * @returns Yangilangan mashina obyekti
   */
  async assignTariffsToCar(carId: number, tariffIds: number[]): Promise<Car> {
    // 1. Mashinani topamiz (mavjudligini tekshirish uchun)
    const car = await this.cars.findOne({ where: { id: carId } });
    if (!car) {
      throw new NotFoundException(`Car with ID ${carId} not found`);
    }

    // 2. Biriktirilishi kerak bo'lgan tarif obyektlarini topamiz
    const tariffs = await this.tariffRepository
      .createQueryBuilder()
      .where("id IN (:...ids)", { ids: tariffIds })
      .getMany();

    if (tariffs.length !== tariffIds.length) {
      // Bu ba'zi ID'lar bo'yicha tarif topilmaganini bildiradi
      throw new NotFoundException(`One or more tariffs not found.`);
    }

    // 3. TypeORM'ning munosabat (relation) xususiyatidan foydalanib,
    // mashinaga tariflarni bog'laymiz. TypeORM qolgan ishni o'zi bajaradi.
    car.eligible_tariffs = tariffs;

    // 4. O'zgarishlarni ma'lumotlar bazasiga saqlaymiz.
    // TypeORM avtomatik ravishda 'car_tariffs' jadvalini yangilaydi.
    return this.cars.save(car);
  }
}
