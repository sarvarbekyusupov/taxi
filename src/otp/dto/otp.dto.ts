import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsPhoneNumber, IsString } from "class-validator";

export class RequestOtpDto {
  @ApiProperty({ example: "+11234567890" })
  @IsPhoneNumber()
  phone_number: string;

  @ApiProperty({ example: "client" })
  @IsIn(["client", "driver"])
  user_type: string;

  @ApiProperty({ example: "signup" })
  @IsString()
  purpose: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: "+11234567890" })
  @IsPhoneNumber()
  phone_number: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  code: string;

  @ApiProperty({ example: "client" })
  @IsIn(["client", "driver"])
  user_type: string;

  @ApiProperty({ example: "signup" })
  @IsString()
  purpose: string;
}
