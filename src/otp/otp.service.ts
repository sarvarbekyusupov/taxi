import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Otp } from "./entities/otp.entity";
import { CreateOtpDto } from "./dto/create-otp.dto";
import { UpdateOtpDto } from "./dto/update-otp.dto";

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private readonly otpRepo: Repository<Otp>
  ) {}

  async create(dto: CreateOtpDto): Promise<Otp> {
    const otp = this.otpRepo.create(dto);
    return this.otpRepo.save(otp);
  }

  async findAll(): Promise<Otp[]> {
    return this.otpRepo.find();
  }

  async findOne(id: number): Promise<Otp> {
    const otp = await this.otpRepo.findOneBy({ id });
    if (!otp) throw new NotFoundException(`OTP with ID ${id} not found`);
    return otp;
  }

  async update(id: number, dto: UpdateOtpDto): Promise<Otp> {
    const otp = await this.findOne(id);
    Object.assign(otp, dto);
    return this.otpRepo.save(otp);
  }

  async remove(id: number): Promise<void> {
    const result = await this.otpRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`OTP with ID ${id} not found`);
    }
  }

  async storeOtp(phoneNumber: string, otp: string): Promise<void> {
    const hashedOtp = await bcrypt.hash(otp, 10);
    await this.redis.set(`otp:${phoneNumber}`, hashedOtp, "EX", 300); // expires in 5 min
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
    const hashedOtp = await this.redis.get(`otp:${phoneNumber}`);
    if (!hashedOtp) return false;

    const isMatch = await bcrypt.compare(otp, hashedOtp);
    if (isMatch) {
      await this.redis.del(`otp:${phoneNumber}`); // clear once used
    }
    return isMatch;
  }
}
