import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
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

  async create(createAdminDto: CreateAdminDto): Promise<{
    message: string;
    admin: Partial<Admin>;
    activation_link: string;
  }> {
    const { email, first_name, last_name, role, phone_number } = createAdminDto;

    const existingAdmin = await this.adminRepository.findOne({
      where: { email },
    });
    if (existingAdmin) {
      throw new BadRequestException("An admin with this email already exists");
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
        throw new ServiceUnavailableException("Error sending activation email");
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

    return {
      message:
        "Password set successfully. Account activated. Admin signed in successfully",
      admin_id: String(admin.id),
      accessToken,
    };
  }

  async resendActivationEmail(adminId: number): Promise<{ message: string }> {
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
      return { message: "Activation email resent successfully" };
    } catch (error) {
      this.logger.error("Email resending error", error.stack);
      throw new ServiceUnavailableException("Error sending activation email");
    }
  }

  async findAll(): Promise<Partial<Admin>[]> {
    const admins = await this.adminRepository.find();
    if (!admins.length) {
      throw new NotFoundException("No admins found");
    }
    return admins;
  }

  async findOne(id: number): Promise<Partial<Admin>> {
    const admin = await this.adminRepository.findOneBy({ id });

    if (!admin) {
      throw new BadRequestException(`Admin with ID ${id} not found`);
    }

    return admin;
  }

  async update(
    id: number,
    updateAdminDto: UpdateAdminDto
  ): Promise<{ message: string }> {
    const admin = await this.adminRepository.findOne({ where: { id } });

    if (!admin) {
      throw new BadRequestException(`Admin with ID ${id} not found`);
    }

    await this.adminRepository.update(id, {
      ...updateAdminDto,
      updated_at: new Date(),
    });

    return { message: `Admin with ID ${id} updated successfully` };
  }

  async remove(id: number): Promise<{ message: string }> {
    const admin = await this.adminRepository.findOne({ where: { id } });

    if (!admin) {
      throw new BadRequestException(`Admin with ID ${id} not found`);
    }

    await this.adminRepository.delete(id);

    return { message: `Admin with ID ${id} deleted successfully` };
  }

  async signIn(res: Response, signInDto: SignInDto) {
    const { email, password } = signInDto;
    const admin = await this.adminRepository.findOneBy({ email });

    if (!admin) {
      throw new NotFoundException("Incorrect email or password");
    }

    if (!admin.password_hash) {
      throw new BadRequestException(
        "Account is not activated or password not set"
      );
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Incorrect email or password");
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

    return {
      message: "Admin signed in successfully",
      admin_id: String(admin.id),
      accessToken,
    };
  }

  // async signIn(res: Response, signInDto: SignInDto) {
  //   const { email, password } = signInDto;
  //   const admin = await this.adminRepository.findOneBy({ email });

  //   if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
  //     throw new NotFoundException("Incorrect email or password");
  //   }

  //   const { accessToken, refreshToken } = this.jwtService.generateTokens(
  //     {
  //       id: admin.id,
  //       email: admin.email,
  //       role: admin.role,
  //       is_active: true,
  //     },
  //     process.env.ADMIN_REFRESH_TOKEN_KEY!,
  //     process.env.ADMIN_ACCESS_TOKEN_KEY!
  //   );

  //   admin.refresh_token = await bcrypt.hash(refreshToken, 12);
  //   await this.adminRepository.save(admin);

  //   res.cookie("refresh_token", refreshToken, {
  //     maxAge: Number(process.env.COOKIE_TIME),
  //     httpOnly: true,
  //   });

  //   return {
  //     message: "Admin signed in successfully",
  //     admin_id: String(admin.id),
  //     accessToken,
  //   };
  // }

  async refreshTokens(req: Request, res: Response) {
    const refresh_token = req.cookies["refresh_token"];
    if (!refresh_token) {
      throw new BadRequestException("Refresh token not found");
    }

    const payload = await this.jwtService.verifyRefreshToken(
      refresh_token,
      process.env.ADMIN_REFRESH_TOKEN_KEY!
    );

    const [admin] = await this.adminRepository.findBy({ id: payload.id });

    if (!admin || !admin.refresh_token) {
      throw new UnauthorizedException("Admin not found or not logged in");
    }

    const isValid = await bcrypt.compare(refresh_token, admin.refresh_token);
    if (!isValid) throw new UnauthorizedException("Incorrect refresh token");

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

    return {
      message: "Tokens refreshed successfully",
      admin_id: String(admin.id),
      accessToken,
    };
  }

  async signOut(refreshToken: string, res: Response) {
    const userData = await this.jwtService.verifyRefreshToken(
      refreshToken,
      process.env.ADMIN_REFRESH_TOKEN_KEY!
    );

    const [user] = await this.adminRepository.findBy({ id: userData.id });

    if (!user) {
      throw new ForbiddenException("User not found");
    }

    user.refresh_token = "";
    await this.adminRepository.save(user);

    res.clearCookie("refresh_token");
    return { message: "User signed out" };
  }
}

