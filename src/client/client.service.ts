
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Client } from "./entities/client.entity";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
import { OtpService } from "../otp/otp.service";
import { JwtTokenService } from "../auth/jwt.service";
import * as bcrypt from "bcrypt";
import { Request, Response } from "express";
import { SendOtpDto, VerifyOtpDto } from "../otp/dto/otp.dto";


@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private readonly clients: Repository<Client>,
    private readonly otp: OtpService,
    private readonly jwtService: JwtTokenService
  ) {}

  async create(createClientDto: CreateClientDto) {
    const client = this.clients.create(createClientDto);
    return await this.clients.save(client);
  }

  async findAll(): Promise<Client[]> {
    return await this.clients.find();
  }

  async findOne(id: number): Promise<Client> {
    const client = await this.clients.findOneBy({ id });
    if (!client) {
      throw new BadRequestException(`Client with ID ${id} not found`);
    }
    return client;
  }

  async update(
    id: number,
    updateClientDto: UpdateClientDto
  ): Promise<{ message: string }> {
    const existingClient = await this.clients.findOneBy({ id });
    if (!existingClient) {
      throw new BadRequestException(`Client with ID ${id} not found`);
    }

    await this.clients.update({ id }, updateClientDto);
    return { message: "Client updated successfully" };
  }

  async remove(id: number): Promise<{ message: string }> {
    const client = await this.clients.findOneBy({ id });
    if (!client) {
      throw new BadRequestException(`Client with ID ${id} not found`);
    }

    await this.clients.delete(id);
    return { message: "Client deleted successfully" };
  }

  // Step 1: Send OTP to phone number
  async sendOtp(sendOtpDto: SendOtpDto) {
    const { phone_number } = sendOtpDto;

    try {
      // Check if user exists to inform frontend
      const existingClient = await this.clients.findOneBy({ phone_number });
      const new_otp = await this.otp.storeOtp(phone_number);

      return {
        message: "OTP sent successfully",
        requires_name: !existingClient, // Frontend knows if name is needed
        phone_number,
        new_otp: new_otp,
      };
    } catch (error) {
      console.error(error);
      throw new BadRequestException("Failed to send OTP");
    }
  }

  // Step 2: Verify OTP and authenticate/register user
  async verifyOtpAndAuth(verifyOtpDto: VerifyOtpDto, res: Response) {
    const { phone_number, otp, name } = verifyOtpDto;

    // Step 1: Verify the OTP
    const isValidOtp = await this.otp.verifyOtp(phone_number, otp);
    if (!isValidOtp) {
      throw new UnauthorizedException("Invalid or expired OTP");
    }

    // Step 2: Check if client already exists
    let client = await this.clients.findOneBy({ phone_number });
    let isNew = false;

    // Step 3: If not found, register new client
    if (!client) {
      client = this.clients.create({
        phone_number,
        name: name?.trim() || null, // allow null for new users
        is_active: true,
        is_verified: true,
      });

      client = await this.clients.save(client);
      isNew = true;
    } else {
      // Step 4: Update is_verified = true if it was false
      if (!client.is_verified) {
        await this.clients.update({ id: client.id }, { is_verified: true });
        client.is_verified = true; // reflect update in local object
      }
    }

    // Step 5: Generate tokens
    const { accessToken, refreshToken } = this.jwtService.generateTokens(
      {
        id: client.id,
        phone_number: client.phone_number,
        role: "client",
        is_active: client.is_active,
        is_verified: client.is_verified,
      },
      process.env.CLIENT_REFRESH_TOKEN_KEY!,
      process.env.CLIENT_ACCESS_TOKEN_KEY!
    );

    // Step 6: Hash and store refresh token in DB
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);
    await this.clients.update(
      { id: client.id },
      { refresh_token: hashedRefreshToken }
    );

    // Step 7: Set refresh token as secure HTTP-only cookie
    res.cookie("refresh_token", refreshToken, {
      maxAge: Number(process.env.COOKIE_TIME),
      httpOnly: true,
    });

    // Step 8: Return response
    return {
      message: isNew ? "Registration and login successful" : "Login successful",
      client: {
        id: client.id,
        phone_number: client.phone_number,
        name: isNew ? null : client.name,
        is_active: client.is_active,
        is_verified: client.is_verified,
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
      const client = await this.clients.findOneBy({ id: decoded.id });
      if (!client || !client.refresh_token) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      const isValidRefreshToken = await bcrypt.compare(
        refreshToken,
        client.refresh_token
      );
      if (!isValidRefreshToken) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } =
        this.jwtService.generateTokens(
          {
            id: client.id,
            phone_number: client.phone_number,
            role: "client",
            is_active: client.is_active,
          },
          process.env.CLIENT_REFRESH_TOKEN_KEY!,
          process.env.CLIENT_ACCESS_TOKEN_KEY!
        );

      // Update stored refresh token
      const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 12);
      await this.clients.update(
        { id: client.id },
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

    const decoded = await this.jwtService.verifyRefreshToken(
      refreshToken,
      process.env.CLIENT_REFRESH_TOKEN_KEY!
    );

    // Find client and verify stored refresh token
    const client = await this.clients.findOneBy({ id: decoded.id });
    if (!client || !client.refresh_token) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Clear refresh token in the database
    await this.clients.update({ id: client.id }, { refresh_token: null });

    // Clear refresh token cookie
    res.clearCookie("refresh_token");

    return {
      message: "Logged out successfully",
    };
  }

  async getProfile(refreshToken: string) {
    const decoded = await this.jwtService.verifyRefreshToken(
      refreshToken,
      process.env.CLIENT_REFRESH_TOKEN_KEY!
    );

    const client = await this.clients.findOneBy({ id: decoded.id });
    if (!client || !client.refresh_token) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const isValid = await bcrypt.compare(refreshToken, client.refresh_token);
    if (!isValid) throw new UnauthorizedException("Invalid refresh token");

    return {
      id: client.id,
      phone_number: client.phone_number,
      name: client.name,
      is_active: client.is_active,
    };
  }
}