import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsInt,
  IsPhoneNumber,
  IsNotEmpty,
  IsDateString,
  IsIn,
  IsEnum,
} from "class-validator";

export class CreateClientDto {
  @ApiProperty({ example: "+1234567890" })
  @IsPhoneNumber("UZ")
  @IsOptional()
  phone_number: string;

  @ApiProperty({ example: "John Doe" })
  @IsString()
  name: string;

  @ApiProperty({ example: "https://example.com/photo.jpg", required: false })
  @IsOptional()
  @IsString()
  profile_photo_url?: string;

  @ApiProperty({
    example: "1995-08-15",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  birthday?: string;

  @ApiProperty({
    example: "male",
    required: false,
    enum: ["male", "female"],
  })
  @IsOptional()
  @IsIn(["male", "female"])
  gender?: "male" | "female";
}

export class CompleteProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  profile_photo_url?: string;

  @IsOptional()
  @IsDateString()
  birthday?: string;

  @IsOptional()
  @IsEnum(["male", "female"])
  gender?: "male" | "female";
}