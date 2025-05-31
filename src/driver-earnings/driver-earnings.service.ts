import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DriverEarning } from "./entities/driver-earning.entity";
import { CreateDriverEarningDto } from "./dto/create-driver-earning.dto";
import { UpdateDriverEarningDto } from "./dto/update-driver-earning.dto";
import { Ride } from "../rides/entities/ride.entity";
import { Driver } from "../driver/entities/driver.entity";

@Injectable()
export class DriverEarningService {
  constructor(
    @InjectRepository(DriverEarning)
    private readonly earnings: Repository<DriverEarning>,

    @InjectRepository(Ride)
    private readonly rideRepo: Repository<Ride>,

    @InjectRepository(Driver)
    private readonly driverRepo: Repository<Driver>
  ) {}

  async create(createDto: CreateDriverEarningDto): Promise<DriverEarning> {
    const {
      driver_id,
      ride_id,
      gross_amount,
      commission_rate,
      commission_amount,
      net_amount,
      processed_at,
    } = createDto;

    // Check for existing earnings for the same ride
    const existing = await this.earnings.findOne({
      where: { ride: { id: ride_id } },
    });

    if (existing) {
      throw new BadRequestException("Earnings already recorded for this ride");
    }

    const driver = await this.driverRepo.findOne({
      where: { id: driver_id },
    });
    if (!driver) {
      throw new BadRequestException("Driver not found");
    }

    const ride = await this.rideRepo.findOne({ where: { id: ride_id } });
    if (!ride) {
      throw new BadRequestException("Ride not found");
    }

    const earning = this.earnings.create({
      driver,
      ride,
      gross_amount,
      commission_rate,
      commission_amount,
      net_amount,
      processed_at,
    });

    return this.earnings.save(earning);
  }

  findAll(): Promise<DriverEarning[]> {
    return this.earnings.find();
  }

  findOne(id: number) {
    return this.earnings.findOneBy({ id });
  }

  async update(id: number, updateDriverEarningDto: UpdateDriverEarningDto) {
    await this.earnings.update({ id }, updateDriverEarningDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.earnings.delete(id);
  }
}
