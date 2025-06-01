import { ApiProperty } from "@nestjs/swagger";
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from "class-validator";

export class SendOtpDto {
  @ApiProperty({ example: "+11234567890" })
  @IsPhoneNumber()
  phone_number: string;
}

export class VerifyOtpDto {
  @IsPhoneNumber("UZ")
  @IsNotEmpty()
  phone_number: string;

  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsString()
  @IsOptional()
  name?: string; // Only required for new users
}

