import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsNotEmpty,
  IsString,
  Matches,
  Length,
  IsPhoneNumber,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
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
  @IsString()
  @IsNotEmpty()
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

export class ProfileCompleteDto {
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsString()
  @IsNotEmpty()
  driver_license_number: string;
}

export class DriverSearchDto {
  @ApiPropertyOptional({ description: "Search by partial phone number." })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiPropertyOptional({ description: "Search by partial first name." })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional({ description: "Search by partial last name." })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({ description: "Filter by active status." })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_active?: boolean;

  @ApiPropertyOptional({ description: "Filter by verified status." })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_verified?: boolean;

  @ApiPropertyOptional({
    description: "Page number for pagination.",
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: "Number of items per page.",
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}

// ADD THIS DTO for the admin status patch endpoints
export class UpdateDriverStatusDto {
  @ApiProperty({ description: "The new status to set." })
  @IsBoolean()
  status: boolean;
}