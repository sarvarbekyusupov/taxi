import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Driver } from "./entities/driver.entity";
import { CreateDriverDto, VerifyDriverOtpDto } from "./dto/create-driver.dto";
import { UpdateDriverDto } from "./dto/update-driver.dto";
import { OtpService } from "../otp/otp.service";
import { JwtTokenService } from "../auth/jwt.service";
import { SendOtpDto, VerifyOtpDto } from "../otp/dto/otp.dto";
import * as bcrypt from 'bcrypt';
import { Request, Response } from "express";

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepo: Repository<Driver>,
    private readonly otp: OtpService,
    private readonly jwtService: JwtTokenService
  ) {}

  create(dto: CreateDriverDto) {
    const driver = this.driverRepo.create(dto);
    return this.driverRepo.save(driver);
  }

  findAll() {
    return this.driverRepo.find();
  }

  findOne(id: number) {
    return this.driverRepo.findOneBy({ id });
  }

  update(id: number, dto: UpdateDriverDto) {
    return this.driverRepo.update(id, dto);
  }

  remove(id: number) {
    return this.driverRepo.delete(id);
  }

  // Step 1: Send OTP to phone number
  async sendOtp(sendOtpDto: SendOtpDto) {
    const { phone_number } = sendOtpDto;

    try {
      const existingDriver = await this.driverRepo.findOneBy({ phone_number });
      const otp = await this.otp.storeOtp(phone_number);

      return {
        message: "OTP sent successfully",
        phone_number,
        requires_registration: !existingDriver,
        new_otp: otp, // For testing/demo only — remove in production
      };
    } catch (error) {
      throw new BadRequestException("Failed to send OTP");
    }
  }

  // Step 2: Verify OTP and authenticate/register user
  async verifyOtpAndAuth(dto: VerifyDriverOtpDto, res: Response) {
    const { phone_number, otp, first_name, last_name, driver_license_number } =
      dto;

    // Verify the OTP
    const isValidOtp = await this.otp.verifyOtp(phone_number, otp);
    if (!isValidOtp) {
      throw new UnauthorizedException("Invalid or expired OTP");
    }

    let driver = await this.driverRepo.findOneBy({ phone_number });

    // If client doesn't exist, create new one
    if (!driver) {
      if (!first_name || !last_name || !driver_license_number) {
        throw new BadRequestException("Missing required registration fields");
      }

      driver = this.driverRepo.create({
        phone_number,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        driver_license_number: driver_license_number.trim(),
        is_active: true,
        is_verified: false,
      });

      driver = await this.driverRepo.save(driver);
    }

    // Generate tokens
    const { accessToken, refreshToken } = this.jwtService.generateTokens(
      {
        id: driver.id,
        phone_number: driver.phone_number,
        role: "client",
        is_active: driver.is_active,
        is_verified: driver.is_verified,
      },
      process.env.CLIENT_REFRESH_TOKEN_KEY!,
      process.env.CLIENT_ACCESS_TOKEN_KEY!
    );

    // Hash and store refresh token
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);
    await this.driverRepo.update(
      { id: driver.id },
      { refresh_token: hashedRefreshToken }
    );

    // Set secure cookie
    res.cookie("refresh_token", refreshToken, {
      maxAge: Number(process.env.COOKIE_TIME),
      httpOnly: true,
    });
    return {
      message: driver
        ? "Login successful"
        : "Registration and login successful",
      driver: {
        id: driver.id,
        phone_number: driver.phone_number,
        first_name: driver.first_name,
        last_name: driver.last_name,
      },
      accessToken,
    };
  }

  // Refresh token endpoint
  async refreshToken(refreshToken: string, res: Response) {
    try {
      const decoded = await this.jwtService.verifyRefreshToken(
        refreshToken,
        process.env.CLIENT_REFRESH_TOKEN_KEY!
      );

      // Find client and verify stored refresh token
      const driver = await this.driverRepo.findOneBy({ id: decoded.id });
      if (!driver || !driver.refresh_token) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      const isValidRefreshToken = await bcrypt.compare(
        refreshToken,
        driver.refresh_token
      );
      if (!isValidRefreshToken) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } =
        this.jwtService.generateTokens(
          {
            id: driver.id,
            phone_number: driver.phone_number,
            role: "driver",
            is_active: driver.is_active,
          },
          process.env.CLIENT_REFRESH_TOKEN_KEY!,
          process.env.CLIENT_ACCESS_TOKEN_KEY!
        );

      // Update stored refresh token
      const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 12);
      await this.driverRepo.update(
        { id: driver.id },
        { refresh_token: hashedNewRefreshToken }
      );

      // Set new cookie
      res.cookie("refresh_token", newRefreshToken, {
        maxAge: Number(process.env.COOKIE_TIME),
        httpOnly: true,
      });

      return {
        message: "Token refreshed successfully",
        accessToken,
      };
    } catch (error) {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  // Logout
  async logout(req: Request, res: Response) {

    const refreshToken = req.cookies["refresh_token"];
    if (!refreshToken) {
      throw new BadRequestException("Refresh token missing");
    }
    console.log(refreshToken);

    const decoded = await this.jwtService.verifyRefreshToken(
      refreshToken,
      process.env.CLIENT_REFRESH_TOKEN_KEY!
    );

    // Find client and verify stored refresh token
    const driver = await this.driverRepo.findOneBy({ id: decoded.id });
    if (!driver || !driver.refresh_token) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Clear refresh token in the database
    await this.driverRepo.update({ id: driver.id }, { refresh_token: null });

    // Clear refresh token cookie
    res.clearCookie("refresh_token");

    return {
      message: "Logged out successfully",
    };
  }

  async getProfile(refreshToken: string) {
    const driver = await this.driverRepo.findOne({
      where: { refresh_token: refreshToken },
    });

    if (!driver) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    return {
      id: driver.id,
      phone_number: driver.phone_number,
      // name: client.name,
      is_active: driver.is_active,
    };
  }
}
