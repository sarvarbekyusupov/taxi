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
  ApiBody,
  ApiParam,
  ApiCookieAuth,
  ApiHeader,
  ApiSecurity,
} from "@nestjs/swagger";
import { RoleGuard } from "../auth/role.guard";
import { UserCategoryGuard } from "../auth/user.guard";
import { Roles } from "../common/decorators/role.decorator";

// Response DTOs for better Swagger documentation
export class SendOtpResponseDto {
  message: string;
  requires_name: boolean;
  phone_number: string;
  // Note: new_otp should be removed in production for security
}

export class VerifyOtpResponseDto {
  message: string;
  client: {
    id: number;
    phone_number: string;
    name: string | null;
    is_active: boolean;
    is_verified: boolean;
  };
  accessToken: string;
}

export class RefreshTokenResponseDto {
  message: string;
  accessToken: string;
}

export class LogoutResponseDto {
  message: string;
}

export class ClientProfileResponseDto {
  id: number;
  phone_number: string;
  name: string | null;
  is_active: boolean;
}

export class GenericMessageResponseDto {
  message: string;
}

export class ErrorResponseDto {
  statusCode: number;
  message: string;
  error: string;
}

@ApiTags("Client Authentication & Management")
@Controller("client")
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  // ========== PUBLIC AUTH ROUTES ==========

  @Post("auth/send-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Send OTP to client phone number",
    description:
      "Sends a one-time password to the provided phone number. Returns whether the user needs to provide a name (new user) or not (existing user).",
    operationId: "sendClientOtp",
  })
  @ApiBody({
    type: SendOtpDto,
    description: "Phone number to send OTP to",
    examples: {
      example1: {
        summary: "Valid phone number",
        value: {
          phone_number: "+998901234567",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "OTP sent successfully",
    type: SendOtpResponseDto,
    schema: {
      example: {
        message: "OTP sent successfully",
        requires_name: true,
        phone_number: "+998901234567",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      "Failed to send OTP - Invalid phone number format or service error",
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 400,
        message: "Failed to send OTP",
        error: "Bad Request",
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: "Too many requests - Rate limit exceeded",
    type: ErrorResponseDto,
  })
  sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.clientService.sendOtp(sendOtpDto);
  }

  @Post("auth/verify-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Verify OTP and authenticate/register client",
    description:
      "Verifies the OTP and either logs in an existing client or registers a new one. Sets refresh token as HTTP-only cookie.",
    operationId: "verifyClientOtp",
  })
  @ApiBody({
    type: VerifyOtpDto,
    description: "OTP verification payload",
    examples: {
      newUser: {
        summary: "New user registration",
        value: {
          phone_number: "+998901234567",
          otp: "1234",
          name: "John Doe",
        },
      },
      existingUser: {
        summary: "Existing user login",
        value: {
          phone_number: "+998901234567",
          otp: "1234",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "OTP verified and client authenticated successfully",
    type: VerifyOtpResponseDto,
    headers: {
      "Set-Cookie": {
        description: "HTTP-only refresh token cookie",
        schema: {
          type: "string",
          example:
            "refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Path=/",
        },
      },
    },
    schema: {
      example: {
        message: "Registration and login successful",
        client: {
          id: 1,
          phone_number: "+998901234567",
          name: "John Doe",
          is_active: true,
          is_verified: true,
        },
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Missing required fields",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Invalid or expired OTP",
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 401,
        message: "Invalid or expired OTP",
        error: "Unauthorized",
      },
    },
  })
  verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.clientService.verifyOtpAndAuth(verifyOtpDto, res);
  }

  // ========== PROTECTED AUTH ROUTES ==========

  @Post("auth/refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Refresh access token",
    description:
      "Generates a new access token using the refresh token stored in HTTP-only cookie. Also rotates the refresh token.",
    operationId: "refreshClientToken",
  })
  @ApiCookieAuth("refresh_token")
  @ApiResponse({
    status: 200,
    description: "Token refreshed successfully",
    type: RefreshTokenResponseDto,
    headers: {
      "Set-Cookie": {
        description: "New HTTP-only refresh token cookie",
        schema: {
          type: "string",
          example:
            "refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Path=/",
        },
      },
    },
    schema: {
      example: {
        message: "Token refreshed successfully",
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Invalid or missing refresh token",
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 401,
        message: "Invalid refresh token",
        error: "Unauthorized",
      },
    },
  })
  refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token missing");
    }
    return this.clientService.refreshToken(refreshToken, res);
  }

  @Post("auth/logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Logout client",
    description:
      "Invalidates the refresh token and clears the HTTP-only cookie. Client will need to re-authenticate.",
    operationId: "logoutClient",
  })
  @ApiCookieAuth("refresh_token")
  @ApiResponse({
    status: 200,
    description: "Client logged out successfully",
    type: LogoutResponseDto,
    headers: {
      "Set-Cookie": {
        description: "Cleared refresh token cookie",
        schema: {
          type: "string",
          example: "refresh_token=; HttpOnly; Path=/",
        },
      },
    },
    schema: {
      example: {
        message: "Logged out successfully",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Refresh token missing from cookies",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Invalid refresh token",
    type: ErrorResponseDto,
  })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.clientService.logout(req, res);
  }

  @Get("profile")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get client profile",
    description:
      "Retrieves the authenticated client's profile information using the refresh token from cookies.",
    operationId: "getClientProfile",
  })
  @ApiCookieAuth("refresh_token")
  @ApiResponse({
    status: 200,
    description: "Client profile retrieved successfully",
    type: ClientProfileResponseDto,
    schema: {
      example: {
        id: 1,
        phone_number: "+998901234567",
        name: "John Doe",
        is_active: true,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Invalid or missing refresh token",
    type: ErrorResponseDto,
  })
  async getProfile(@Req() req: Request) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token missing");
    }
    return this.clientService.getProfile(refreshToken);
  }

  // ========== ADMIN/CLIENT CRUD ROUTES ==========

  @Post()
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Create a new client (Admin only)",
    description:
      "Creates a new client record in the system. Only accessible by administrators.",
    operationId: "createClient",
  })
  @ApiBody({
    type: CreateClientDto,
    description: "Client creation payload",
    examples: {
      example1: {
        summary: "Create new client (minimal)",
        value: {
          phone_number: "+998901234567",
          name: "John Doe",
        },
      },
      example2: {
        summary: "Create new client (with optional fields)",
        value: {
          phone_number: "+998901234567",
          name: "John Doe",
          profile_photo_url: "https://example.com/photo.jpg",
          birthday: "1995-08-15",
          gender: "male",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Client created successfully",
    schema: {
      example: {
        id: 1,
        phone_number: "+998901234567",
        name: "John Doe",
        is_active: true,
        is_verified: true,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Validation failed",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing access token",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient privileges",
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
    summary: "Get all clients (Admin only)",
    description:
      "Retrieves a list of all clients in the system. Only accessible by administrators.",
    operationId: "getAllClients",
  })
  @ApiResponse({
    status: 200,
    description: "List of all clients retrieved successfully",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "number", example: 1 },
          phone_number: { type: "string", example: "+998901234567" },
          name: { type: "string", example: "John Doe" },
          is_active: { type: "boolean", example: true },
          is_verified: { type: "boolean", example: true },
          created_at: { type: "string", example: "2024-01-01T00:00:00.000Z" },
          updated_at: { type: "string", example: "2024-01-01T00:00:00.000Z" },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing access token",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient privileges",
    type: ErrorResponseDto,
  })
  findAll() {
    return this.clientService.findAll();
  }

  @Get(":id")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("client", "admin")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get client by ID",
    description:
      "Retrieves a specific client by their ID. Clients can only access their own data, admins can access any client.",
    operationId: "getClientById",
  })
  @ApiParam({
    name: "id",
    description: "Client ID",
    type: "number",
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "Client found successfully",
    schema: {
      example: {
        id: 1,
        phone_number: "+998901234567",
        name: "John Doe",
        is_active: true,
        is_verified: true,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Client with specified ID not found",
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 400,
        message: "Client with ID 1 not found",
        error: "Bad Request",
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing access token",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient privileges",
    type: ErrorResponseDto,
  })
  findOne(@Param("id") id: string) {
    return this.clientService.findOne(+id);
  }

  @Patch(":id")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("client", "admin")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update client by ID",
    description:
      "Updates a specific client's information. Clients can only update their own data, admins can update any client.",
    operationId: "updateClient",
  })
  @ApiParam({
    name: "id",
    description: "Client ID to update",
    type: "number",
    example: 1,
  })
  @ApiBody({
    type: UpdateClientDto,
    description: "Client update payload",
    examples: {
      example1: {
        summary: "Update client name",
        value: {
          name: "John Smith",
        },
      },
      example2: {
        summary: "Update client status",
        value: {
          is_active: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Client updated successfully",
    type: GenericMessageResponseDto,
    schema: {
      example: {
        message: "Client updated successfully",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Client with specified ID not found or validation failed",
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 400,
        message: "Client with ID 1 not found",
        error: "Bad Request",
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing access token",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient privileges",
    type: ErrorResponseDto,
  })
  update(@Param("id") id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientService.update(+id, updateClientDto);
  }

  @Delete(":id")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Delete client by ID (Admin only)",
    description:
      "Permanently deletes a client from the system. Only accessible by administrators.",
    operationId: "deleteClient",
  })
  @ApiParam({
    name: "id",
    description: "Client ID to delete",
    type: "number",
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "Client deleted successfully",
    type: GenericMessageResponseDto,
    schema: {
      example: {
        message: "Client deleted successfully",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Client with specified ID not found",
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 400,
        message: "Client with ID 1 not found",
        error: "Bad Request",
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing access token",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient privileges",
    type: ErrorResponseDto,
  })
  remove(@Param("id") id: string) {
    return this.clientService.remove(+id);
  }
}