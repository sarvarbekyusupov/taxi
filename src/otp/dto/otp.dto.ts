import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from "class-validator";

export class SendOtpDto {
  @ApiProperty({ example: "+998901234567" })
  @IsPhoneNumber()
  phone_number: string;
}

// export class VerifyOtpDto {
//   @IsPhoneNumber("UZ")
//   @IsNotEmpty()
//   phone_number: string;

//   @IsString()
//   @IsNotEmpty()
//   otp: string;

//   @IsString()
//   @IsOptional()
//   name?: string; // Only required for new users
// }

export class VerifyOtpDto {
  @ApiProperty({
    example: "+998901234567",
    description: "Client phone number in international format",
  })
  @IsPhoneNumber("UZ")
  @IsNotEmpty()
  phone_number: string;

  @ApiProperty({
    example: "1234",
    description: "OTP code received by the client",
  })
  @IsString()
  @IsNotEmpty()
  otp: string;

  // @ApiPropertyOptional({
  //   example: "Ali",
  //   description: "Client name (optional, only required for new users)",
  // })
  @IsString()
  @IsOptional()
  name?: string;
}