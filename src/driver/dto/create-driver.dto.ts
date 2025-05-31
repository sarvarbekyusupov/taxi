import { ApiProperty } from "@nestjs/swagger";

export class CreateDriverDto {
  @ApiProperty({ example: "+1234567890" })
  phone_number: string;

  @ApiProperty({ example: "John" })
  first_name: string;

  @ApiProperty({ example: "Doe" })
  last_name: string;

  @ApiProperty({ example: "DL1234567890" })
  driver_license_number: string;
}

export class VerifyDriverOtpDto {
  @ApiProperty({ example: "+1234567890" })
  phone_number: string;

  @ApiProperty({ example: "1234" })
  otp: string;

  @ApiProperty({ example: "John", required: false })
  first_name?: string;

  @ApiProperty({ example: "Doe", required: false })
  last_name?: string;

  @ApiProperty({ example: "DL1234567890", required: false })
  driver_license_number?: string;
}