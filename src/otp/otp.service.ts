import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Otp } from "./entities/otp.entity";
import * as bcrypt from "bcrypt";
import * as otpGenerator from "otp-generator";

const OTP_TTL_SECONDS = 300;

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private readonly otpRepo: Repository<Otp>
  ) {}

  generateOtp(): string {
    return otpGenerator.generate(4, {
      digits: true,
      lowerCaseAlphabets:false,
      upperCaseAlphabets:false,
      specialChars: false,
    });
  }

  async storeOtp(phone_number: string){
    const otp = this.generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await this.otpRepo.delete({ phone_number });

    const otpEntity = this.otpRepo.create({
      phone_number,
      otp: hashedOtp,
      createdAt: new Date(),
    });

    await this.otpRepo.save(otpEntity);

    return otp; // return it for sending via SMS
  }

  async verifyOtp(phone_number: string, otp: string){
    const record = await this.otpRepo.findOne({
      where: { phone_number },
      order: { createdAt: "DESC" },
    });

    if (!record) return false;

    const now = new Date();
    const createdAt = new Date(record.createdAt);
    const isExpired =
      (now.getTime() - createdAt.getTime()) / 1000 > OTP_TTL_SECONDS;

    if (isExpired) return false;

    const isMatch = await bcrypt.compare(otp, record.otp);
    if (isMatch) {
      await this.otpRepo.delete({ id: record.id });
    }

    return isMatch;
  }
}
