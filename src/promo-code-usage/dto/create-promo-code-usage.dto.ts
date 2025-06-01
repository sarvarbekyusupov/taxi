
import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsPositive } from "class-validator";

export class CreatePromoCodeUsageDto {
  @ApiProperty({ example: 1, description: "ID of the promo code applied" })
  @IsNumber()
  @IsPositive()
  promo_code_id: number;

  @ApiProperty({
    example: 10,
    description: "ID of the client who used the promo code",
  })
  @IsNumber()
  @IsPositive()
  client_id: number;

  @ApiProperty({
    example: 99,
    description: "ID of the ride where the promo was applied",
  })
  @IsNumber()
  @IsPositive()
  ride_id: number;

  @ApiProperty({
    example: 5.5,
    description: "Discount amount applied via the promo code",
  })
  @IsNumber()
  discount_amount: number;
}
