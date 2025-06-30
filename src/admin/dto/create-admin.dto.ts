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
  @ApiProperty({
    example: "John",
    description: "First name of the admin. Required.",
  })
  @IsNotEmpty({ message: "First name is required" })
  @IsString({ message: "First name must be a string" })
  first_name: string;

  @ApiProperty({
    example: "Doe",
    description: "Last name of the admin. Required.",
  })
  @IsNotEmpty({ message: "Last name is required" })
  @IsString({ message: "Last name must be a string" })
  last_name: string;

  @ApiProperty({
    example: "john.doe@example.com",
    description: "Admin's unique email address. Required.",
  })
  @IsEmail({}, { message: "Invalid email format" })
  @IsNotEmpty({ message: "Email is required" })
  email: string;

  @ApiProperty({
    enum: AdminRole,
    example: AdminRole.ADMIN,
    description:
      "Role of the admin. Optional. Defaults to ADMIN if not provided.",
    required: false,
  })
  @IsOptional()
  @IsEnum(AdminRole, { message: "Invalid role" })
  role?: AdminRole;

  @ApiProperty({
    example: "+998901234567",
    description: "Admin's phone number in international format. Optional.",
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber("UZ", {
    message: "Phone number must be valid for Uzbekistan (+998...)",
  })
  phone_number?: string;
}
