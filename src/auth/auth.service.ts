import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as otpGenerator from "otp-generator";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Client } from "../client/entities/client.entity";
import { OtpService } from "../otp/otp.service";

@Injectable()
export class AuthService {
  // constructor(
    // @InjectRepository(Client)
    // private readonly clientRepo: Repository<Client>,
    // private readonly otpService: OtpService,
    // private readonly jwtService: JwtService
  // ) {}

  // async sendOtp(phone_number: string) {
  //   const otp = otpGenerator.generate(4, {
  //     upperCaseAlphabets: false,
  //     specialChars: false,
  //     alphabets: false,
  //   });

  //   await this.otpService.storeOtp(phone_number);
  //   // TODO: send OTP via SMS (integration placeholder)
  //   return { message: "OTP sent successfully" };
  // }

  // async verifyOtp(phone_number: string, otp: string) {
  //   const isValid = await this.otpService.verifyOtp(phone_number, otp);
  //   if (!isValid) {
  //     throw new UnauthorizedException("Invalid OTP");
  //   }

  //   const client = await this.clientRepo.findOne({ where: { phone_number } });

  //   if (client?.name) {
  //     const payload = { sub: client.id, type: "client" };
  //     const token = this.jwtService.sign(payload, { expiresIn: "9999 years" }); // simulate no expiry
  //     return { access_token: token, is_new: false };
  //   }

  //   return { is_new: true }; // name step required
  // }

  // async completeSignup(phone_number: string, name: string) {
  //   let client = await this.clientRepo.findOne({ where: { phone_number } });

  //   if (!client) {
  //     client = this.clientRepo.create({ phone_number, name });
  //   } else {
  //     client.name = name;
  //   }

  //   await this.clientRepo.save(client);

  //   const payload = { sub: client.id, type: "client" };
  //   const token = this.jwtService.sign(payload, { expiresIn: "9999 years" });

  //   return { access_token: token };
  // }
}
