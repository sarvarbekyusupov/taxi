import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Res, Req, UnauthorizedException } from '@nestjs/common';
import { ClientService,  } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Request, Response } from 'express';
import { SendOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';

@Controller("client")
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  // ============== AUTHENTICATION ROUTES ==============

  @Post("auth/send-otp")
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return await this.clientService.sendOtp(sendOtpDto);
  }

  @Post("auth/verify-otp")
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response
  ) {
    return await this.clientService.verifyOtpAndAuth(verifyOtpDto, res);
  }

  @Post("auth/refresh")
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = req.cookies["refresh_token"];
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token not found");
    }
    return await this.clientService.refreshToken(refreshToken, res);
  }

  @Post("auth/logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies["refresh_token"];
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token not found");
    }

    return await this.clientService.logout(refreshToken, res);
  }

  @Get("auth/profile")
  @HttpCode(HttpStatus.OK)
  async getProfile(@Req() req: Request) {
    const refreshToken = req.cookies["refresh_token"];
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token not found");
    }

    return await this.clientService.getProfile(refreshToken);
  }

  @Post()
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientService.create(createClientDto);
  }

  @Get()
  findAll() {
    return this.clientService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.clientService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientService.update(+id, updateClientDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.clientService.remove(+id);
  }
}
