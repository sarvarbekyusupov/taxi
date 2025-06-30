import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { DriverService } from "./driver.service";
import { CreateDriverDto, VerifyDriverOtpDto } from "./dto/create-driver.dto";
import { UpdateDriverDto } from "./dto/update-driver.dto";
import { SendOtpDto } from "../otp/dto/otp.dto";
import { Response, Request } from "express";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";
import { RoleGuard } from "../auth/role.guard";
import { Roles } from "../common/decorators/role.decorator";
import { UserCategoryGuard } from "../auth/user.guard";
import { redisClient } from "../redis/redis.provider";

@ApiTags("Drivers")
@Controller("drivers")
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Post()
  @ApiOperation({ summary: "Create a new driver" })
  create(@Body() createDriverDto: CreateDriverDto) {
    return this.driverService.create(createDriverDto);
  }

  @Get()
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("driver")
  @ApiOperation({ summary: "Get all drivers" })
  findAll() {
    return this.driverService.findAll();
  }

  @Get(":id")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("driver")
  @ApiOperation({ summary: "Get a driver by ID" })
  findOne(@Param("id") id: number) {
    return this.driverService.findOne(id);
  }

  @Put(":id")
  @ApiBearerAuth()
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("driver")
  @ApiOperation({ summary: "Update a driver by ID" })
  update(@Param("id") id: number, @Body() updateDriverDto: UpdateDriverDto) {
    return this.driverService.update(id, updateDriverDto);
  }

  @Delete(":id")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("driver")
  @ApiOperation({ summary: "Delete a driver by ID" })
  remove(@Param("id") id: number) {
    return this.driverService.remove(id);
  }

  // ========== AUTH ROUTES ==========

  @Post("auth/send-otp")
  @ApiOperation({ summary: "Send OTP to driver phone number" })
  sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.driverService.sendOtp(sendOtpDto);
  }

  @Post("auth/verify-otp")
  @ApiOperation({ summary: "Verify OTP and authenticate/register driver" })
  verifyOtpAndAuth(
    @Body() verifyOtpDto: VerifyDriverOtpDto,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.driverService.verifyOtpAndAuth(verifyOtpDto, res);
  }

  @Post("auth/refresh-token")
  @ApiOperation({ summary: "Refresh access token using refresh token" })
  refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token missing");
    }
    return this.driverService.refreshToken(refreshToken, res);
  }


  @Post("auth/logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Sign out driver" })
  @ApiResponse({ status: HttpStatus.OK, description: "User signed out." })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Refresh token missing.",
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: "User not found." })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.driverService.logout(req, res);
  }

  @Get("auth/profile")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("driver")
  @ApiOperation({ summary: "Get current driver profile" })
  getProfile(@Req() req: Request) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token missing");
    }
    return this.driverService.getProfile(refreshToken);
  }

  @Post("status")
  @ApiBearerAuth()
  @UseGuards(RoleGuard)
  @Roles("driver") // this applies the role requirement
  @ApiOperation({ summary: "Toggle driver online/offline" })
  async setOnlineStatus(@Body() body: { isOnline: boolean }, @Req() req: any) {
    const driverId = req.user.sub;
    await redisClient.set(
      `driver:${driverId}:status`,
      body.isOnline ? "online" : "offline"
    );
    return { message: `Driver is now ${body.isOnline ? "online" : "offline"}` };
  }
}
