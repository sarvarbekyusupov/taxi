import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsInt,
  IsPhoneNumber,
  IsNotEmpty,
} from "class-validator";

export class CreateClientDto {
  @ApiProperty({ example: "+1234567890" })
  @IsPhoneNumber("UZ")
  @IsNotEmpty()
  phone_number: string;

  @ApiProperty({ example: "John Doe" })
  @IsString()
  name: string;

  @ApiProperty({ example: "https://example.com/photo.jpg", required: false })
  @IsOptional()
  @IsString()
  profile_photo_url?: string;

  @ApiProperty({ example: 25, required: false })
  @IsOptional()
  @IsInt()
  total_rides?: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_active: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  is_verified: boolean;

  @ApiProperty({ example: 123456 })
  @IsInt()
  refresh_token: string;

  @ApiProperty({ example: 789012 })
  @IsInt()
  @IsOptional()
  client_otp: number;
}
