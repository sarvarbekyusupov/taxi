import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsInt,
  IsPhoneNumber,
  IsNotEmpty,
} from "class-validator";

export class CreateClientDto {
  @ApiProperty({ example: "+1234567890" })
  @IsPhoneNumber("UZ")
  @IsNotEmpty()
  phone_number: string;

  @ApiProperty({ example: "John Doe" })
  @IsString()
  name: string;

  @ApiProperty({ example: "https://example.com/photo.jpg", required: false })
  @IsOptional()
  @IsString()
  profile_photo_url?: string;

}