// import {
//   BadGatewayException,
//   BadRequestException,
//   ForbiddenException,
//   Injectable,
//   Logger,
//   NotFoundException,
//   ServiceUnavailableException,
//   UnauthorizedException,
// } from "@nestjs/common";
// import { CreateAdminDto } from "./dto/create-admin.dto";
// import { UpdateAdminDto } from "./dto/update-admin.dto";
// import { InjectRepository } from "@nestjs/typeorm";
// import { Admin } from "./entities/admin.entity";
// import { IsNull, MoreThan, Not, Repository } from "typeorm";
// import { JwtTokenService } from "../auth/jwt.service";
// import * as bcrypt from "bcrypt";
// import { v4 as uuidv4 } from "uuid";
// import { SetPasswordDto } from "./dto/set-password.dto";
// import { MailService } from "../mail/mail.service";
// import { Request, Response } from "express";
// import { SignInDto } from "./dto/sign-in.dto";

// @Injectable()
// export class AdminService {
//   private readonly logger = new Logger(AdminService.name);

//   constructor(
//     @InjectRepository(Admin)
//     private readonly adminRepository: Repository<Admin>,
//     private readonly mailService: MailService,
//     private readonly jwtService: JwtTokenService
//   ) {}

//   async create(
//     createAdminDto: CreateAdminDto
//   ): Promise<{ message: string; admin: Partial<Admin> }> {
//     const { email, first_name, last_name, role, phone_number } = createAdminDto;

//     // Check if admin with email already exists
//     const existingAdmin = await this.adminRepository.findOne({
//       where: { email },
//     });
//     if (existingAdmin) {
//       throw new BadRequestException("An admin with this email already exists");
//     }

//     // Generate activation link and expiration
//     const activation_link = uuidv4();
//     const expiryMs = parseInt(
//       process.env.ACTIVATION_LINK_EXPIRY || "86400000",
//       10
//     ); // 24 hours default
//     const activation_link_expires_at = new Date(Date.now() + expiryMs);

//     // Use a transaction for atomicity
//     return await this.adminRepository.manager.transaction(
//       async (transactionalEntityManager) => {
//         const newAdmin = transactionalEntityManager.create(Admin, {
//           email,
//           first_name,
//           last_name,
//           role: role, // Default to ADMIN
//           phone_number,
//           activation_link,
//           activation_link_expires_at,
//           is_active: false,
//         });

//         const savedAdmin = await transactionalEntityManager.save(
//           Admin,
//           newAdmin
//         );

//         try {
//           await this.mailService.sendMail(savedAdmin);
//           const {
//             password_hash,
//             activation_link: _,
//             refresh_token,
//             activation_link_expires_at,
//             ...adminResponse
//           } = savedAdmin;
//           return {
//             admin: adminResponse,
//             activation_link,
//             message: "Admin created successfully. Activation email sent.",
//           };
//         } catch (error) {
//           this.logger.error("Email sending error", error.stack);
//           throw new ServiceUnavailableException(
//             "Error sending activation email"
//           );
//         }
//       }
//     );
//   }

//   async activate(
//     setPasswordDto: SetPasswordDto,
//     res: Response
//   ): Promise<{
//     message: string;
//     admin_id: string;
//     accessToken: string;
//   }> {
//     const { activation_link, password, confirm_password } = setPasswordDto;

//     // Validate password match
//     if (password !== confirm_password) {
//       throw new BadRequestException("Passwords do not match");
//     }

//     // Find admin by activation link
//     const admin = await this.adminRepository.findOne({
//       where: {
//         activation_link,
//         is_active: false,
//         activation_link_expires_at: MoreThan(new Date()),
//       },
//     });

//     if (!admin) {
//       throw new BadRequestException("Invalid or expired activation link");
//     }

//     // Hash the new password
//     const password_hash = await bcrypt.hash(password, 12);

//     // Update admin with password and activate account
//     await this.adminRepository.update(admin.id, {
//       password_hash,
//       activation_link: undefined,
//       activation_link_expires_at: undefined,
//       is_active: true,
//       password_set_at: new Date(),
//     });

//     // Generate JWT tokens
//     const { accessToken, refreshToken } = this.jwtService.generateTokens(
//       {
//         id: Number(admin.id),
//         email: admin.email,
//         role: admin.role,
//         is_active: true,
//       },
//       process.env.ADMIN_REFRESH_TOKEN_KEY!,
//       process.env.ADMIN_ACCESS_TOKEN_KEY!
//     );

//     admin.refresh_token = await bcrypt.hash(refreshToken, 12);

//     await this.adminRepository.save(admin);
//     res.cookie("refresh_token", refreshToken, {
//       maxAge: Number(process.env.COOKIE_TIME),
//       httpOnly: true,
//     });

//     return {
//       message:
//         "Password set successfully. Account activated. Admin signed in successfully",
//       admin_id: String(admin.id),
//       accessToken,
//     };
//   }

//   async resendActivationEmail(adminId: number): Promise<{ message: string }> {
//     const admin = await this.adminRepository.findOne({
//       where: {
//         id: adminId,
//         is_active: false,
//         activation_link: Not(IsNull()),
//         activation_link_expires_at: MoreThan(new Date()),
//       },
//     });

