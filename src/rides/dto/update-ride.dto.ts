import { ApiPropertyOptional } from "@nestjs/swagger";
import { PaymentMethod } from "../enums/ride.enums";

export class UpdateRideDto {
  @ApiPropertyOptional()
  client_id?: number;

  @ApiPropertyOptional()
  driver_id?: number;

  @ApiPropertyOptional()
  pickup_latitude?: number;

  @ApiPropertyOptional()
  pickup_longitude?: number;

  @ApiPropertyOptional()
  pickup_address?: string;

  @ApiPropertyOptional()
  destination_latitude?: number;

  @ApiPropertyOptional()
  destination_longitude?: number;

  @ApiPropertyOptional()
  destination_address?: string;

  @ApiPropertyOptional()
  estimated_distance?: number;

  @ApiPropertyOptional()
  estimated_duration_minutes?: number;

  @ApiPropertyOptional()
  estimated_fare?: number;

  @ApiPropertyOptional({ enum: PaymentMethod })
  payment_method?: PaymentMethod;

  @ApiPropertyOptional()
  promo_code_id?: number;

  @ApiPropertyOptional()
  discount_amount?: number;
}
