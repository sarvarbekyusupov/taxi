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
import { GoOnlineDto } from "./dto/go-online.dto";
import { UpdateLocationDto } from "./dto/update-location.dto";
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
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
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

  //================SEND OTP===================
  @Post("auth/send-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "1.1. Send OTP to Driver Phone Number",
    description:
      "Sends a one-time password (OTP) to the provided driver phone number. If the number is new, the `requires_registration` flag will be `true`.",
    operationId: "driverSendOtp",
  })
  @ApiBody({
    description: "Driver phone number to receive the OTP.",
    schema: {
      type: "object",
      properties: {
        phone_number: { type: "string", example: "+998901234567" },
      },
      required: ["phone_number"],
    },
    examples: {
      uzbek_phone: {
        summary: "Uzbekistan Phone Number",
        value: {
          phone_number: "+998901234567",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      "OTP sent successfully. The `requires_registration` flag shows whether this is a new driver.",
    content: {
      "application/json": {
        example: {
          message: "OTP sent successfully",
          requires_registration: true,
          phone_number: "+998901234567",
          new_otp: "1234", // Only for testing/demo, should be hidden in prod
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request: Invalid phone number or failed to send OTP.",
    content: {
      "application/json": {
        example: {
          statusCode: 400,
          message: "Invalid phone number format.",
          error: "Bad Request",
        },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: "Too many requests (Rate limit exceeded).",
    content: {
      "application/json": {
        example: {
          statusCode: 429,
          message: "Too many requests",
          error: "Too Many Requests",
        },
      },
    },
  })
  sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.driverService.sendOtp(sendOtpDto);
  }

  //===============VERIFY OTP ==================

  @Post("auth/verify-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "1.2. Verify OTP & Authenticate Driver (Login/Register)",
    description:
      "Verifies the OTP sent to the driver's phone. If the driver is new, registers them. Returns access token and sets `refresh_token` as an HTTP-only cookie.",
    operationId: "driverVerifyOtp",
  })
  @ApiBody({
    description: "OTP verification payload",
    schema: {
      type: "object",
      properties: {
        phone_number: { type: "string", example: "+998901234567" },
        otp: { type: "string", example: "123456" },
      },
      required: ["phone_number", "otp"],
    },
    examples: {
      valid_otp: {
        summary: "Valid OTP Code",
        value: {
          phone_number: "+998901234567",
          otp: "123456",
        },
      },
    },
  })
  @ApiOkResponse({
    description:
      "Authentication successful. Returns driver profile and access token. Refresh token is set as HTTP-only cookie.",
    headers: {
      "Set-Cookie": {
        description: "Refresh token is set as secure HttpOnly cookie",
        schema: {
          type: "string",
          example:
            "refresh_token=...; Path=/; HttpOnly; Secure; SameSite=Strict",
        },
      },
    },
    content: {
      "application/json": {
        examples: {
          login: {
            summary: "Existing Driver Login",
            value: {
              message: "Login successful",
              requires_registration: false,
              driver: {
                id: 12,
                phone_number: "+998901234567",
                first_name: null,
                last_name: null,
                driver_license_number: null,
                is_active: true,
                is_verified: false,
                profile_complete: false,
              },
              accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
          },
          register: {
            summary: "New Driver Registration",
            value: {
              message: "Registration and login successful",
              requires_registration: true,
              driver: {
                id: 13,
                phone_number: "+998907654321",
                first_name: null,
                last_name: null,
                driver_license_number: null,
                is_active: true,
                is_verified: false,
                profile_complete: false,
              },
              accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Unauthorized: OTP is invalid or expired.",
    content: {
      "application/json": {
        example: {
          statusCode: 401,
          message: "Invalid or expired OTP",
          error: "Unauthorized",
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: "Internal Server Error: e.g., JWT config issues",
    content: {
      "application/json": {
        example: {
          statusCode: 500,
          message: "Authentication failed",
          error: "Internal Server Error",
        },
      },
    },
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

  //==================== AUTH REFRESH ========================
  @Post("auth/refresh")
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth("refresh_token")
  @ApiOperation({
    summary: "2.1. Refresh Access Token",
    description:
      "Generates a new access token and refresh token using the existing HTTP-only `refresh_token` cookie. The new refresh token is also set as a cookie.",
    operationId: "driverRefreshToken",
  })
  @ApiResponse({
    status: 200,
    description:
      "Token refreshed successfully. A new access token is returned in the body, and a new refresh token is set as a cookie.",
    headers: {
      "Set-Cookie": {
        description: "New `refresh_token` is set as HTTP-only cookie.",
        schema: {
          type: "string",
          example: "refresh_token=...; Path=/; HttpOnly",
        },
      },
    },
    content: {
      "application/json": {
        example: {
          message: "Token refreshed successfully",
          accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description:
      "Unauthorized: Refresh token is missing, invalid, expired, or the driver is inactive.",
    content: {
      "application/json": {
        example: {
          statusCode: 401,
          message: "Invalid, missing, or expired refresh token.",
          error: "Unauthorized",
        },
      },
    },
  })
  refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken)
      throw new UnauthorizedException("Refresh token is missing");
    return this.driverService.refreshToken(refreshToken, res);
  }

  //==================== LOGOUT ========================

  @Post("auth/logout")
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth("refresh_token")
  @ApiOperation({
    summary: "2.2. Logout Driver",
    description:
      "Clears the driver's session by deleting the refresh token from the database and removing the `refresh_token` cookie from the client.",
    operationId: "driverLogout",
  })
  @ApiResponse({
    status: 200,
    description:
      "Logout successful. The `refresh_token` cookie is cleared from the client.",
    headers: {
      "Set-Cookie": {
        description: "Clears the HTTP-only refresh token cookie.",
        schema: {
          type: "string",
          example:
            "refresh_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
        },
      },
    },
    content: {
      "application/json": {
        example: {
          message: "Logged out successfully",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized: Refresh token is missing or invalid.",
    content: {
      "application/json": {
        example: {
          statusCode: 401,
          message: "Invalid or missing refresh token",
          error: "Unauthorized",
        },
      },
    },
  })
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.driverService.logout(req, res);
  }

  //==================== PROFILE/ME ========================

  @Get("profile/me")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("driver")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "2.3. Get Own Driver Profile",
    description:
      "Retrieves the authenticated driver's profile using the access token. Requires the user to be logged in and have the 'driver' role.",
    operationId: "getDriverProfile",
  })
  @ApiResponse({
    status: 200,
    description: "Driver profile retrieved successfully.",
    content: {
      "application/json": {
        example: {
          id: 1,
          phone_number: "+998901234567",
          name: "Ali Valiyev",
          profile_photo_url: "https://example.com/photo.jpg",
          birthday: "1990-05-15T00:00:00.000Z",
          gender: "male",
          is_active: true,
          is_verified: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized: Access token is missing, invalid, or expired.",
    content: {
      "application/json": {
        example: {
          statusCode: 401,
          message: "Unauthorized",
          error: "Unauthorized",
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Driver not found in the system.",
    content: {
      "application/json": {
        example: {
          statusCode: 404,
          message: "Driver with ID 1 not found",
          error: "Not Found",
        },
      },
    },
  })
  getProfile(@GetCurrentUser("id") driverId: number) {
    return this.driverService.findOne(driverId);
  }

  //==================== PROFILE/COMPLETE ========================

  @Put("profile/complete")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("driver")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "2.4. Complete Driver Profile",
    description:
      "Allows an authenticated driver to complete their profile by submitting details such as name and driver license number. Requires a valid access token and `driver` role.",
    operationId: "completeDriverProfile",
  })
  @ApiBody({
    description:
      "Driver profile details. All fields are required to complete the profile.",
    schema: {
      type: "object",
      properties: {
        first_name: { type: "string", example: "Nodira" },
        last_name: { type: "string", example: "Karimova" },
        driver_license_number: { type: "string", example: "UZDL9876543" },
      },
      required: ["first_name", "last_name", "driver_license_number"],
    },
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
    description: "Driver profile completed successfully.",
    content: {
      "application/json": {
        example: {
          message: "Profile completed successfully",
          driver: {
            id: 5,
            phone_number: "+998901234567",
            first_name: "Nodira",
            last_name: "Karimova",
            driver_license_number: "UZDL9876543",
            is_active: true,
            is_verified: true,
            profile_complete: true,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request: Some required fields are missing or invalid.",
    content: {
      "application/json": {
        example: {
          statusCode: 400,
          message: [
            "first_name must be a string",
            "driver_license_number should not be empty",
          ],
          error: "Bad Request",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized: Missing or invalid access token.",
    content: {
      "application/json": {
        example: {
          statusCode: 401,
          message: "Unauthorized",
          error: "Unauthorized",
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Driver not found.",
    content: {
      "application/json": {
        example: {
          statusCode: 404,
          message: "Driver with ID 5 not found",
          error: "Not Found",
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: "Conflict: Driver license number already exists.",
    content: {
      "application/json": {
        example: {
          statusCode: 409,
          message: "Driver license number already in use",
          error: "Conflict",
        },
      },
    },
  })
  completeProfile(
    @GetCurrentUser("id") driverId: number,
    @Body() body: ProfileCompleteDto
  ) {
    return this.driverService.completeProfile(driverId, body);
  }

  //==================== STATUS/TOGLE ========================

  @Put("status/toggle")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("driver")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "2.5. Toggle Driver Online/Offline Status",
    description:
      "Allows a driver to update their availability status. This will be used for ride matching logic.",
    operationId: "toggleDriverStatus",
  })
  @ApiBody({
    description: "Update the driver's current availability status.",
    schema: {
      type: "object",
      properties: {
        isOnline: {
          type: "boolean",
          description: "Set to true to go online, false to go offline",
          example: true,
        },
      },
      required: ["isOnline"],
    },
    examples: {
      go_online: {
        summary: "Go Online",
        value: { isOnline: true },
      },
      go_offline: {
        summary: "Go Offline",
        value: { isOnline: false },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Driver status updated successfully.",
    content: {
      "application/json": {
        examples: {
          online: {
            summary: "Driver is now online",
            value: { message: "Driver is now online" },
          },
          offline: {
            summary: "Driver is now offline",
            value: { message: "Driver is now offline" },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized: Invalid or missing access token.",
    content: {
      "application/json": {
        example: {
          statusCode: 401,
          message: "Unauthorized",
          error: "Unauthorized",
        },
      },
    },
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

  //==================== GO ONLINE ========================

  @Post("go-online")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("driver")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "2.6. Driver Goes Online with Location",
    description:
      "Marks the driver as online and sets their initial location in Redis. Required for enabling ride matching.",
  })
  @ApiBody({
    description: "Driver ID and location coordinates.",
    schema: {
      type: "object",
      properties: {
        driverId: {
          type: "number",
          example: 42,
          description: "Unique ID of the authenticated driver",
        },
        lat: {
          type: "number",
          example: 41.3111,
          description: "Latitude of driver's current location",
        },
        lng: {
          type: "number",
          example: 69.2797,
          description: "Longitude of driver's current location",
        },
      },
      required: ["driverId", "lat", "lng"],
    },
    examples: {
      go_online: {
        summary: "Driver sets their location and goes online",
        value: {
          driverId: 42,
          lat: 41.3111,
          lng: 69.2797,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Driver is now online and location stored in Redis.",
    content: {
      "application/json": {
        example: {
          message: "Driver is now online and location updated",
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Internal Server Error: Failed to set status or location.",
    content: {
      "application/json": {
        example: {
          statusCode: 500,
          message: "Failed to set driver online",
          error: "Internal Server Error",
        },
      },
    },
  })
  async goOnline(@Body() goOnlineDto: GoOnlineDto) {
    return this.driverService.goOnline(
      goOnlineDto.driverId,
      goOnlineDto.lat,
      goOnlineDto.lng
    );
  }

  // @Put("location")
  // @UseGuards(RoleGuard, UserCategoryGuard)
  // @Roles("driver")
  // @ApiBearerAuth()
  // @ApiOperation({ summary: "Continuously update driver's current location" })
  // @ApiBody({ type: UpdateLocationDto })
  // @ApiResponse({ status: 200, description: "Driver location updated" })
  // async updateLocation(@Body() updateLocationDto: UpdateLocationDto) {
  //   return this.driverService.updateLocation(
  //     updateLocationDto.driverId,
  //     updateLocationDto.lat,
  //     updateLocationDto.lng
  //   );
  // }

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

  @Get("locations")
  // @UseGuards(RoleGuard)
  // @Roles("admin", "super_admin")
  // @ApiBearerAuth()
  @ApiOperation({ summary: "Get all online driver locations" })
  @ApiResponse({
    status: 200,
    description: "List of drivers with current locations",
    schema: {
      example: [
        { driverId: "1", lat: 40.123, lng: 71.456 },
        { driverId: "2", lat: 40.789, lng: 71.987 },
      ],
    },
  })
  async getAllDriverLocations() {
    return await this.driverService.getAllDriverLocations();
  }
}