//     if (!admin) {
//       throw new BadRequestException(
//         "Admin not found, already activated, or activation link expired"
//       );
//     }

//     try {
//       await this.mailService.sendMail(admin);
//       return { message: "Activation email resent successfully" };
//     } catch (error) {
//       this.logger.error("Email resending error", error.stack);
//       throw new ServiceUnavailableException("Error sending activation email");
//     }
//   }

//   async findAll() {
//     const admins = await this.adminRepository.find();
//     if (admins.length == 0) {
//       throw new NotFoundException("Admin topilmadi");
//     }
//   }

//   async findOne(id: number): Promise<Partial<Admin>> {
//     const admin = await this.adminRepository.findOneBy({ id });

//     if (!admin) {
//       throw new BadRequestException(`Admin with ID ${id} not found`);
//     }

//     return admin;
//   }

//   async update(
//     id: number,
//     updateAdminDto: UpdateAdminDto
//   ): Promise<{ message: string }> {
//     const admin = await this.adminRepository.findOne({ where: { id } });

//     if (!admin) {
//       throw new BadRequestException(`Admin with ID ${id} not found`);
//     }

//     await this.adminRepository.update(id, {
//       ...updateAdminDto,
//       updated_at: new Date(),
//     });

//     return { message: `Admin with ID ${id} updated successfully` };
//   }

//   async remove(id: number): Promise<{ message: string }> {
//     const admin = await this.adminRepository.findOne({ where: { id } });

//     if (!admin) {
//       throw new BadRequestException(`Admin with ID ${id} not found`);
//     }

//     await this.adminRepository.delete(id);

//     return { message: `Admin with ID ${id} deleted successfully` };
//   }

//   async singIn(res: Response, signInDto: SignInDto) {
//     const { email, password } = signInDto;
//     const admin = await this.adminRepository.findOneBy({ email });
//     if (!admin) throw new NotFoundException("Incorret email or password");

//     const validPassword = await bcrypt.compare(password, admin.password_hash);
//     if (!validPassword)
//       throw new NotFoundException("Incorret email or password");

//     // Generate JWT tokens
//     const { accessToken, refreshToken } = this.jwtService.generateTokens(
//       {
//         id: Number(admin.id),
//         email: admin.email,
//         role: admin.role,
//         is_active: true,
//       },
//       process.env.ADMIN_REFRESH_TOKEN_KEY!,
//       process.env.ADMIN_ACCESS_TOKEN_KEY!
//     );

//     admin.refresh_token = await bcrypt.hash(refreshToken, 12);

//     await this.adminRepository.save(admin);
//     res.cookie("refresh_token", refreshToken, {
//       maxAge: Number(process.env.COOKIE_TIME),
//       httpOnly: true,
//     });

//     return {
//       message: "Admin signed in successfully",
//       admin_id: String(admin.id),
//       accessToken,
//     };
//   }

//   async refreshTokens(req: Request, res: Response) {
//     const refresh_token = req.cookies["refresh_token"];

//     if (!refresh_token) {
//       throw new BadRequestException("Refresh token found");
//     }

//     const payload = await this.jwtService.verifyRefreshToken(
//       refresh_token,
//       process.env.ADMIN_REFRESH_TOKEN_KEY!
//     );

//     const admin = this.adminRepository.findBy({ id: payload.id });
//     const token = admin[0]?.refresh_token;

//     if (!admin || token) {
//       throw new UnauthorizedException("admin topilmadi yoki login qilinmagan");
//     }

//     const isValid = await bcrypt.compare(refresh_token, token);
//     if (!isValid) throw new UnauthorizedException("Incorrect refreshToken");

//     const { accessToken, refreshToken } = this.jwtService.generateTokens(
//       {
//         id: Number(admin[0]?.id),
//         email: admin[0].email,
//         role: admin[0].role,
//         is_active: true,
//       },
//       process.env.ADMIN_REFRESH_TOKEN_KEY!,
//       process.env.ADMIN_ACCESS_TOKEN_KEY!
//     );

//     admin[0].refresh_token = await bcrypt.hash(refreshToken, 12);

//     await this.adminRepository.save(admin[0]);
//     res.cookie("refresh_token", refreshToken, {
//       maxAge: Number(process.env.COOKIE_TIME),
//       httpOnly: true,
//     });

//     return {
//       message: "tokens refreshed successfully",
//       admin_id: String(admin[0].id),
//       accessToken,
//     };
//   }

//   async signOut(refreshToken: string, res: Response) {
//     const userData = await this.jwtService.verifyRefreshToken(
//       refreshToken,
//       process.env.ADMIN_REFRESH_TOKEN_KEY!
//     );

//     const user = await this.adminRepository.findBy({id:userData.id})[0]

//     if (!user) throw new ForbiddenException("User not found");

//     user.refresh_token = null;
//     await user.save();

//     res.clearCookie("refresh_token");
//     return { message: "User signed out" };
//   }
// }
