import { ApiProperty } from "@nestjs/swagger";

export class CreateOtpDto {
  @ApiProperty({ example: "+1234567890" })
  phone_number: string;

  @ApiProperty({ example: "123456" })
  code: string;

  @ApiProperty({ example: "client" })
  user_type: string;

  @ApiProperty({ example: "login" })
  purpose: string;

  @ApiProperty({ example: false, required: false })
  is_used?: boolean;

  @ApiProperty({ example: "2025-05-29T12:00:00Z" })
  expires_at: Date;
}
