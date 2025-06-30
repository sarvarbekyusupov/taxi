import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsPhoneNumber } from "class-validator";

export class RequestOtpDto {
  @ApiProperty({ example: "+11234567890" })
  @IsPhoneNumber("UZ", { message: "Phone number must be valid for Uzbekistan" })
  phone_number: string;

  @ApiProperty({ example: "John Doe" })
  @IsNotEmpty()
  name: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: "+11234567890" })
  @IsPhoneNumber()
  phone_number: string;

  @ApiProperty({ example: "123456" })
  @IsNotEmpty()
  otp: string;
}
