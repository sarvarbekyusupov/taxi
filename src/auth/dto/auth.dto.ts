import { ApiProperty } from "@nestjs/swagger";
import { IsPhoneNumber, IsString, Length } from "class-validator";

export class RequestOtpDto {
  @ApiProperty({ example: "+1234567890" })
  @IsPhoneNumber()
  phone_number: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: "+1234567890" })
  @IsPhoneNumber()
  phone_number: string;

  @ApiProperty({ example: "1234" })
  @IsString()
  @Length(4, 4)
  otp: string;
}

export class CompleteSignupDto {
  @ApiProperty({ example: "+1234567890" })
  @IsPhoneNumber()
  phone_number: string;

  @ApiProperty({ example: "John Doe" })
  @IsString()
  name: string;
}
