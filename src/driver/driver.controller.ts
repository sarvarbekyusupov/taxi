// import {
//   Body,
//   Controller,
//   Get,
//   Param,
//   Post,
//   Put,
//   Delete,
//   Req,
//   Res,
//   UnauthorizedException,
//   UseGuards,
//   HttpCode,
//   HttpStatus,
//   ParseIntPipe,
// } from "@nestjs/common";
// import { DriverService } from "./driver.service";
// import { CreateDriverDto, VerifyDriverOtpDto } from "./dto/create-driver.dto";
// import { UpdateDriverDto } from "./dto/update-driver.dto";
// import { SendOtpDto } from "../otp/dto/otp.dto";
// import { Response, Request } from "express";
// import {
//   ApiTags,
//   ApiOperation,
//   ApiBearerAuth,
//   ApiResponse,
//   ApiBody,
//   ApiCookieAuth,
//   ApiParam,
//   ApiConsumes,
//   ApiProduces,
// } from "@nestjs/swagger";
// import { RoleGuard } from "../auth/role.guard";
// import { Roles } from "../common/decorators/role.decorator";
// import { UserCategoryGuard } from "../auth/user.guard";
// import { redisClient } from "../redis/redis.provider";

// // Response DTOs for better Swagger documentation
// class DriverResponseDto {
//   id: number;
//   phone_number: string;
//   first_name?: string;
//   last_name?: string;
//   driver_license_number?: string;
//   is_active: boolean;
//   is_verified: boolean;
//   profile_complete: boolean;
//   created_at?: Date;
//   updated_at?: Date;
// }

// class AuthResponseDto {
//   message: string;
//   driver: DriverResponseDto;
//   accessToken: string;
// }

// class OtpResponseDto {
//   message: string;
//   requires_registration: boolean;
//   phone_number: string;
// }

// class TokenRefreshResponseDto {
//   message: string;
//   accessToken: string;
// }

// class ProfileCompleteDto {
//   first_name: string;
//   last_name: string;
//   driver_license_number: string;
// }

// class StatusToggleDto {
//   isOnline: boolean;
// }

// class StandardResponseDto {
//   message: string;
// }

// @ApiTags("Driver Management")
// @Controller("drivers")
// @ApiProduces("application/json")
// export class DriverController {
//   constructor(private readonly driverService: DriverService) {}

//   // ========== ADMIN DRIVER MANAGEMENT ==========

//   @Post()
//   @UseGuards(RoleGuard, UserCategoryGuard)
//   @Roles("admin")
//   @ApiBearerAuth()
//   @HttpCode(HttpStatus.CREATED)
//   @ApiOperation({
//     summary: "Create a new driver",
//     description: "Create a new driver account. Admin access required.",
//   })
//   @ApiConsumes("application/json")
//   @ApiBody({
//     type: CreateDriverDto,
//     description: "Driver creation data",
//   })
//   @ApiResponse({
//     status: HttpStatus.CREATED,
//     description: "Driver created successfully",
//     type: DriverResponseDto,
//   })
//   @ApiResponse({
//     status: HttpStatus.BAD_REQUEST,
//     description: "Invalid input data",
//     schema: {
//       type: "object",
//       properties: {
//         statusCode: { type: "number", example: 400 },
//         message: { type: "string", example: "Phone number already exists" },
//         error: { type: "string", example: "Bad Request" },
//       },
//     },
//   })
//   @ApiResponse({
//     status: HttpStatus.UNAUTHORIZED,
//     description: "Unauthorized access",
//   })
//   @ApiResponse({
//     status: HttpStatus.FORBIDDEN,
//     description: "Insufficient permissions",
//   })
//   create(@Body() createDriverDto: CreateDriverDto) {
//     return this.driverService.create(createDriverDto);
//   }

