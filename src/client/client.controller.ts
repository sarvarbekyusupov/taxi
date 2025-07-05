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
  ParseIntPipe,
  ForbiddenException, // Import ForbiddenException
} from "@nestjs/common";
import { ClientService } from "./client.service";
import { CompleteProfileDto, CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
import { Request, Response } from "express";
import { SendOtpDto, VerifyOtpDto } from "../otp/dto/otp.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiCookieAuth,
} from "@nestjs/swagger";
import { RoleGuard } from "../auth/role.guard";
import { UserCategoryGuard } from "../auth/user.guard";
import { Roles } from "../common/decorators/role.decorator";
import { GetCurrentUser } from "../common/decorators/get-current-user.decorator";

// ========== DTOs for Swagger Documentation ==========

// (Your DTOs are excellent, so they are kept as is)
export class SendOtpResponseDto {
  message: string;
  requires_registration: boolean;
  phone_number: string;
}

export class VerifyOtpResponseDto {
  message: string;
  client: {
    id: number;
    phone_number: string;
    name: string | null;
  };
  accessToken: string;
}

export class RefreshTokenResponseDto {
  message: string;
  accessToken: string;
}

// A dedicated DTO for client responses to ensure consistency and hide sensitive data
export class ClientResponseDto {
  id: number;
  phone_number: string;
  name: string | null;
  is_active: boolean;
  is_verified: boolean;
}

export class GenericMessageResponseDto {
  message: string;
}

export class ErrorResponseDto {
  statusCode: number;
  message: string;
  error: string;
}

@ApiTags("Client - Authentication & Management")
@Controller("clients") // Using plural "clients" is a common REST convention
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  // =============================================
  // ========== 1. PUBLIC AUTHENTICATION ==========
  // =============================================

  @Post("auth/send-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "1.1. Send OTP to Client Phone Number",
    operationId: "clientSendOtp",
  })
  @ApiResponse({
    status: 200,
    description: "OTP sent successfully.",
    type: SendOtpResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid phone number format or other bad request.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: "Too many requests (Rate limit exceeded).",
    type: ErrorResponseDto,
  })
  sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.clientService.sendOtp(sendOtpDto);
  }

  @Post("auth/verify-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "1.2. Verify OTP & Authenticate (Login/Register)",
    description:
      "Verifies the OTP to log in an existing client or register a new one. Sets a `refresh_token` as an HTTP-only cookie.",
    operationId: "clientVerifyOtp",
  })
  @ApiResponse({
    status: 200,
    description: "Authentication successful.",
    type: VerifyOtpResponseDto,
    headers: {
      "Set-Cookie": { description: "Sets the HTTP-only refresh token." },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Invalid or expired OTP.",
    type: ErrorResponseDto,
  })
  verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.clientService.verifyOtpAndAuth(verifyOtpDto, res);
  }

  // ============================================
  // ========== 2. PROTECTED AUTH ACTIONS ==========
  // ============================================

  @Post("auth/refresh")
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth("refresh_token") // Documents that a cookie named 'refresh_token' is required
  @ApiOperation({
    summary: "2.1. Refresh Access Token",
    description:
      "Uses the `refresh_token` (from cookie) to generate a new access token and a new refresh token.",
    operationId: "clientRefreshToken",
  })
  @ApiResponse({
    status: 200,
    description: "Token refreshed successfully.",
    type: RefreshTokenResponseDto,
    headers: {
      "Set-Cookie": { description: "Sets the new HTTP-only refresh token." },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Invalid, expired, or missing refresh token.",
    type: ErrorResponseDto,
  })
  refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token is missing");
    }
    return this.clientService.refreshToken(refreshToken, res);
  }

  @Post("auth/logout")
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth("refresh_token")
  @ApiOperation({
    summary: "2.2. Logout Client",
    description:
      "Invalidates the current session by clearing the refresh token from the database and the client's cookie.",
    operationId: "clientLogout",
  })
  @ApiResponse({
    status: 200,
    description: "Logout successful.",
    type: GenericMessageResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Invalid or missing refresh token required for logout.",
    type: ErrorResponseDto,
  })
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.clientService.logout(req, res);
  }

  // ==================================================
  // ========== 3. PROTECTED PROFILE & CRUD ==========
  // ==================================================

  @Patch("profile/complete")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("client")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "3.1. Complete Client Profile",
    description:
      "Allows a newly registered client to add details like their name.",
    operationId: "clientCompleteProfile",
  })
  @ApiResponse({
    status: 200,
    description: "Profile completed successfully.",
    type: GenericMessageResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized. Invalid token.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Client not found.",
    type: ErrorResponseDto,
  })
  completeProfile(
    @Body() dto: CompleteProfileDto,
    @GetCurrentUser("id") userId: number
  ) {
    return this.clientService.completeProfile(userId, dto);
  }

  @Get("profile/me")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("client")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "3.2. Get Own Profile",
    operationId: "getClientProfile",
  })
  @ApiResponse({
    status: 200,
    description: "The current client's profile.",
    type: ClientResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Client not found.",
    type: ErrorResponseDto,
  })
  async getProfile(@GetCurrentUser("id") userId: number) {
    // Basic check to prevent unnecessary DB call if ID is invalid
    if (!userId) throw new UnauthorizedException();
    return this.clientService.findOne(userId);
  }

  // =========================================
  // ========== 4. ADMIN-ONLY CRUD ==========
  // =========================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "4.1. Create a New Client (Admin)",
    operationId: "adminCreateClient",
  })
  @ApiResponse({
    status: 201,
    description: "Client created successfully.",
    type: ClientResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request: Validation error.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden: Insufficient privileges.",
    type: ErrorResponseDto,
  })
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientService.create(createClientDto);
  }

  @Get()
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "4.2. Get All Clients (Admin)",
    operationId: "adminGetAllClients",
  })
  @ApiResponse({
    status: 200,
    description: "A list of all clients.",
    type: [ClientResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden: Insufficient privileges.",
    type: ErrorResponseDto,
  })
  findAll() {
    return this.clientService.findAll();
  }

  @Get(":id")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "4.3. Get Client by ID (Admin)",
    operationId: "adminGetClientById",
  })
  @ApiParam({
    name: "id",
    description: "Numeric ID of the client to retrieve.",
  })
  @ApiResponse({
    status: 200,
    description: "Client details retrieved.",
    type: ClientResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Client with the specified ID not found.",
    type: ErrorResponseDto,
  })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.clientService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "4.4. Update Client by ID (Admin)",
    operationId: "adminUpdateClient",
  })
  @ApiParam({ name: "id", description: "Numeric ID of the client to update." })
  @ApiResponse({
    status: 200,
    description: "Client updated successfully.",
    type: GenericMessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request: Validation error.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Client with the specified ID not found.",
    type: ErrorResponseDto,
  })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateClientDto: UpdateClientDto
  ) {
    return this.clientService.update(id, updateClientDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "4.5. Delete Client by ID (Admin)",
    operationId: "adminDeleteClient",
  })
  @ApiParam({ name: "id", description: "Numeric ID of the client to delete." })
  @ApiResponse({ status: 204, description: "Client deleted successfully." })
  @ApiResponse({
    status: 401,
    description: "Unauthorized.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden.",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Client with the specified ID not found.",
    type: ErrorResponseDto,
  })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.clientService.remove(id);
  }
}