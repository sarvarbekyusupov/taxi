import { ApiProperty } from "@nestjs/swagger";

export class CreateDriverPaymentCardDto {
  @ApiProperty({ description: "ID of the driver this card belongs to" })
  driver_id: number;

  @ApiProperty({
    description: "Token used to identify the card with the payment provider",
  })
  card_token: string;

  @ApiProperty({ description: "Last four digits of the card" })
  last_four_digits: string;

  @ApiProperty({
    description: "Brand of the card (e.g. Visa, Mastercard)",
    required: false,
  })
  card_brand?: string;

  @ApiProperty({ description: "Name of the cardholder", required: false })
  cardholder_name?: string;

  @ApiProperty({
    description: "Marks this card as default for the driver",
    required: false,
  })
  is_default?: boolean;

  @ApiProperty({
    description: "Specifies if the card is active",
    required: false,
  })
  is_active?: boolean;
}
