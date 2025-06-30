import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  Length,
  IsOptional,
  IsBoolean,
  IsInt,
} from "class-validator";

export class CreateDriverPaymentCardDto {
  @ApiProperty({ description: "ID of the driver this card belongs to" })
  @IsInt()
  driver_id: number;

  @ApiProperty({
    description: "Token used to identify the card with the payment provider",
  })
  @IsString()
  card_token: string;

  @ApiProperty({ description: "Last four digits of the card" })
  @IsString()
  @Length(4, 4)
  last_four_digits: string;

  @ApiProperty({
    description: "Brand of the card (e.g. Visa, Mastercard)",
    required: false,
  })
  @IsOptional()
  @IsString()
  card_brand?: string;

  @ApiProperty({ description: "Name of the cardholder", required: false })
  @IsOptional()
  @IsString()
  cardholder_name?: string;

  @ApiProperty({
    description: "Marks this card as default for the driver",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @ApiProperty({
    description: "Specifies if the card is active",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
