import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Car } from "./entities/car.entity";
import { CreateCarDto } from "./dto/create-car.dto";
import { UpdateCarDto } from "./dto/update-car.dto";

@Injectable()
export class CarService {
  constructor(
    @InjectRepository(Car)
    private readonly cars: Repository<Car>
  ) {}

  create(dto: CreateCarDto) {
    const car = this.cars.create(dto);
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
