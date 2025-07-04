import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  Matches,
  Length,
  IsPhoneNumber,
  IsOptional,
} from "class-validator";

export class CreateDriverDto {
  @ApiProperty({ example: "+1234567890" })
  @IsPhoneNumber()
  @IsNotEmpty()
  phone_number: string;

  @ApiProperty({ example: "John" })
  @IsString()
  @IsNotEmpty()
  first_name?: string;

  @ApiProperty({ example: "Doe" })
  @IsString()
  @IsNotEmpty()
  last_name?: string;

  @ApiProperty({ example: "DL1234567890" })
  @IsString()
  @IsNotEmpty()
  driver_license_number?: string;
}



export class VerifyDriverOtpDto {
  @ApiProperty({ example: "+1234567890" })
  @IsPhoneNumber()
  @IsNotEmpty()
  phone_number: string;

  @ApiProperty({ example: "1234" })
  otp: string;

  @ApiProperty({ example: "John", required: false })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiProperty({ example: "Doe", required: false })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({ example: "DL1234567890", required: false })
  @IsOptional()
  @IsString()
  driver_license_number?: string;
}