//   @Get()
//   @UseGuards(RoleGuard, UserCategoryGuard)
//   @Roles("admin")
//   @ApiBearerAuth()
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({
//     summary: "Get all drivers",
//     description: "Retrieve a list of all drivers. Admin access required.",
//   })
//   @ApiResponse({
//     status: HttpStatus.OK,
//     description: "List of drivers retrieved successfully",
//     type: [DriverResponseDto],
//   })
//   @ApiResponse({
//     status: HttpStatus.UNAUTHORIZED,
//     description: "Unauthorized access",
//   })
//   @ApiResponse({
//     status: HttpStatus.FORBIDDEN,
//     description: "Insufficient permissions",
//   })
//   findAll() {
//     return this.driverService.findAll();
//   }

//   @Get(":id")
//   @UseGuards(RoleGuard, UserCategoryGuard)
//   @Roles("admin", "driver")
//   @ApiBearerAuth()
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({
//     summary: "Get driver by ID",
//     description:
//       "Retrieve a specific driver by their ID. Admin or driver access required.",
//   })
//   @ApiParam({
//     name: "id",
//     type: "number",
//     description: "Driver ID",
//     example: 1,
//   })
//   @ApiResponse({
//     status: HttpStatus.OK,
//     description: "Driver retrieved successfully",
//     type: DriverResponseDto,
//   })
//   @ApiResponse({
//     status: HttpStatus.BAD_REQUEST,
//     description: "Driver not found",
//     schema: {
//       type: "object",
//       properties: {
//         statusCode: { type: "number", example: 400 },
//         message: { type: "string", example: "Driver with ID 1 not found" },
//         error: { type: "string", example: "Bad Request" },
//       },
//     },
//   })
//   @ApiResponse({
//     status: HttpStatus.UNAUTHORIZED,
//     description: "Unauthorized access",
//   })
//   findOne(@Param("id", ParseIntPipe) id: number) {
//     return this.driverService.findOne(id);
//   }

//   @Put(":id")
//   @UseGuards(RoleGuard, UserCategoryGuard)
//   @Roles("admin", "driver")
//   @ApiBearerAuth()
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({
//     summary: "Update driver",
//     description: "Update driver information. Admin or driver access required.",
//   })
//   @ApiParam({
//     name: "id",
//     type: "number",
//     description: "Driver ID",
//     example: 1,
//   })
//   @ApiBody({
//     type: UpdateDriverDto,
//     description: "Driver update data",
//   })
//   @ApiResponse({
//     status: HttpStatus.OK,
//     description: "Driver updated successfully",
//     type: StandardResponseDto,
//   })
//   @ApiResponse({
//     status: HttpStatus.BAD_REQUEST,
//     description: "Driver not found or invalid data",
//   })
//   @ApiResponse({
//     status: HttpStatus.UNAUTHORIZED,
//     description: "Unauthorized access",
//   })
//   update(
//     @Param("id", ParseIntPipe) id: number,
//     @Body() updateDriverDto: UpdateDriverDto
//   ) {
//     return this.driverService.update(id, updateDriverDto);
//   }

//   @Delete(":id")
//   @UseGuards(RoleGuard, UserCategoryGuard)
//   @Roles("admin")
//   @ApiBearerAuth()
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({
//     summary: "Delete driver",
//     description: "Delete a driver account. Admin access required.",
//   })
//   @ApiParam({
//     name: "id",
//     type: "number",
//     description: "Driver ID",
//     example: 1,
//   })
//   @ApiResponse({
//     status: HttpStatus.OK,
//     description: "Driver deleted successfully",
//     type: StandardResponseDto,
//   })
//   @ApiResponse({
//     status: HttpStatus.BAD_REQUEST,
//     description: "Driver not found",
//   })
//   @ApiResponse({
//     status: HttpStatus.UNAUTHORIZED,
//     description: "Unauthorized access",
//   })
//   @ApiResponse({
//     status: HttpStatus.FORBIDDEN,
//     description: "Insufficient permissions",
//   })
//   remove(@Param("id", ParseIntPipe) id: number) {
//     return this.driverService.remove(id);
//   }

//   // ========== DRIVER AUTHENTICATION ==========

//   @Post("auth/send-otp")
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({
//     summary: "Send OTP to driver",
//     description:
//       "Send a one-time password to the driver's phone number for authentication.",
//   })
//   @ApiBody({
//     type: SendOtpDto,
//     description: "Phone number for OTP delivery",
//     examples: {
//       example1: {
//         summary: "Send OTP",
//         description: "Send OTP to a phone number",
//         value: {
//           phone_number: "+998901234567",
//         },
//       },
//     },
//   })
//   @ApiResponse({
//     status: HttpStatus.OK,
//     description: "OTP sent successfully",
//     type: OtpResponseDto,
//     examples: {
//       existing_driver: {
//         summary: "Existing driver",
//         // description: "OTP sent to existing driver",
//         value: {
//           message: "OTP sent successfully",
//           requires_registration: false,
//           phone_number: "+998901234567",
//         },
//       },
//       new_driver: {
//         summary: "New driver",
//         // description: "OTP sent to new driver requiring registration",
//         value: {
//           message: "OTP sent successfully",
//           requires_registration: true,
//           phone_number: "+998901234567",
//         },
//       },
//     },
//   })
//   @ApiResponse({
//     status: HttpStatus.BAD_REQUEST,
//     description: "Failed to send OTP",
//     schema: {
//       type: "object",
//       properties: {
//         statusCode: { type: "number", example: 400 },
//         message: { type: "string", example: "Failed to send OTP" },
//         error: { type: "string", example: "Bad Request" },
//       },
//     },
//   })
//   @ApiResponse({
//     status: HttpStatus.TOO_MANY_REQUESTS,
//     description: "Too many OTP requests",
//   })
//   sendOtp(@Body() sendOtpDto: SendOtpDto) {
//     return this.driverService.sendOtp(sendOtpDto);
//   }

//   @Post("auth/verify-otp")
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({
//     summary: "Verify OTP and authenticate",
//     description:
//       "Verify the OTP code and authenticate the driver. Creates new driver account if needed.",
//   })
//   @ApiBody({
//     type: VerifyDriverOtpDto,
//     description: "OTP verification data",
//     examples: {
//       example1: {
//         summary: "Verify OTP",
//         description: "Verify OTP code",
//         value: {
//           phone_number: "+998901234567",
//           otp: "123456",
//         },
//       },
//     },
//   })
//   @ApiResponse({
//     status: HttpStatus.OK,
//     description: "OTP verified and driver authenticated",
//     type: AuthResponseDto,
//     examples: {
//       existing_driver: {
//         summary: "Existing driver login",
//         // description: "Successful login for existing driver",
//         value: {
//           message: "Login successful",
//           driver: {
//             id: 1,
//             phone_number: "+998901234567",
//             first_name: "John",
//             last_name: "Doe",
//             driver_license_number: "DL123456789",
//             is_active: true,
//             is_verified: true,
//             profile_complete: true,
//           },
//           accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
//         },
//       },
//       new_driver: {
//         summary: "New driver registration",
//         // description: "Successful registration for new driver",
//         value: {
//           message: "Registration and login successful",
//           driver: {
//             id: 2,
//             phone_number: "+998901234567",
//             first_name: null,
//             last_name: null,
//             driver_license_number: null,
//             is_active: true,
//             is_verified: false,
//             profile_complete: false,
//           },
//           accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
//         },
//       },
//     },
//   })
//   @ApiResponse({
//     status: HttpStatus.UNAUTHORIZED,
//     description: "Invalid or expired OTP",
//     schema: {
//       type: "object",
//       properties: {
//         statusCode: { type: "number", example: 401 },
//         message: { type: "string", example: "Invalid or expired OTP" },
//         error: { type: "string", example: "Unauthorized" },
//       },
//     },
//   })
//   @ApiResponse({
//     status: HttpStatus.BAD_REQUEST,
//     description: "Invalid request data",
//   })
//   verifyOtpAndAuth(
//     @Body() verifyOtpDto: VerifyDriverOtpDto,
//     @Res({ passthrough: true }) res: Response
//   ) {
//     return this.driverService.verifyOtpAndAuth(verifyOtpDto, res);
//   }

//   @Post("auth/refresh-token")
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({
//     summary: "Refresh access token",
//     description:
//       "Generate a new access token using the refresh token from cookies.",
//   })
//   @ApiCookieAuth("refresh_token")
//   @ApiResponse({
//     status: HttpStatus.OK,
//     description: "Token refreshed successfully",
//     type: TokenRefreshResponseDto,
//     examples: {
//       success: {
//         summary: "Token refresh success",
//         value: {
//           message: "Token refreshed successfully",
//           accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
//         },
//       },
//     },
//   })
//   @ApiResponse({
//     status: HttpStatus.UNAUTHORIZED,
//     description: "Refresh token missing or invalid",
//     schema: {
//       type: "object",
//       properties: {
//         statusCode: { type: "number", example: 401 },
//         message: { type: "string", example: "Refresh token missing" },
//         error: { type: "string", example: "Unauthorized" },
//       },
//     },
//   })
//   refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
//     const refreshToken = req.cookies?.refresh_token;
//     if (!refreshToken) {
//       throw new UnauthorizedException("Refresh token missing");
//     }
//     return this.driverService.refreshToken(refreshToken, res);
//   }

//   @Post("auth/logout")
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({
//     summary: "Driver logout",
//     description: "Sign out the driver and clear authentication tokens.",
//   })
//   @ApiCookieAuth("refresh_token")
//   @ApiResponse({
//     status: HttpStatus.OK,
//     description: "Driver logged out successfully",
//     type: StandardResponseDto,
//     examples: {
//       success: {
//         summary: "Logout success",
//         // description: "Successfully logged out driver",
//         value: {
//           message: "Logged out successfully",
//         },
//       },
//     },
//   })
//   @ApiResponse({
//     status: HttpStatus.BAD_REQUEST,
//     description: "Refresh token missing",
//   })
//   @ApiResponse({
//     status: HttpStatus.UNAUTHORIZED,
//     description: "Invalid refresh token",
//   })
//   async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
//     return this.driverService.logout(req, res);
//   }

//   // ========== DRIVER PROFILE MANAGEMENT ==========

//   @Get("auth/profile")
//   @UseGuards(RoleGuard, UserCategoryGuard)
//   @Roles("driver")
//   @ApiCookieAuth("refresh_token")
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({
//     summary: "Get driver profile",
//     description:
//       "Retrieve the current authenticated driver's profile information.",
//   })
//   @ApiResponse({
//     status: HttpStatus.OK,
//     description: "Driver profile retrieved successfully",
//     type: DriverResponseDto,
//     examples: {
//       complete_profile: {
//         summary: "Complete profile",
//         // description: "Driver with complete profile information",
//         value: {
//           id: 1,
//           phone_number: "+998901234567",
//           first_name: "John",
//           last_name: "Doe",
//           driver_license_number: "DL123456789",
//           is_active: true,
//           is_verified: true,
//           profile_complete: true,
//         },
//       },
//       incomplete_profile: {
//         summary: "Incomplete profile",
//         // description: "Driver with incomplete profile information",
//         value: {
//           id: 2,
//           phone_number: "+998901234567",
//           first_name: null,
//           last_name: null,
//           driver_license_number: null,
//           is_active: true,
//           is_verified: false,
//           profile_complete: false,
//         },
//       },
//     },
//   })
//   @ApiResponse({
//     status: HttpStatus.UNAUTHORIZED,
//     description: "Refresh token missing or invalid",
//   })
//   getProfile(@Req() req: Request) {
//     const refreshToken = req.cookies?.refresh_token;
//     if (!refreshToken) {
//       throw new UnauthorizedException("Refresh token missing");
//     }
//     return this.driverService.getProfile(refreshToken);
//   }

//   @Post("auth/complete-profile")
//   @UseGuards(RoleGuard, UserCategoryGuard)
//   @Roles("driver")
//   @ApiCookieAuth("refresh_token")
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({
//     summary: "Complete driver profile",
//     description:
//       "Complete the driver's profile with personal information and license details.",
//   })
//   @ApiBody({
//     type: ProfileCompleteDto,
//     description: "Profile completion data",
//     examples: {
//       example1: {
//         summary: "Complete profile",
//         description: "Complete driver profile information",
//         value: {
//           first_name: "John",
//           last_name: "Doe",
//           driver_license_number: "DL123456789",
//         },
//       },
//     },
//   })
//   @ApiResponse({
//     status: HttpStatus.OK,
//     description: "Profile completed successfully",
//     schema: {
//       type: "object",
//       properties: {
//         message: { type: "string", example: "Profile completed successfully" },
//         driver: { $ref: "#/components/schemas/DriverResponseDto" },
//       },
//     },
//   })
//   @ApiResponse({
//     status: HttpStatus.BAD_REQUEST,
//     description: "Missing required fields or driver not found",
//   })
//   @ApiResponse({
//     status: HttpStatus.UNAUTHORIZED,
//     description: "Invalid authentication",
//   })
//   async completeProfile(@Req() req: any, @Body() body: ProfileCompleteDto) {
//     const driverId = req.user.sub;
//     return this.driverService.completeProfile(driverId, body);
//   }

//   // ========== DRIVER STATUS MANAGEMENT ==========

//   @Post("status")
//   @ApiBearerAuth()
//   @UseGuards(RoleGuard)
//   @Roles("driver")
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({
//     summary: "Toggle driver online status",
//     description:
//       "Set the driver's online/offline status for ride availability.",
//   })
//   @ApiBody({
//     type: StatusToggleDto,
//     description: "Online status toggle",
//     examples: {
//       go_online: {
//         summary: "Go online",
//         description: "Set driver status to online",
//         value: {
//           isOnline: true,
//         },
//       },
//       go_offline: {
//         summary: "Go offline",
//         description: "Set driver status to offline",
//         value: {
//           isOnline: false,
//         },
//       },
//     },
//   })
//   @ApiResponse({
//     status: HttpStatus.OK,
//     description: "Driver status updated successfully",
//     examples: {
//       online: {
//         summary: "Online status",
//         // description: "Driver is now online",
//         value: {
//           message: "Driver is now online",
//         },
//       },
//       offline: {
//         summary: "Offline status",
//         // description: "Driver is now offline",
//         value: {
//           message: "Driver is now offline",
//         },
//       },
//     },
//   })
//   @ApiResponse({
//     status: HttpStatus.UNAUTHORIZED,
//     description: "Invalid authentication",
//   })
//   @ApiResponse({
//     status: HttpStatus.FORBIDDEN,
//     description: "Insufficient permissions",
//   })
//   async setOnlineStatus(@Body() body: StatusToggleDto, @Req() req: any) {
//     const driverId = req.user.sub;
//     await redisClient.set(
//       `driver:${driverId}:status`,
//       body.isOnline ? "online" : "offline"
//     );
//     return { message: `Driver is now ${body.isOnline ? "online" : "offline"}` };
//   }

//   // ========== DRIVER STATUS QUERY ==========

//   @Get("status")
//   @ApiBearerAuth()
//   @UseGuards(RoleGuard)
//   @Roles("driver")
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({
//     summary: "Get driver online status",
//     description: "Retrieve the current online/offline status of the driver.",
//   })
//   @ApiResponse({
//     status: HttpStatus.OK,
//     description: "Driver status retrieved successfully",
//     schema: {
//       type: "object",
//       properties: {
//         driverId: { type: "number", example: 1 },
//         status: {
//           type: "string",
//           example: "online",
//           enum: ["online", "offline"],
//         },
//         timestamp: { type: "string", format: "date-time" },
//       },
//     },
//   })
//   @ApiResponse({
//     status: HttpStatus.UNAUTHORIZED,
//     description: "Invalid authentication",
//   })
//   async getOnlineStatus(@Req() req: any) {
//     const driverId = req.user.sub;
//     const status =
//       (await redisClient.get(`driver:${driverId}:status`)) || "offline";
//     return {
//       driverId,
//       status,
//       timestamp: new Date().toISOString(),
//     };
//   }
// }

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Patch,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from "@nestjs/common";
import { DriverService } from "./driver.service";
import {
  CreateDriverDto,
  VerifyDriverOtpDto,
  ProfileCompleteDto,
  DriverSearchDto,
  UpdateDriverStatusDto,
} from "./dto/create-driver.dto";
import { UpdateDriverDto } from "./dto/update-driver.dto";
import { SendOtpDto } from "../otp/dto/otp.dto";
import { Response, Request } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { RoleGuard } from "../auth/role.guard";
import { Roles } from "../common/decorators/role.decorator";
import { UserCategoryGuard } from "../auth/user.guard";
import { GetCurrentUser } from "../common/decorators/get-current-user.decorator";
import { redisClient } from "../redis/redis.provider";

// ==================================
// ======== SWAGGER DTOs ============
// ==================================
class DriverResponseDto {
  id: number;
  phone_number: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_verified: boolean;
  profile_complete: boolean;
}
class AuthResponseDto {
  message: string;
  driver: DriverResponseDto;
  accessToken: string;
}
class OtpResponseDto {
  message: string;
  requires_registration: boolean;
  phone_number: string;
}
class TokenRefreshResponseDto {
  message: string;
  accessToken: string;
}
class StatusToggleDto {
  isOnline: boolean;
}
class GenericMessageDto {
  message: string;
}
class ErrorResponseDto {
  statusCode: number;
  message: string;
  error: string;
}
class DriverStatsDto {
  total: number;
  active: number;
  inactive: number;
  verified: number;
  unverified: number;
  profileComplete: number;
  profileIncomplete: number;
}

@ApiTags("Driver - Authentication & Management")
@Controller("drivers")
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  // =======================================================
  // ================ 1. PUBLIC AUTH ROUTES ================
  // =======================================================

  @Post("auth/send-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "1.1 Send OTP to Driver",
    operationId: "driverSendOtp",
  })
  @ApiBody({
    type: SendOtpDto,
    examples: {
      uzbek_phone: {
        summary: "Phone from Uzbekistan",
        value: { phone_number: "+998901234567" },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "OTP sent. `requires_registration` is true for new users.",
    type: OtpResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request: Failed to send OTP.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: "Too many requests.",
    type: ErrorResponseDto,
  })
  sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.driverService.sendOtp(sendOtpDto);
  }

  @Post("auth/verify-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "1.2 Verify OTP & Authenticate (Login/Register)",
    operationId: "driverVerifyOtp",
  })
  @ApiBody({
    type: VerifyDriverOtpDto,
    examples: {
      valid_otp: {
        summary: "Valid OTP Code",
        value: { phone_number: "+998901234567", otp: "123456" },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Authentication successful.",
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Invalid or expired OTP.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: "Internal Server Error (e.g., JWT keys not configured).",
    type: ErrorResponseDto,
  })
  verifyOtpAndAuth(
    @Body() verifyOtpDto: VerifyDriverOtpDto,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.driverService.verifyOtpAndAuth(verifyOtpDto, res);
  }

  // ============================================================
  // ================ 2. PROTECTED AUTH & PROFILE ================
  // ============================================================

  @Post("auth/refresh")
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth("refresh_token")
  @ApiOperation({
    summary: "2.1 Refresh Access Token",
    operationId: "driverRefreshToken",
  })
  @ApiResponse({
    status: 200,
    description: "Token refreshed successfully.",
    type: TokenRefreshResponseDto,
  })
  @ApiResponse({
    status: 401,
    description:
      "Invalid, missing, or expired refresh token. Or driver is inactive.",
    type: ErrorResponseDto,
  })
  refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken)
      throw new UnauthorizedException("Refresh token is missing");
    return this.driverService.refreshToken(refreshToken, res);
  }

  @Post("auth/logout")
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth("refresh_token")
  @ApiOperation({ summary: "2.2 Driver Logout", operationId: "driverLogout" })
  @ApiResponse({
    status: 200,
    description: "Logged out successfully.",
    type: GenericMessageDto,
  })
  @ApiResponse({
    status: 401,
    description: "Invalid or missing refresh token.",
    type: ErrorResponseDto,
  })
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.driverService.logout(req, res);
  }

  @Get("profile/me")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("driver")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "2.3 Get Own Driver Profile",
    operationId: "getDriverProfile",
  })
  @ApiResponse({
    status: 200,
    description: "Driver profile retrieved successfully.",
    type: DriverResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Driver not found.",
    type: ErrorResponseDto,
  })
  getProfile(@GetCurrentUser("id") driverId: number) {
    return this.driverService.findOne(driverId);
  }

  @Put("profile/complete")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("driver")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "2.4 Complete Driver Profile",
    operationId: "completeDriverProfile",
  })
  @ApiBody({
    type: ProfileCompleteDto,
    examples: {
      full_profile: {
        summary: "Full Profile Data",
        value: {
          first_name: "Nodira",
          last_name: "Karimova",
          driver_license_number: "UZDL9876543",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Profile completed successfully.",
    type: GenericMessageDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request: Missing required fields.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Driver not found.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: "Conflict: Driver license already exists.",
    type: ErrorResponseDto,
  })
  completeProfile(
    @GetCurrentUser("id") driverId: number,
    @Body() body: ProfileCompleteDto
  ) {
    return this.driverService.completeProfile(driverId, body);
  }

  @Put("status/toggle")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("driver")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "2.5 Toggle Online/Offline Status",
    operationId: "toggleDriverStatus",
  })
  @ApiBody({
    type: StatusToggleDto,
    examples: {
      go_online: { value: { isOnline: true } },
      go_offline: { value: { isOnline: false } },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Driver status updated.",
    type: GenericMessageDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized.",
    type: ErrorResponseDto,
  })
  async setOnlineStatus(
    @Body() body: StatusToggleDto,
    @GetCurrentUser("id") driverId: number
  ) {
    await redisClient.set(
      `driver:${driverId}:status`,
      body.isOnline ? "online" : "offline"
    );
    return { message: `Driver is now ${body.isOnline ? "online" : "offline"}` };
  }

  // ==================================================
  // ================ 3. ADMIN ROUTES =================
  // ==================================================

  @Post("admin")
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "3.1 [ADMIN] Create a Driver",
    operationId: "adminCreateDriver",
  })
  @ApiResponse({
    status: 201,
    description: "Driver created successfully.",
    type: DriverResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: "Conflict: Phone number already exists.",
    type: ErrorResponseDto,
  })
  create(@Body() createDriverDto: CreateDriverDto) {
    return this.driverService.create(createDriverDto);
  }

  @Get("admin/search")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "3.2 [ADMIN] Search and Paginate Drivers",
    operationId: "adminSearchDrivers",
  })
  @ApiResponse({
    status: 200,
    description: "A paginated list of drivers matching the criteria.",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden.",
    type: ErrorResponseDto,
  })
  searchDrivers(@Query() searchDto: DriverSearchDto) {
    return this.driverService.searchDrivers(searchDto);
  }

  @Get("admin/stats")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "3.3 [ADMIN] Get Driver Statistics",
    operationId: "adminGetDriverStats",
  })
  @ApiResponse({
    status: 200,
    description: "Aggregate statistics for all drivers.",
    type: DriverStatsDto,
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden.",
    type: ErrorResponseDto,
  })
  getDriverStats() {
    return this.driverService.getDriverStats();
  }

  @Get("admin/:id")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "3.4 [ADMIN] Get Driver by ID",
    operationId: "adminGetDriverById",
  })
  @ApiParam({ name: "id", description: "Numeric ID of the driver." })
  @ApiResponse({
    status: 200,
    description: "Driver details retrieved.",
    type: DriverResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Driver not found.",
    type: ErrorResponseDto,
  })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.driverService.findOne(id);
  }

  @Put("admin/:id")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "3.5 [ADMIN] Update Driver",
    operationId: "adminUpdateDriver",
  })
  @ApiParam({ name: "id", description: "Numeric ID of the driver to update." })
  @ApiResponse({
    status: 200,
    description: "Driver updated successfully.",
    type: GenericMessageDto,
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Driver not found.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: "Conflict: Phone number already exists.",
    type: ErrorResponseDto,
  })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDriverDto: UpdateDriverDto
  ) {
    return this.driverService.update(id, updateDriverDto);
  }

  @Patch("admin/:id/verify")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "3.6 [ADMIN] Toggle Verification Status",
    operationId: "adminVerifyDriver",
  })
  @ApiParam({ name: "id", description: "The ID of the driver" })
  @ApiBody({
    type: UpdateDriverStatusDto,
    examples: {
      verify: { value: { status: true } },
      unverify: { value: { status: false } },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Driver verification status updated.",
    type: GenericMessageDto,
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Driver not found.",
    type: ErrorResponseDto,
  })
  updateVerificationStatus(
    @Param("id", ParseIntPipe) driverId: number,
    @Body() { status }: UpdateDriverStatusDto
  ) {
    return this.driverService.updateVerificationStatus(driverId, status);
  }

  @Patch("admin/:id/activate")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "3.7 [ADMIN] Toggle Active Status",
    operationId: "adminActivateDriver",
  })
  @ApiParam({ name: "id", description: "The ID of the driver" })
  @ApiBody({
    type: UpdateDriverStatusDto,
    examples: {
      activate: { value: { status: true } },
      deactivate: { value: { status: false } },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Driver active status updated.",
    type: GenericMessageDto,
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Driver not found.",
    type: ErrorResponseDto,
  })
  updateActiveStatus(
    @Param("id", ParseIntPipe) driverId: number,
    @Body() { status }: UpdateDriverStatusDto
  ) {
    return this.driverService.updateActiveStatus(driverId, status);
  }

  @Delete("admin/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "3.8 [ADMIN] Delete Driver",
    operationId: "adminDeleteDriver",
  })
  @ApiParam({ name: "id", description: "Numeric ID of the driver to delete." })
  @ApiResponse({ status: 204, description: "Driver deleted successfully." })
  @ApiResponse({
    status: 403,
    description: "Forbidden.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Driver not found.",
    type: ErrorResponseDto,
  })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.driverService.remove(id);
  }
}