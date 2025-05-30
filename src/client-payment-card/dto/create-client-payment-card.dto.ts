
import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
} from "class-validator";

export class CreateClientPaymentCardDto {
  @ApiProperty({ example: 1001 })
  @IsInt()
  client_id: number;

  @ApiProperty({ example: "tok_1Hh12345ABCDE" })
  @IsString()
  card_token: string;

  @ApiProperty({ example: "4242" })
  @IsString()
  @Length(4, 4)
  last_four_digits: string;

  @ApiProperty({ example: "Visa", required: false })
  @IsOptional()
  @IsString()
  card_brand?: string;

  @ApiProperty({ example: "John Doe", required: false })
  @IsOptional()
  @IsString()
  cardholder_name?: string;

  @ApiProperty({ example: 12, required: false })
  @IsOptional()
  @IsInt()
  expiry_month?: number;

  @ApiProperty({ example: 2027, required: false })
  @IsOptional()
  @IsInt()
  expiry_year?: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_default: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_active: boolean;
}
