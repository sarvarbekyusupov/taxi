import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SetPasswordDto {
  @ApiProperty({
    example: "uuid",
    description: "Activation link for setting password",
  })
  @IsNotEmpty({ message: "Activation link is required" })
  @IsString({ message: "Activation link must be a string" })
  activation_link: string;

  @ApiProperty({ example: "StrongPass123!", description: "New password" })
  @IsNotEmpty({ message: "Password is required" })
  @IsString({ message: "Password must be a string" })
  password: string;

  @ApiProperty({
    example: "StrongPass123!",
    description: "Confirm new password",
  })
  @IsNotEmpty({ message: "Confirm password is required" })
  @IsString({ message: "Confirm password must be a string" })
  confirm_password: string;
}
