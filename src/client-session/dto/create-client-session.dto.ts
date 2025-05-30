import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateClientSessionDto {
  @ApiProperty({ example: 42, description: "Client ID" })
  @IsNumber()
  client_id: number;

  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "Refresh token",
  })
  @IsString()
  refresh_token: string;

  @ApiProperty({
    example: "device-uuid-123",
    required: false,
    description: "Device ID",
  })
  @IsOptional()
  @IsString()
  device_id?: string;

  @ApiProperty({
    example: "android",
    required: false,
    description: "Device type",
  })
  @IsOptional()
  @IsString()
  device_type?: string;

  @ApiProperty({
    example: "fcm_token_abc123",
    required: false,
    description: "FCM token",
  })
  @IsOptional()
  @IsString()
  fcm_token?: string;

  @ApiProperty({
    example: true,
    required: false,
    description: "Session active status",
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({
    example: "2025-07-01T12:00:00Z",
    description: "Expiration timestamp",
  })
  @IsDateString()
  expires_at: Date;
}
