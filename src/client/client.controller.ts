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

  // =========== SEND OTP =======================

  @Post("auth/send-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "1.1. Send OTP to Client Phone Number",
    operationId: "clientSendOtp",
  })
  @ApiResponse({
    status: 200,
    description:
      "OTP sent successfully. The `requires_registration` flag indicates if the phone number is new to the system.",
    schema: {
      example: {
        message: "OTP sent successfully",
        requires_registration: true,
        phone_number: "+998901234567",
        new_otp: "1234", // Note: Exposing OTP in the response is generally for testing/demo purposes.
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid phone number format or other bad request.",
    schema: {
      example: {
        statusCode: 400,
        message: "Invalid phone number format.",
        error: "Bad Request",
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: "Too many requests (Rate limit exceeded).",
    schema: {
      example: {
        statusCode: 429,
        message: "Too many requests",
        error: "Too Many Requests",
      },
    },
  })
  sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.clientService.sendOtp(sendOtpDto);
  }

  // ================ VERIFY OTP ============

  @Post("auth/verify-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "1.2. Verify OTP & Authenticate (Login/Register)",
    description:
      "Verifies the OTP to log in an existing client or register a new one. Sets a `refresh_token` as an HTTP-only cookie.",
    operationId: "clientVerifyOtp",
  })
  @ApiBody({
    description:
      "The OTP sent to the user's phone. A name can optionally be provided during registration.",
    schema: {
      type: "object",
      properties: {
        phone_number: { type: "string", example: "+998901234567" },
        otp: { type: "string", example: "1234" },
      },
      required: ["phone_number", "otp"],
    },
  })
  @ApiResponse({
    status: 200,
    description:
      "Authentication successful. The response body varies slightly depending on whether the user is new (registering) or existing (logging in).",
    headers: {
      "Set-Cookie": {
        description:
          "Sets the `refresh_token` as an HTTP-only cookie on success.",
        schema: {
          type: "string",
          example: "refresh_token=...; Path=/; HttpOnly",
        },
      },
    },
    content: {
      "application/json": {
        examples: {
          // Example 1: Existing user logging in
          login: {
            summary: "Existing User Login",
            value: {
              message: "Login successful",
              requires_registration: false,
              client: {
                id: "cl_9e8b7c6a5d",
                phone_number: "+998901234567",
                name: "John Doe",
                is_active: true,
                is_verified: true,
              },
              accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
          },
          // Example 2: New user registering
          registration: {
            summary: "New User Registration",
            value: {
              message: "Registration and login successful",
              requires_registration: true,
              client: {
                id: "cl_a1b2c3d4e5",
                phone_number: "+998907654321",
                name: null,
                is_active: true,
                is_verified: true,
              },
              accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Invalid or expired OTP provided.",
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
  verifyOtp(
    @Body() verifyOtpDto: any, // Replace 'any' with your VerifyOtpDto
    @Res({ passthrough: true }) res: Response
  ) {
    return this.clientService.verifyOtpAndAuth(verifyOtpDto, res);
  }

  // ============================================
  // ========== 2. PROTECTED AUTH ACTIONS ==========
  // ============================================

  // =========== AUTH / REFRSH =========

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
    description:
      "Token refreshed successfully. A new access token is returned in the body, and a new refresh token is set in the `Set-Cookie` header.",
    headers: {
      "Set-Cookie": {
        description: "Sets the new HTTP-only refresh token.",
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
          accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Im...",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Invalid, expired, or missing refresh token.",
    content: {
      "application/json": {
        example: {
          statusCode: 401,
          message: "Invalid, expired, or missing refresh token.",
          error: "Unauthorized",
        },
      },
    },
  })
  refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token is missing");
    }
    return this.clientService.refreshToken(refreshToken, res);
  }

  //==============LOGOUT ============

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
    description: "Logout successful. The refresh_token cookie is cleared.",
    headers: {
      "Set-Cookie": {
        description:
          "Clears the `refresh_token` cookie from the client's browser.",
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
    status: 400,
    description: "Refresh token is missing from the request cookie.",
    content: {
      "application/json": {
        example: {
          statusCode: 400,
          message: "Refresh token missing",
          error: "Bad Request",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "The provided refresh token is invalid or expired.",
    content: {
      "application/json": {
        example: {
          statusCode: 401,
          message: "Invalid refresh token",
          error: "Unauthorized",
        },
      },
    },
  })
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.clientService.logout(req, res);
  }

  // ==================================================
  // ========== 3. PROTECTED PROFILE & CRUD ==========
  // ==================================================

  //============= PROFILE/ COMPLETE
  @Patch("profile/complete")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("client")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "3.1. Complete Client Profile",
    description:
      "Allows a newly registered client to add details like their name, photo, birthday, and gender. Requires a valid access token.",
    operationId: "clientCompleteProfile",
  })
  @ApiBody({
    description:
      "Fields to complete the client's profile. All fields are optional except for 'name'.",
    schema: {
      type: "object",
      properties: {
        name: { type: "string", example: "John Doe" },
        profile_photo_url: {
          type: "string",
          example: "https://example.com/photo.jpg",
        },
        birthday: {
          type: "string",
          format: "date-time",
          example: "1990-05-15",
        },
        gender: { type: "string", enum: ["male", "female"], example: "male" },
      },
      required: ["name"],
    },
  })
  @ApiResponse({
    status: 200,
    description: "Profile completed successfully.",
    content: {
      "application/json": {
        example: {
          message: "Profile completed successfully",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description:
      "Unauthorized. The provided access token is invalid or expired.",
    content: {
      "application/json": {
        example: {
          statusCode: 401,
          message: "Unauthorized",
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "The client associated with the access token was not found.",
    content: {
      "application/json": {
        example: {
          statusCode: 404,
          message: "Client not found",
          error: "Not Found",
        },
      },
    },
  })
  @ApiResponse({
    // <<< ADD THIS BLOCK
    status: 500,
    description:
      "Internal server error. Typically caused by a database constraint violation or other unhandled exceptions.",
    content: {
      "application/json": {
        example: {
          statusCode: 500,
          message: "Internal server error",
        },
      },
    },
  })
  completeProfile(
    @Body() dto: CompleteProfileDto,
    @GetCurrentUser("id") userId: number
    
  ) {
    return this.clientService.completeProfile(userId, dto);
  }

  //================ PROFILE/ME=========

  @Get("profile/me")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("client")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "3.2. Get Own Profile",
    description:
      "Retrieves the complete profile information for the currently authenticated client.",
    operationId: "getClientProfile",
  })
  @ApiResponse({
    status: 200,
    description: "The current client's profile was retrieved successfully.",
    content: {
      "application/json": {
        example: {
          id: 1,
          phone_number: "+998901234567",
          name: "John Doe",
          profile_photo_url: "https://example.com/photo.jpg",
          birthday: "1990-05-15T00:00:00.000Z",
          gender: "male",
          is_active: true,
          is_verified: true,
          refresh_token: null,
          created_at: "2025-07-11T06:15:00.000Z",
          updated_at: "2025-07-11T06:20:00.000Z",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description:
      "Unauthorized. The provided access token is invalid, expired, or missing.",
    content: {
      "application/json": {
        example: {
          statusCode: 401,
          message: "Unauthorized",
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description:
      "The client associated with the access token was not found in the database.",
    content: {
      "application/json": {
        example: {
          statusCode: 404,
          message: "Client with ID 1 not found",
          error: "Not Found",
        },
      },
    },
  })
  async getProfile(@GetCurrentUser("id") userId: number) {
    // Basic check to prevent unnecessary DB call if ID is invalid
    if (!userId) throw new UnauthorizedException();
    return this.clientService.findOne(userId);
  }

  // =========================================
  // ========== 4. ADMIN-ONLY CRUD ==========
  // =========================================

  //============= CREATE CLEINT BY ADMIN=======
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "4.1. Create a New Client (Admin)",
    description:
      "Allows an admin to manually create a new client record in the system.",
    operationId: "adminCreateClient",
  })
  @ApiBody({
    description:
      "Data for the new client. All fields are optional except 'name'.",
    schema: {
      type: "object",
      properties: {
        phone_number: { type: "string", example: "+998901234567" },
        name: { type: "string", example: "Jane Doe" },
        profile_photo_url: {
          type: "string",
          example: "https://example.com/photo_jane.jpg",
        },
        birthday: {
          type: "string",
          format: "date-time",
          example: "1998-10-20T00:00:00.000Z",
        },
        gender: { type: "string", enum: ["male", "female"], example: "female" },
      },
      required: ["name"],
    },
  })
  @ApiResponse({
    status: 201,
    description:
      "Client created successfully. Returns the newly created client object.",
    content: {
      "application/json": {
        example: {
          id: 2,
          phone_number: "+998901234567",
          name: "Jane Doe",
          profile_photo_url: "https://example.com/photo_jane.jpg",
          birthday: "1998-10-20T00:00:00.000Z",
          gender: "female",
          is_active: true,
          is_verified: false, // Default state
          refresh_token: null,
          created_at: "2025-07-11T11:37:00.000Z",
          updated_at: "2025-07-11T11:37:00.000Z",
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      "Bad Request: Validation error (e.g., invalid phone number format or missing required fields).",
    content: {
      "application/json": {
        example: {
          statusCode: 400,
          message: [
            "phone_number must be a valid phone number",
            "name must be a string",
          ],
          error: "Bad Request",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description:
      "Unauthorized. The admin's access token is invalid or expired.",
    content: {
      "application/json": {
        example: {
          statusCode: 401,
          message: "Unauthorized",
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden. The authenticated user is not an admin.",
    content: {
      "application/json": {
        example: {
          statusCode: 403,
          message: "Forbidden resource",
          error: "Forbidden",
        },
      },
    },
  })
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientService.create(createClientDto);
  }

  // ============== GET ALL CLIENTS BY ADMIN =======

  @Get()
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "4.2. Get All Clients (Admin)",
    description:
      "Retrieves a comprehensive list of all client records in the system.",
    operationId: "adminGetAllClients",
  })
  @ApiResponse({
    status: 200,
    description: "An array of all client objects.",
    content: {
      "application/json": {
        example: [
          {
            id: 1,
            phone_number: "+998901234567",
            name: "John Doe",
            profile_photo_url: "https://example.com/photo.jpg",
            birthday: "1990-05-15T00:00:00.000Z",
            gender: "male",
            is_active: true,
            is_verified: true,
            created_at: "2025-07-11T06:15:00.000Z",
            updated_at: "2025-07-11T06:20:00.000Z",
          },
          {
            id: 2,
            phone_number: "+998907654321",
            name: "Jane Doe",
            profile_photo_url: "https://example.com/photo_jane.jpg",
            birthday: "1998-10-20T00:00:00.000Z",
            gender: "female",
            is_active: true,
            is_verified: false,
            created_at: "2025-07-11T11:37:00.000Z",
            updated_at: "2025-07-11T11:37:00.000Z",
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description:
      "Unauthorized. The admin's access token is invalid or expired.",
    content: {
      "application/json": {
        example: {
          statusCode: 401,
          message: "Unauthorized",
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden. The authenticated user is not an admin.",
    content: {
      "application/json": {
        example: {
          statusCode: 403,
          message: "Forbidden resource",
          error: "Forbidden",
        },
      },
    },
  })
  findAll() {
    return this.clientService.findAll();
  }

  // ===========FIND ONE BY ADMIN ========

  @Get(":id")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "4.3. Get Client by ID (Admin)",
    description: "Retrieves a single client's details by their numeric ID.",
    operationId: "adminGetClientById",
  })
  @ApiParam({
    name: "id",
    description: "Numeric ID of the client to retrieve.",
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "The client object was retrieved successfully.",
    content: {
      "application/json": {
        example: {
          id: 1,
          phone_number: "+998901234567",
          name: "John Doe",
          profile_photo_url: "https://example.com/photo.jpg",
          birthday: "1990-05-15T00:00:00.000Z",
          gender: "male",
          is_active: true,
          is_verified: true,
          created_at: "2025-07-11T06:15:00.000Z",
          updated_at: "2025-07-11T06:20:00.000Z",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description:
      "Unauthorized. The admin's access token is invalid or expired.",
    content: {
      "application/json": {
        example: {
          statusCode: 401,
          message: "Unauthorized",
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden. The authenticated user is not an admin.",
    content: {
      "application/json": {
        example: {
          statusCode: 403,
          message: "Forbidden resource",
          error: "Forbidden",
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "A client with the specified ID was not found.",
    content: {
      "application/json": {
        example: {
          statusCode: 404,
          message: "Client with ID 999 not found",
          error: "Not Found",
        },
      },
    },
  })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.clientService.findOne(id);
  }

  //============UPDATE CLIENT BY ID=======
  @Patch(":id")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "4.4. Update Client by ID (Admin)",
    description:
      "Updates a client's details by their numeric ID. All fields in the body are optional.",
    operationId: "adminUpdateClient",
  })
  @ApiParam({
    name: "id",
    description: "Numeric ID of the client to update.",
    example: 1,
  })
  @ApiBody({
    description:
      "Data to update for the client. Any field provided will overwrite the existing value.",
    schema: {
      type: "object",
      properties: {
        name: { type: "string", example: "Johnny Doe" },
        is_active: { type: "boolean", example: false },
        gender: { type: "string", enum: ["male", "female"], example: "male" },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Client updated successfully.",
    content: {
      "application/json": {
        example: {
          message: "Client updated successfully",
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      "Bad Request: Validation error (e.g., providing a field with the wrong data type).",
    content: {
      "application/json": {
        example: {
          statusCode: 400,
          message: ["is_active must be a boolean value"],
          error: "Bad Request",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description:
      "Unauthorized. The admin's access token is invalid or expired.",
    content: {
      "application/json": {
        example: {
          statusCode: 401,
          message: "Unauthorized",
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden. The authenticated user is not an admin.",
    content: {
      "application/json": {
        example: {
          statusCode: 403,
          message: "Forbidden resource",
          error: "Forbidden",
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "A client with the specified ID was not found.",
    content: {
      "application/json": {
        example: {
          statusCode: 404,
          message: "Client with ID 999 not found",
          error: "Not Found",
        },
      },
    },
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
    description:
      "Permanently deletes a client record from the system by their numeric ID.",
    operationId: "adminDeleteClient",
  })
  @ApiParam({
    name: "id",
    description: "Numeric ID of the client to delete.",
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description:
      "Client deleted successfully. No content is returned in the response body.",
  })
  @ApiResponse({
    status: 401,
    description:
      "Unauthorized. The admin's access token is invalid or expired.",
    content: {
      "application/json": {
        example: {
          statusCode: 401,
          message: "Unauthorized",
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden. The authenticated user is not an admin.",
    content: {
      "application/json": {
        example: {
          statusCode: 403,
          message: "Forbidden resource",
          error: "Forbidden",
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "A client with the specified ID was not found.",
    content: {
      "application/json": {
        example: {
          statusCode: 404,
          message: "Client with ID 999 not found",
          error: "Not Found",
        },
      },
    },
  })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.clientService.remove(id);
  }
}