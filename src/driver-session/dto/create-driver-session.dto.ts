import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateDriverSessionDto {
  @ApiProperty({ example: 101 })
  @IsNumber()
  @IsNotEmpty()
  driver_id: number;

  @ApiProperty({ example: "eyJhbGciOi..." })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;

  @ApiProperty({ example: "DEVICE123", required: false })
  @IsOptional()
  @IsString()
  device_id?: string;

  @ApiProperty({ example: "android", required: false })
  @IsOptional()
  @IsString()
  device_type?: string;

  @ApiProperty({ example: "fcmTokenHere", required: false })
  @IsOptional()
  @IsString()
  fcm_token?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({ example: "2025-06-01T12:00:00Z" })
  @IsDateString()
  @IsNotEmpty()
  expires_at: Date;
}
