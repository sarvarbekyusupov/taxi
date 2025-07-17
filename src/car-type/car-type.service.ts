import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCarTypeDto } from './dto/create-car-type.dto';
import { UpdateCarTypeDto } from './dto/update-car-type.dto';
import { CarType } from './entities/car-type.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';


@Injectable()
export class CarTypeService {
  // Inject the TypeORM repository for the CarType entity
  constructor(
    @InjectRepository(CarType)
    private readonly carTypeRepository: Repository<CarType>
  ) {}

  /**
   * Creates a new car type record in the database.
   * @param createCarTypeDto - The data to create the new car type.
   * @returns The newly created car type object.
   */
  async create(createCarTypeDto: CreateCarTypeDto): Promise<CarType> {
    const newCarType = this.carTypeRepository.create(createCarTypeDto);
    return this.carTypeRepository.save(newCarType);
  }

  /**
   * Retrieves all car types from the database.
   * @returns A promise that resolves to an array of car types.
   */
  async findAll(): Promise<CarType[]> {
    return this.carTypeRepository.find();
  }

  /**
   * Retrieves a single car type by its ID.
   * @param id - The ID of the car type to find.
   * @returns The found car type object.
   * @throws {NotFoundException} if no car type is found with the given ID.
   */
  async findOne(id: number): Promise<CarType> {
    const carType = await this.carTypeRepository.findOneBy({ id });
    if (!carType) {
      throw new NotFoundException(`CarType with ID #${id} not found`);
    }
    return carType;
  }

  /**
   * Updates a specific car type by its ID.
   * @param id - The ID of the car type to update.
   * @param updateCarTypeDto - The data to update the car type with.
   * @returns The updated car type object.
   */
  async update(
    id: number,
    updateCarTypeDto: UpdateCarTypeDto
  ): Promise<CarType> {
    // First, find the existing entity
    const carType = await this.findOne(id);

    // Merge the new data into the existing entity
    Object.assign(carType, updateCarTypeDto);

    // Save the updated entity
    return this.carTypeRepository.save(carType);
  }

  /**
   * Removes a car type from the database.
   * @param id - The ID of the car type to remove.
   * @returns The removed car type object.
   */
  async remove(id: number): Promise<CarType> {
    const carType = await this.findOne(id);
    return this.carTypeRepository.remove(carType);
  }
}
