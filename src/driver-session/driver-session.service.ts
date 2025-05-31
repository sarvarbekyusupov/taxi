import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DriverSession } from "./entities/driver-session.entity";
import { CreateDriverSessionDto } from "./dto/create-driver-session.dto";
import { UpdateDriverSessionDto } from "./dto/update-driver-session.dto";
import { Driver } from "../driver/entities/driver.entity";

@Injectable()
export class DriverSessionService {
  constructor(
    @InjectRepository(DriverSession)
    private readonly sessionRepo: Repository<DriverSession>,

    @InjectRepository(Driver)
    private readonly driverRepo: Repository<Driver>
  ) {}

  async create(dto: CreateDriverSessionDto): Promise<DriverSession> {
    const driver = await this.driverRepo.findOneBy({ id: dto.driver_id });

    if (!driver) {
      throw new NotFoundException("driver not found");
    }

    const session = this.sessionRepo.create({
      ...dto,
      driver, // assign the actual Driver entity here
    });
    return this.sessionRepo.save(session);
  }

  async findAll(): Promise<DriverSession[]> {
    return this.sessionRepo.find();
  }

  async findOne(id: number): Promise<DriverSession> {
    const session = await this.sessionRepo.findOneBy({ id });
    if (!session)
      throw new NotFoundException(`Session with ID ${id} not found`);
    return session;
  }

  async update(
    id: number,
    dto: UpdateDriverSessionDto
  ): Promise<DriverSession> {
    const session = await this.findOne(id);
    Object.assign(session, dto);
    return this.sessionRepo.save(session);
  }

  async remove(id: number): Promise<void> {
    const result = await this.sessionRepo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Session with ID ${id} not found`);
  }
}
