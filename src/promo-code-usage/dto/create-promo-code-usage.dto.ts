
import { ApiProperty } from "@nestjs/swagger";

export class CreatePromoCodeUsageDto {
  @ApiProperty({ example: 1, description: "ID of the promo code applied" })
  promo_code_id: number;

  @ApiProperty({
    example: 10,
    description: "ID of the client who used the promo code",
  })
  client_id: number;

  @ApiProperty({
    example: 99,
    description: "ID of the ride where the promo was applied",
  })
  ride_id: number;

  @ApiProperty({
    example: 5.5,
    description: "Discount amount applied via the promo code",
  })
  discount_amount: number;
}
