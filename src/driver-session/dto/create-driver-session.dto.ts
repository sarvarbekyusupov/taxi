import { ApiProperty } from "@nestjs/swagger";

export class CreateDriverSessionDto {
  @ApiProperty({ example: 101 })
  driver_id: number;

  @ApiProperty({ example: "eyJhbGciOi..." })
  refresh_token: string;

  @ApiProperty({ example: "DEVICE123", required: false })
  device_id?: string;

  @ApiProperty({ example: "android", required: false })
  device_type?: string;

  @ApiProperty({ example: "fcmTokenHere", required: false })
  fcm_token?: string;

  @ApiProperty({ example: true, required: false })
  is_active?: boolean;

  @ApiProperty({ example: "2025-06-01T12:00:00Z" })
  expires_at: Date;
}
