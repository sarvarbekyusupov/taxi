import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ClientService } from "./client.service";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
import { Request, Response } from "express";
import { SendOtpDto, VerifyOtpDto } from "../otp/dto/otp.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { RoleGuard } from "../auth/role.guard";
import { UserCategoryGuard } from "../auth/user.guard";
import { Roles } from "../common/decorators/role.decorator";

@ApiTags("Client")
@Controller("client")
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  // ========== PUBLIC AUTH ROUTES (No Guards) ==========

  @Post("auth/send-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send OTP to client" })
  @ApiResponse({ status: 200, description: "OTP sent successfully" })
  sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.clientService.sendOtp(sendOtpDto);
  }

  @Post("auth/verify-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify OTP and authenticate client" })
  @ApiResponse({
    status: 200,
    description: "OTP verified and client authenticated",
  })
  verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.clientService.verifyOtpAndAuth(verifyOtpDto, res);
  }

  // ========== PROTECTED AUTH ROUTES ==========

  @Post("auth/refresh")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh authentication token" })
  @ApiResponse({ status: 200, description: "New token issued" })
  refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies["refresh_token"];
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token not found");
    }
    return this.clientService.refreshToken(refreshToken, res);
  }

  @Post("auth/logout")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("client")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Log out the client" })
  @ApiResponse({ status: 200, description: "Logged out successfully" })
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies["refresh_token"];
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token not found");
    }
    return this.clientService.logout(refreshToken, res);
  }

  @Get("auth/profile")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("client", "admin")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get client profile using refresh token" })
  @ApiResponse({ status: 200, description: "Client profile retrieved" })
  getProfile(@Req() req: Request) {
    const refreshToken = req.cookies["refresh_token"];
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token not found");
    }
    return this.clientService.getProfile(refreshToken);
  }

  // ========== CLIENT CRUD ROUTES (Protected) ==========

  @Post()
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("client", "admin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new client" })
  @ApiResponse({ status: 201, description: "Client created successfully" })
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientService.create(createClientDto);
  }

  @Get()
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("client", "admin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all clients" })
  @ApiResponse({ status: 200, description: "List of clients" })
  findAll() {
    return this.clientService.findAll();
  }

  @Get(":id")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("client", "admin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get client by ID" })
  @ApiResponse({ status: 200, description: "Client found" })
  findOne(@Param("id") id: string) {
    return this.clientService.findOne(+id);
  }

  @Patch(":id")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("client", "admin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update client by ID" })
  @ApiResponse({ status: 200, description: "Client updated successfully" })
  update(@Param("id") id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientService.update(+id, updateClientDto);
  }

  @Delete(":id")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("client", "admin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete client by ID" })
  @ApiResponse({ status: 200, description: "Client deleted successfully" })
  remove(@Param("id") id: string) {
    return this.clientService.remove(+id);
  }
}
