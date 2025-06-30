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
    description: "Device ID",
    required: false,
  })
  @IsOptional()
  @IsString()
  device_id?: string;

  @ApiProperty({
    example: "android",
    description: "Device type (e.g., ios, android)",
    required: false,
  })
  @IsOptional()
  @IsString()
  device_type?: string;

  @ApiProperty({
    example: "fcm_token_abc123",
    description: "Firebase Cloud Messaging token",
    required: false,
  })
  @IsOptional()
  @IsString()
  fcm_token?: string;

  @ApiProperty({
    example: true,
    description: "Whether the session is active",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({
    example: "2025-07-01T12:00:00Z",
    description: "Session expiration date (ISO format)",
  })
  @IsDateString()
  expires_at: Date;
}
