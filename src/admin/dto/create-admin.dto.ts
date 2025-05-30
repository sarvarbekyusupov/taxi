import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { AdminRole } from "../entities/admin.entity";

export class CreateAdminDto {
  @ApiProperty({ example: "John", description: "First name of the admin" })
  @IsNotEmpty({ message: "First name is required" })
  @IsString({ message: "First name must be a string" })
  first_name: string;

  @ApiProperty({ example: "Doe", description: "Last name of the admin" })
  @IsNotEmpty({ message: "Last name is required" })
  @IsString({ message: "Last name must be a string" })
  last_name: string;

  @ApiProperty({
    example: "john.doe@example.com",
    description: "Email address of the admin",
  })
  @IsEmail({}, { message: "Invalid email format" })
  @IsNotEmpty({ message: "Email is required" })
  email: string;

  @ApiProperty({
    enum: AdminRole,
    example: AdminRole.ADMIN,
    description: "Role of the admin",
    required: false,
  })
  @IsOptional()
  @IsEnum(AdminRole, { message: "Invalid role" })
  role?: AdminRole;

  @ApiProperty({
    example: "+998901234567",
    description: "Phone number of the admin",
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  phone_number?: string;
}
