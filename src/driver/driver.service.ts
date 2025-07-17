import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";
import { Driver } from "./entities/driver.entity";
import { CreateDriverDto, VerifyDriverOtpDto } from "./dto/create-driver.dto";
import { UpdateDriverDto } from "./dto/update-driver.dto";
import { OtpService } from "../otp/otp.service";
import { JwtTokenService } from "../auth/jwt.service";
import { SendOtpDto } from "../otp/dto/otp.dto";
import * as bcrypt from "bcrypt";
import { Request, Response } from "express";
import { redisClient } from "../redis/redis.provider";
import { TelegramService } from "../telegram/telegram.service";
import {  UpdateDriverDocumentsApiDto } from "./dto/update-license.dto";

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(Driver)
    private readonly drivers: Repository<Driver>,
    private readonly otp: OtpService,
    private readonly jwtService: JwtTokenService,
    private readonly telegramService: TelegramService
  ) {}

  /**
   * Create a new driver (Admin only)
   */
  async create(createDriverDto: CreateDriverDto) {
    try {
      // Check if driver with phone number already exists
      const existingDriver = await this.drivers.findOneBy({
        phone_number: createDriverDto.phone_number,
      });

      if (existingDriver) {
        throw new ConflictException(
          "Driver with this phone number already exists"
        );
      }

      const driver = this.drivers.create(createDriverDto);
      const savedDriver = await this.drivers.save(driver);

      // Return driver without sensitive information
      const { refresh_token, ...driverResponse } = savedDriver;
      return {
        ...driverResponse,
        profile_complete: Boolean(
          savedDriver.first_name &&
            savedDriver.last_name &&
            savedDriver.driver_license_number
        ),
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException("Failed to create driver");
    }
  }

  /**
   * Get all drivers (Admin only)
   */
  async findAll(): Promise<any[]> {
    try {
      const drivers = await this.drivers.find({
        select: [
          "id",
          "phone_number",
          "first_name",
          "last_name",
          "driver_license_number",
          "is_active",
          "is_verified",
          // "created_at",
          // "updated_at",
        ],
      });

      return drivers.map((driver) => ({
        ...driver,
        profile_complete: Boolean(
          driver.first_name && driver.last_name && driver.driver_license_number
        ),
      }));
    } catch (error) {
      throw new InternalServerErrorException("Failed to retrieve drivers");
    }
  }

  /**
   * Get driver by ID
   */
  async findOne(id: number): Promise<any> {
    try {
      const driver = await this.drivers.findOne({
        where: { id },
        relations: ["sessions"],
        select: [
          "id",
          "phone_number",
          "first_name",
          "last_name",
          "driver_license_number",
          "is_active",
          "is_verified",
          // "created_at",
          // "updated_at",
        ],
      });

      if (!driver) {
        throw new NotFoundException(`Driver with ID ${id} not found`);
      }

      return {
        ...driver,
        profile_complete: Boolean(
          driver.first_name && driver.last_name && driver.driver_license_number
        ),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException("Failed to retrieve driver");
    }
  }

  /**
   * Update driver information
   */
  async update(
    id: number,
    updateDriverDto: UpdateDriverDto
  ): Promise<{ message: string }> {
    try {
      const existingDriver = await this.drivers.findOneBy({ id });
      if (!existingDriver) {
        throw new NotFoundException(`Driver with ID ${id} not found`);
      }

      // Check if phone number is being updated and already exists
      if (
        updateDriverDto.phone_number &&
        updateDriverDto.phone_number !== existingDriver.phone_number
      ) {
        const phoneExists = await this.drivers.findOneBy({
          phone_number: updateDriverDto.phone_number,
        });
        if (phoneExists) {
          throw new ConflictException("Phone number already exists");
        }
      }

      const result = await this.drivers.update({ id }, updateDriverDto);

      if (result.affected === 0) {
        throw new NotFoundException(`Driver with ID ${id} not found`);
      }

      return { message: "Driver updated successfully" };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException("Failed to update driver");
    }
  }

  /**
   * Delete driver
   */
  async remove(id: number): Promise<{ message: string }> {
    try {
      const driver = await this.drivers.findOneBy({ id });
      if (!driver) {
        throw new NotFoundException(`Driver with ID ${id} not found`);
      }

      const result = await this.drivers.delete(id);

      if (result.affected === 0) {
        throw new NotFoundException(`Driver with ID ${id} not found`);
      }

      return { message: "Driver deleted successfully" };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException("Failed to delete driver");
    }
  }

  /**
   * Send OTP to driver's phone number
   */
  async sendOtp(sendOtpDto: SendOtpDto) {
    const { phone_number } = sendOtpDto;

    try {
      // Check if driver exists
      const existingDriver = await this.drivers.findOneBy({ phone_number });

      // Generate and send OTP
      const new_otp = await this.otp.storeOtp(phone_number);
      await this.telegramService.sendOtpToChannel(
        new_otp,
        phone_number,
        "driver"
      );

      return {
        message: "OTP sent successfully",
        requires_registration: !existingDriver,
        phone_number,
        // Remove new_otp from production - only for testing
        new_otp: new_otp,
      };
    } catch (error) {
      console.error("OTP sending error:", error);
      throw new BadRequestException("Failed to send OTP");
    }
  }

  /**
   * Verify OTP and authenticate/register driver
   */
  async verifyOtpAndAuth(verifyOtpDto: VerifyDriverOtpDto, res: Response) {
    const { phone_number, otp } = verifyOtpDto;

    try {
      // Step 1: Verify OTP
      const isValidOtp = await this.otp.verifyOtp(phone_number, otp);
      if (!isValidOtp) {
        throw new UnauthorizedException("Invalid or expired OTP");
      }

      // Step 2: Check if driver exists
      let driver = await this.drivers.findOneBy({ phone_number });
      let isNew = false;

      // Step 3: Create driver if not found
      if (!driver) {
        driver = this.drivers.create({
          phone_number,
          // first_name: first_name?.trim() || null,
          is_active: true,
          is_verified: false, // Admin verification required
        });

        driver = await this.drivers.save(driver);
        isNew = true;
      }

      // Step 4: Generate tokens
      if (
        !process.env.DRIVER_REFRESH_TOKEN_KEY ||
        !process.env.DRIVER_ACCESS_TOKEN_KEY
      ) {
        throw new InternalServerErrorException(
          "JWT secret keys are not configured."
        );
      }

      const { accessToken, refreshToken } = this.jwtService.generateTokens(
        {
          id: driver.id,
          phone_number: driver.phone_number,
          role: "driver",
          is_active: driver.is_active,
          is_verified: driver.is_verified,
        },
        process.env.DRIVER_REFRESH_TOKEN_KEY,
        process.env.DRIVER_ACCESS_TOKEN_KEY
      );

      // Step 5: Hash and save refresh token
      const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);
      await this.drivers.update(
        { id: driver.id },
        { refresh_token: hashedRefreshToken }
      );

      // Step 6: Set HTTP-only cookie
      res.cookie("refresh_token", refreshToken, {
        maxAge: Number(process.env.COOKIE_TIME),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      // Step 7: Return response
      return {
        message: isNew
          ? "Registration and login successful"
          : "Login successful",
        requires_registration: isNew,

        driver: {
          id: driver.id,
          phone_number: driver.phone_number,
          first_name: driver.first_name,
          last_name: driver.last_name,
          driver_license_number: driver.driver_license_number,
          is_active: driver.is_active,
          is_verified: driver.is_verified,
          profile_complete: Boolean(
            driver.first_name &&
              driver.last_name &&
              driver.driver_license_number
          ),
        },
        accessToken,
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      console.error("Authentication error:", error);
      console.error(">>> REAL AUTHENTICATION ERROR:", error);

      throw new InternalServerErrorException("Authentication failed");
    }
  }

  /**
   * Complete driver profile information
   */
  async completeProfile(
    driverId: number,
    profileData: {
      first_name: string;
      last_name: string;
      driver_license_number: string;
    }
  ) {
    const { first_name, last_name, driver_license_number } = profileData;

    try {
      // Validate required fields
      if (
        !first_name?.trim() ||
        !last_name?.trim() ||
        !driver_license_number?.trim()
      ) {
        throw new BadRequestException("All profile fields are required");
      }

      // Check if driver exists
      const driver = await this.drivers.findOneBy({ id: driverId });
      if (!driver) {
        throw new NotFoundException("Driver not found");
      }

      // Check if driver license number already exists
      const existingLicense = await this.drivers.findOne({
        where: { driver_license_number: driver_license_number.trim() },
        select: ["id"],
      });

      if (existingLicense && existingLicense.id !== driverId) {
        throw new ConflictException("Driver license number already exists");
      }

      // Update driver profile
      const result = await this.drivers.update(
        { id: driverId },
        {
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          driver_license_number: driver_license_number.trim(),
        }
      );

      if (result.affected === 0) {
        throw new NotFoundException("Driver not found");
      }

      return {
        message: "Profile completed successfully",
        driver: {
          id: driver.id,
          phone_number: driver.phone_number,
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          driver_license_number: driver_license_number.trim(),
          is_active: driver.is_active,
          is_verified: driver.is_verified,
          profile_complete: true,
        },
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      console.error("Profile completion error:", error);
      throw new InternalServerErrorException("Failed to complete profile");
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string, res: Response) {
    try {
      // Verify refresh token
      const decoded = await this.jwtService.verifyRefreshToken(
        refreshToken,
        process.env.DRIVER_REFRESH_TOKEN_KEY!
      );

      // Find driver and verify stored refresh token
      const driver = await this.drivers.findOne({
        where: { id: decoded.id },
        select: [
          "id",
          "phone_number",
          "is_active",
          "is_verified",
          "refresh_token",
        ],
      });

      if (!driver || !driver.refresh_token) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Verify refresh token hash
      const isValidRefreshToken = await bcrypt.compare(
        refreshToken,
        driver.refresh_token
      );

      if (!isValidRefreshToken) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Check if driver is still active
      if (!driver.is_active) {
        throw new UnauthorizedException("Driver account is inactive");
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } =
        this.jwtService.generateTokens(
          {
            id: driver.id,
            phone_number: driver.phone_number,
            role: "driver",
            is_active: driver.is_active,
            is_verified: driver.is_verified,
          },
          process.env.DRIVER_REFRESH_TOKEN_KEY!,
          process.env.DRIVER_ACCESS_TOKEN_KEY!
        );

      // Update stored refresh token
      const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 12);
      await this.drivers.update(
        { id: driver.id },
        { refresh_token: hashedNewRefreshToken }
      );

      // Set new cookie
      res.cookie("refresh_token", newRefreshToken, {
        maxAge: Number(process.env.COOKIE_TIME),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      return {
        message: "Token refreshed successfully",
        accessToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error("Token refresh error:", error);
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  /**
   * Driver logout - clear tokens and cookies
   */
  async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies["refresh_token"];

      if (!refreshToken) {
        throw new BadRequestException("Refresh token missing");
      }

      // Verify and decode refresh token
      const decoded = await this.jwtService.verifyRefreshToken(
        refreshToken,
        process.env.DRIVER_REFRESH_TOKEN_KEY!
      );

      // Find driver and verify stored refresh token
      const driver = await this.drivers.findOne({
        where: { id: decoded.id },
        select: ["id", "refresh_token"],
      });

      if (!driver || !driver.refresh_token) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Verify refresh token hash
      const isValidRefreshToken = await bcrypt.compare(
        refreshToken,
        driver.refresh_token
      );

      if (!isValidRefreshToken) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Clear refresh token in database
      await this.drivers.update({ id: driver.id }, { refresh_token: null });

      // Clear refresh token cookie
      res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      return {
        message: "Logged out successfully",
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      console.error("Logout error:", error);
      throw new InternalServerErrorException("Logout failed");
    }
  }

  /**
   * Get driver profile information
   */
  async getProfile(refreshToken: string) {
    try {
      // Verify refresh token
      const decoded = await this.jwtService.verifyRefreshToken(
        refreshToken,
        process.env.DRIVER_REFRESH_TOKEN_KEY!
      );

      // Find driver with profile information
      const driver = await this.drivers.findOne({
        where: { id: decoded.id },
        select: [
          "id",
          "phone_number",
          "first_name",
          "last_name",
          "driver_license_number",
          "is_active",
          "is_verified",
          "refresh_token",
          // "created_at",
          // "updated_at",
        ],
      });

      if (!driver || !driver.refresh_token) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Verify refresh token hash
      const isValidRefreshToken = await bcrypt.compare(
        refreshToken,
        driver.refresh_token
      );

      if (!isValidRefreshToken) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Check if driver is still active
      if (!driver.is_active) {
        throw new UnauthorizedException("Driver account is inactive");
      }

      // Return profile without sensitive data
      const { refresh_token, ...profileData } = driver;

      return {
        ...profileData,
        profile_complete: Boolean(
          driver.first_name && driver.last_name && driver.driver_license_number
        ),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error("Profile retrieval error:", error);
      throw new InternalServerErrorException("Failed to retrieve profile");
    }
  }

  /**
   * Get driver by phone number (internal use)
   */
  async findByPhoneNumber(phone_number: string): Promise<Driver | null> {
    try {
      return await this.drivers.findOneBy({ phone_number });
    } catch (error) {
      console.error("Find by phone number error:", error);
      return null;
    }
  }

  /**
   * Update driver verification status (Admin only)
   */
  async updateVerificationStatus(
    driverId: number,
    isVerified: boolean
  ): Promise<{ message: string }> {
    try {
      const driver = await this.drivers.findOneBy({ id: driverId });
      if (!driver) {
        throw new NotFoundException(`Driver with ID ${driverId} not found`);
      }

      const result = await this.drivers.update(
        { id: driverId },
        { is_verified: isVerified }
      );

      if (result.affected === 0) {
        throw new NotFoundException(`Driver with ID ${driverId} not found`);
      }

      return {
        message: `Driver ${isVerified ? "verified" : "unverified"} successfully`,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error("Verification update error:", error);
      throw new InternalServerErrorException(
        "Failed to update verification status"
      );
    }
  }

  /**
   * Update driver active status (Admin only)
   */
  async updateActiveStatus(
    driverId: number,
    isActive: boolean
  ): Promise<{ message: string }> {
    try {
      const driver = await this.drivers.findOneBy({ id: driverId });
      if (!driver) {
        throw new NotFoundException(`Driver with ID ${driverId} not found`);
      }

      const result = await this.drivers.update(
        { id: driverId },
        { is_active: isActive }
      );

      if (result.affected === 0) {
        throw new NotFoundException(`Driver with ID ${driverId} not found`);
      }

      return {
        message: `Driver ${isActive ? "activated" : "deactivated"} successfully`,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error("Active status update error:", error);
      throw new InternalServerErrorException("Failed to update active status");
    }
  }

  /**
   * Get driver statistics (Admin only)
   */

  // import { Not, IsNull } from "typeorm"; // Make sure to import these operators

  async getDriverStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    verified: number;
    unverified: number;
    profileComplete: number;
    profileIncomplete: number;
  }> {
    try {
      const [
        total,
        active,
        inactive,
        verified,
        unverified,
        profileComplete,
        profileIncomplete,
      ] = await Promise.all([
        this.drivers.count(),
        this.drivers.count({ where: { is_active: true } }),
        this.drivers.count({ where: { is_active: false } }),
        this.drivers.count({ where: { is_verified: true } }),
        this.drivers.count({ where: { is_verified: false } }),
        this.drivers.count({
          where: {
            first_name: Not(IsNull()),
            last_name: Not(IsNull()),
            driver_license_number: Not(IsNull()),
          },
        }),
        this.drivers.count({
          where: [
            { first_name: IsNull() },
            { last_name: IsNull() },
            { driver_license_number: IsNull() },
          ],
        }),
      ]);

      return {
        total,
        active,
        inactive,
        verified,
        unverified,
        profileComplete,
        profileIncomplete,
      };
    } catch (error) {
      console.error("Stats retrieval error:", error);
      throw new InternalServerErrorException(
        "Failed to retrieve driver statistics"
      );
    }
  }

  /**
   * Search drivers by criteria (Admin only)
   */
  async searchDrivers(criteria: {
    phone_number?: string;
    first_name?: string;
    last_name?: string;
    driver_license_number?: string;
    is_active?: boolean;
    is_verified?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    drivers: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        phone_number,
        first_name,
        last_name,
        driver_license_number,
        is_active,
        is_verified,
        page = 1,
        limit = 10,
      } = criteria;

      const queryBuilder = this.drivers.createQueryBuilder("driver");

      // Build where conditions
      if (phone_number) {
        queryBuilder.andWhere("driver.phone_number LIKE :phone_number", {
          phone_number: `%${phone_number}%`,
        });
      }

      if (first_name) {
        queryBuilder.andWhere("driver.first_name LIKE :first_name", {
          first_name: `%${first_name}%`,
        });
      }

      if (last_name) {
        queryBuilder.andWhere("driver.last_name LIKE :last_name", {
          last_name: `%${last_name}%`,
        });
      }

      if (driver_license_number) {
        queryBuilder.andWhere("driver.driver_license_number LIKE :license", {
          license: `%${driver_license_number}%`,
        });
      }

      if (typeof is_active === "boolean") {
        queryBuilder.andWhere("driver.is_active = :is_active", { is_active });
      }

      if (typeof is_verified === "boolean") {
        queryBuilder.andWhere("driver.is_verified = :is_verified", {
          is_verified,
        });
      }

      // Select fields (exclude sensitive data)
      queryBuilder.select([
        "driver.id",
        "driver.phone_number",
        "driver.first_name",
        "driver.last_name",
        "driver.driver_license_number",
        "driver.is_active",
        "driver.is_verified",
        "driver.created_at",
        "driver.updated_at",
      ]);

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      // Order by creation date
      queryBuilder.orderBy("driver.created_at", "DESC");

      // Execute query
      const drivers = await queryBuilder.getMany();

      // Add profile_complete field
      const driversWithStatus = drivers.map((driver) => ({
        ...driver,
        profile_complete: Boolean(
          driver.first_name && driver.last_name && driver.driver_license_number
        ),
      }));

      return {
        drivers: driversWithStatus,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error("Driver search error:", error);
      throw new InternalServerErrorException("Failed to search drivers");
    }
  }

  async goOnline(
    driverId: number,
    lat: number,
    lng: number
  ): Promise<{ message: string }> {
    try {
      await redisClient.set(`driver:${driverId}:status`, "online");
      await redisClient.geoAdd("drivers:location", {
        longitude: lng,
        latitude: lat,
        member: driverId.toString(),
      });
      await redisClient.set(
        `driver:${driverId}:location`,
        JSON.stringify({ lat, lng })
      );
      return { message: "Driver is now online and location updated" };
    } catch (error) {
      console.error("Go online error:", error);
      throw new InternalServerErrorException("Failed to set driver online");
    }
  }

  async updateLocation(
    driverId: number,
    lat: number,
    lng: number
  ): Promise<{ message: string }> {
    try {
      const geoResult = await redisClient.geoAdd("drivers:location", {
        longitude: lng,
        latitude: lat,
        member: driverId.toString(),
      });
      console.log(`GEOADD result for driver ${driverId}:`, geoResult);

      const setResult = await redisClient.set(
        `driver:${driverId}:location`,
        JSON.stringify({ lat, lng })
      );
      console.log(`SET result for driver ${driverId}:`, setResult); // Should be "OK"

      return { message: "Driver location updated" };
    } catch (error) {
      console.error("Update location error:", error);
      throw new InternalServerErrorException(
        "Failed to update driver location"
      );
    }
  }

  async getAllDriverLocations(): Promise<
    { driverId: string; lat: number; lng: number }[]
  > {
    try {
      const driverIds = (await redisClient.zRange(
        "drivers:location",
        0,
        -1
      )) as string[];

      const locations: { driverId: string; lat: number; lng: number }[] = [];

      for (const driverId of driverIds) {
        const location = await redisClient.get(`driver:${driverId}:location`);
        if (location) {
          const { lat, lng } = JSON.parse(location);
          locations.push({ driverId, lat, lng });
        }
      }

      return locations;
    } catch (error) {
      console.error("Failed to get all driver locations:", error);
      throw new InternalServerErrorException(
        "Failed to fetch driver locations"
      );
    }
  }

  // async updateLicenseInfo(
  //   driverId: number,
  //   dto: UpdateLicenseDto
  // ): Promise<{ message: string }> {
  //   const driver = await this.drivers.findOneBy({ id: driverId });
  //   if (!driver) {
  //     throw new NotFoundException("Driver not found");
  //   }

  //   driver.driver_license_number = dto.driver_license_number;
  //   driver.driver_license_url = dto.driver_license_url;

  //   await this.drivers.save(driver);

  //   return { message: "Driver license info updated successfully" };
  // }

  async updateDocumentsInfo(
    driverId: number,
    dto: UpdateDriverDocumentsApiDto // <-- Use the new DTO here
  ): Promise<{ message: string }> {
    const driver = await this.drivers.findOneBy({ id: driverId });
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    // Manually map the fields from the DTO to the driver entity
    const { documents } = dto;

    if (documents.identityCard) {
      driver.passport_url = documents.identityCard;
    }
    if (documents.drivingLicence) {
      driver.driver_license_url = documents.drivingLicence;
    }
    if (documents.vehicleInformation) {
      driver.vehicle_technical_passport_url = documents.vehicleInformation;
    }
    // Map other potential fields
    if (documents.passengerLicence) {
      driver.passenger_license_url = documents.passengerLicence;
    }
    if (documents.selfEmploymentCertificate) {
      driver.self_employment_certificate_url =
        documents.selfEmploymentCertificate;
    }

    await this.drivers.save(driver);

    return { message: "Driver documents updated successfully" };
  }
}
