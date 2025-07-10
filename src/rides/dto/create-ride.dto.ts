import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString, IsOptional, IsEnum } from "class-validator";
import { PaymentMethod } from "../../payments/enums/enum";
import { TariffType } from "../entities/ride.entity";

export class CreateRideDto {
  @ApiProperty({ example: 41.311081, description: "Pickup latitude" })
  @IsNumber()
  @IsNotEmpty()
  pickup_latitude: number;

  @ApiProperty({ example: 69.240562, description: "Pickup longitude" })
  @IsNumber()
  @IsNotEmpty()
  pickup_longitude: number;

  @ApiProperty({ example: "Tashkent City Center", description: "Pickup address" })
  @IsString()
  @IsNotEmpty()
  pickup_address: string;

  @ApiProperty({ example: 41.3275, description: "Destination latitude" })
  @IsNumber()
  @IsNotEmpty()
  destination_latitude: number;

  @ApiProperty({ example: 69.2817, description: "Destination longitude" })
  @IsNumber()
  @IsNotEmpty()
  destination_longitude: number;

  @ApiProperty({ example: "Yunusobod District", description: "Destination address" })
  @IsString()
  @IsNotEmpty()
  destination_address: string;

  @ApiProperty({ example: 12, description: "ID of the requesting client" })
  @IsNumber()
  @IsNotEmpty()
  client_id: number;

  @ApiProperty({ example: 8.6, description: "Estimated distance in kilometers" })
  @IsNumber()
  @IsNotEmpty()
  estimated_distance: number;

  @ApiProperty({ example: 15, description: "Estimated duration in minutes" })
  @IsNumber()
  @IsNotEmpty()
  estimated_duration_minutes: number;

  @ApiProperty({ example: 1, description: "ID of the service area" })
  @IsNumber()
  @IsNotEmpty()
  service_area_id: number;

  @ApiProperty({ example: "cash", enum: PaymentMethod, description: "Payment method for the ride" })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  payment_method: PaymentMethod;

  @ApiProperty({ example: null, description: "ID of the promo code used (optional)" })
  @IsNumber()
  @IsOptional()
  promo_code_id?: number;

  @ApiProperty({ example: 0, description: "Discount amount applied (optional)" })
  @IsNumber()
  @IsOptional()
  discount_amount?: number;

  @ApiProperty({ example: "ECONOMY", enum: TariffType, description: "Type of tariff for the ride" })
  @IsEnum(TariffType)
  @IsNotEmpty()
  tariff_type: TariffType;
}