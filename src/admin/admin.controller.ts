import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  Res,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UnauthorizedException,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { UpdateAdminDto } from "./dto/update-admin.dto";
import { SetPasswordDto } from "./dto/set-password.dto";
import { SignInDto } from "./dto/sign-in.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { Request, Response } from "express";
import { Admin } from "./entities/admin.entity";

@ApiTags("admin")
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  @ApiOperation({ summary: "Create a new admin" })
  @ApiBody({ type: CreateAdminDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Admin created successfully.",
    type: Object,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "An admin with this email already exists.",
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: "Error sending activation email.",
  })
  async create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @Get()
  @ApiOperation({ summary: "Retrieve all admins" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "List of admins.",
    type: [Admin],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "No admins found.",
  })
  async findAll() {
    return this.adminService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Retrieve an admin by ID" })
  @ApiParam({ name: "id", description: "Admin ID", type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Admin details.",
    type: Admin,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Admin not found.",
  })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update an admin" })
  @ApiParam({ name: "id", description: "Admin ID", type: Number })
  @ApiBody({ type: UpdateAdminDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Admin updated successfully.",
    type: Object,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Admin not found.",
  })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateAdminDto: UpdateAdminDto
  ) {
    return this.adminService.update(id, updateAdminDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete an admin" })
  @ApiParam({ name: "id", description: "Admin ID", type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Admin deleted successfully.",
    type: Object,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Admin not found.",
  })
  async remove(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.remove(id);
  }

  @Post("activate")
  @ApiOperation({ summary: "Activate admin account and set password" })
  @ApiBody({ type: SetPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Account activated and signed in.",
    type: Object,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid or expired activation link.",
  })
  async activate(
    @Body() setPasswordDto: SetPasswordDto,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.adminService.activate(setPasswordDto, res);
  }

  @Post("signin")
  @ApiOperation({ summary: "Sign in an admin" })
  @ApiBody({ type: SignInDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Admin signed in successfully.",
    type: Object,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Incorrect email or password.",
  })
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.adminService.signIn(res, signInDto);
  }

  @Post("refresh")
  @ApiOperation({ summary: "Refresh admin tokens" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Tokens refreshed successfully.",
    type: Object,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Refresh token not found.",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Invalid refresh token.",
  })
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.adminService.refreshTokens(req, res);
  }

  @Post("signout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Sign out admin" })
  @ApiResponse({ status: HttpStatus.OK, description: "User signed out." })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Refresh token missing",
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: "User not found" })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return await this.adminService.signOut(req, res);
  }

  @Post(":id/resend-activation")
  @ApiOperation({ summary: "Resend activation email" })
  @ApiParam({ name: "id", description: "Admin ID", type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Activation email resent successfully.",
    type: Object,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Admin not found or already activated.",
  })
  async resendActivationEmail(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.resendActivationEmail(id);
  }
}
