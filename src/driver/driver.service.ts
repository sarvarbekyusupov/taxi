import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Driver } from "./entities/driver.entity";
import { CreateDriverDto } from "./dto/create-driver.dto";
import { UpdateDriverDto } from "./dto/update-driver.dto";

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(Driver)
    private readonly repo: Repository<Driver>
  ) {}

  create(dto: CreateDriverDto) {
    const driver = this.repo.create(dto);
    return this.repo.save(driver);
  }

  findAll() {
    return this.repo.find();
  }

  findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  update(id: number, dto: UpdateDriverDto) {
    return this.repo.update(id, dto);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }
}
