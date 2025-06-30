import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
  InternalServerErrorException,
} from "@nestjs/common";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { UpdateAdminDto } from "./dto/update-admin.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Admin } from "./entities/admin.entity";
import { IsNull, MoreThan, Not, Repository } from "typeorm";
import { JwtTokenService } from "../auth/jwt.service";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { SetPasswordDto } from "./dto/set-password.dto";
import { MailService } from "../mail/mail.service";
import { Request, Response } from "express";
import { SignInDto } from "./dto/sign-in.dto";

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly mailService: MailService,
    private readonly jwtService: JwtTokenService
  ) {}

  async create(createAdminDto: CreateAdminDto) {
    const { email, first_name, last_name, role, phone_number } = createAdminDto;

    const existingAdmin = await this.adminRepository.findOne({
      where: { email },
    });
    if (existingAdmin) {
      throw new BadRequestException("Admin with this email already exists");
    }

    const activation_link = uuidv4();
    const expiryMs = parseInt(
      process.env.ACTIVATION_LINK_EXPIRY || "86400000",
      10
    );
    const activation_link_expires_at = new Date(Date.now() + expiryMs);

    return await this.adminRepository.manager.transaction(async (manager) => {
      const newAdmin = manager.create(Admin, {
        email,
        first_name,
        last_name,
        role,
        phone_number,
        activation_link,
        activation_link_expires_at,
        is_active: false,
      });

      const savedAdmin = await manager.save(Admin, newAdmin);
      this.logger.log(`Admin created: ${email}`);

      try {
        await this.mailService.sendMail(savedAdmin);
        const {
          password_hash,
          refresh_token,
          activation_link,
          activation_link_expires_at,
          ...adminResponse
        } = savedAdmin;

        return {
          admin: adminResponse,
          activation_link,
          message: "Admin created successfully. Activation email sent.",
        };
      } catch (error) {
        this.logger.error("Email sending error", error.stack);
        throw new ServiceUnavailableException(
          "Failed to send activation email"
        );
      }
    });
  }

  async activate(setPasswordDto: SetPasswordDto, res: Response) {
    const { activation_link, password, confirm_password } = setPasswordDto;

    if (password !== confirm_password) {
      throw new BadRequestException("Passwords do not match");
    }

    const admin = await this.adminRepository.findOne({
      where: {
        activation_link,
        is_active: false,
        activation_link_expires_at: MoreThan(new Date()),
      },
    });

    if (!admin) {
      this.logger.warn("Invalid or expired activation attempt");
      throw new BadRequestException("Invalid or expired activation link");
    }

    const password_hash = await bcrypt.hash(password, 12);

    await this.adminRepository.update(admin.id, {
      password_hash,
      activation_link: undefined,
      activation_link_expires_at: undefined,
      is_active: true,
      password_set_at: new Date(),
    });

    const updatedAdmin = await this.adminRepository.findOneBy({ id: admin.id });

    if (!updatedAdmin) {
      throw new InternalServerErrorException(
        "Admin activation failed — record not found after update."
      );
    }

    const { accessToken, refreshToken } = this.jwtService.generateTokens(
      {
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
        is_active: true,
      },
      process.env.ADMIN_REFRESH_TOKEN_KEY!,
      process.env.ADMIN_ACCESS_TOKEN_KEY!
    );

    updatedAdmin.refresh_token = await bcrypt.hash(refreshToken, 12);
    await this.adminRepository.save(updatedAdmin);

    this.logger.log(`Admin activated and signed in: ${updatedAdmin.email}`);

    res.cookie("refresh_token", refreshToken, {
      maxAge: Number(process.env.COOKIE_TIME),
      httpOnly: true,
    });

    return {
      message: "Password set successfully. Account activated.",
      admin_id: String(updatedAdmin.id),
      accessToken,
    };
  }

  async resendActivationEmail(adminId: number) {
    const admin = await this.adminRepository.findOne({
      where: {
        id: adminId,
        is_active: false,
        activation_link: Not(IsNull()),
        activation_link_expires_at: MoreThan(new Date()),
      },
    });

    if (!admin) {
      throw new BadRequestException(
        "Admin not found, already activated, or activation link expired"
      );
    }

    try {
      await this.mailService.sendMail(admin);
      this.logger.log(`Resent activation email to admin: ${admin.email}`);
      return { message: "Activation email resent successfully" };
    } catch (error) {
      this.logger.error("Failed to resend activation email", error.stack);
      throw new ServiceUnavailableException("Failed to send activation email");
    }
  }

  async findAll() {
    const admins = await this.adminRepository.find();
    if (!admins.length) {
      throw new NotFoundException("No admins found in the system");
    }
    return admins;
  }

  async findOne(id: number) {
    const admin = await this.adminRepository.findOneBy({ id });
    if (!admin) {
      throw new BadRequestException(`Admin with ID ${id} not found`);
    }
    return admin;
  }

  async update(id: number, updateAdminDto: UpdateAdminDto) {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new BadRequestException(`Admin with ID ${id} not found`);
    }

    await this.adminRepository.update(id, {
      ...updateAdminDto,
      updated_at: new Date(),
    });

    this.logger.log(`Admin updated: ID ${id}`);
    return { message: `Admin with ID ${id} updated successfully` };
  }

  async remove(id: number) {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new BadRequestException(`Admin with ID ${id} not found`);
    }

    await this.adminRepository.delete(id);

    this.logger.log(`Admin deleted: ID ${id}`);
    return { message: `Admin with ID ${id} deleted successfully` };
  }

  async signIn(res: Response, signInDto: SignInDto) {
    const { email, password } = signInDto;
    const admin = await this.adminRepository.findOneBy({ email });

    if (!admin || !admin.password_hash) {
      this.logger.warn(`Failed login attempt: ${email}`);
      throw new BadRequestException("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for admin: ${email}`);
      throw new UnauthorizedException("Invalid email or password");
    }

    const { accessToken, refreshToken } = this.jwtService.generateTokens(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        is_active: true,
      },
      process.env.ADMIN_REFRESH_TOKEN_KEY!,
      process.env.ADMIN_ACCESS_TOKEN_KEY!
    );

    admin.refresh_token = await bcrypt.hash(refreshToken, 12);
    await this.adminRepository.save(admin);

    res.cookie("refresh_token", refreshToken, {
      maxAge: Number(process.env.COOKIE_TIME),
      httpOnly: true,
    });

    this.logger.log(`Admin signed in: ${admin.email}`);

    return {
      message: "Admin signed in successfully",
      admin_id: String(admin.id),
      accessToken,
    };
  }

  async refreshTokens(req: Request, res: Response) {
    const refresh_token = req.cookies["refresh_token"];
    if (!refresh_token) {
      throw new BadRequestException("Refresh token missing in cookies");
    }

    const payload = await this.jwtService.verifyRefreshToken(
      refresh_token,
      process.env.ADMIN_REFRESH_TOKEN_KEY!
    );

    const admin = await this.adminRepository.findOneBy({ id: payload.id });
    if (!admin || !admin.refresh_token) {
      throw new UnauthorizedException("Admin not found or session invalid");
    }

    const isValid = await bcrypt.compare(refresh_token, admin.refresh_token);
    if (!isValid) {
      this.logger.warn(`Invalid refresh token for admin ID: ${payload.id}`);
      throw new UnauthorizedException("Invalid refresh token");
    }

    const { accessToken, refreshToken } = this.jwtService.generateTokens(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        is_active: true,
      },
      process.env.ADMIN_REFRESH_TOKEN_KEY!,
      process.env.ADMIN_ACCESS_TOKEN_KEY!
    );

    admin.refresh_token = await bcrypt.hash(refreshToken, 12);
    await this.adminRepository.save(admin);

    res.cookie("refresh_token", refreshToken, {
      maxAge: Number(process.env.COOKIE_TIME),
      httpOnly: true,
    });

    this.logger.log(`Tokens refreshed for admin ID: ${admin.id}`);

    return {
      message: "Tokens refreshed successfully",
      admin_id: String(admin.id),
      accessToken,
    };
  }

  async signOut(req: Request, res: Response) {
    const refreshToken = req.cookies["refresh_token"];
    if (!refreshToken) {
      throw new BadRequestException("Refresh token not found in cookies");
    }

    const payload = await this.jwtService.verifyRefreshToken(
      refreshToken,
      process.env.ADMIN_REFRESH_TOKEN_KEY!
    );

    const admin = await this.adminRepository.findOneBy({ id: payload.id });
    if (!admin) {
      throw new ForbiddenException("Admin not found during logout");
    }

    admin.refresh_token = "";
    await this.adminRepository.save(admin);
    res.clearCookie("refresh_token");

    this.logger.log(`Admin signed out: ${admin.email}`);
    return { message: "User signed out successfully" };
  }
}
