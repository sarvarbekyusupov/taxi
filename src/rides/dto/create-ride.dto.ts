import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNumber,
  IsOptional,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsPositive,
  IsString,
} from "class-validator";
import { PaymentMethod, TariffType } from "../entities/ride.entity";

export class CreateRideDto {
  @ApiProperty({
    example: 1,
    description: "ID of the client requesting the ride",
  })
  @IsNumber()
  @IsPositive()
  client_id: number;

  @ApiPropertyOptional({
    example: 2,
    description:
      "ID of the driver accepting the ride (optional, only by admin/operator)",
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  driver_id?: number;

  @ApiProperty({
    example: 37.7749,
    description: "Latitude of the pickup location",
  })
  @IsLatitude()
  pickup_latitude: number;

  @ApiProperty({
    example: -122.4194,
    description: "Longitude of the pickup location",
  })
  @IsLongitude()
  pickup_longitude: number;

  @ApiProperty({
    example: "123 Market St, San Francisco, CA",
    description: "Pickup address",
  })
  @IsString()
  @IsNotEmpty()
  pickup_address: string;

  @ApiProperty({ example: 37.8715, description: "Latitude of the destination" })
  @IsLatitude()
  destination_latitude: number;

  @ApiProperty({
    example: -122.273,
    description: "Longitude of the destination",
  })
  @IsLongitude()
  destination_longitude: number;

  @ApiProperty({
    example: "456 University Ave, Berkeley, CA",
    description: "Destination address",
  })
  @IsString()
  @IsNotEmpty()
  destination_address: string;

  @ApiPropertyOptional({
    example: 15.6,
    description: "Estimated distance in kilometers",
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  estimated_distance?: number;

  @ApiPropertyOptional({
    example: 25,
    description: "Estimated duration in minutes",
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  estimated_duration_minutes?: number;

  @ApiPropertyOptional({
    example: 18.75,
    description: "Estimated fare for the ride in USD",
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  estimated_fare?: number;

  @ApiProperty({
    example: "CASH",
    enum: PaymentMethod,
    description: "Payment method selected",
  })
  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @ApiProperty({
    example: "ECONOMY",
    enum: TariffType,
    description: "Tariff type selected by client",
  })
  @IsEnum(TariffType)
  tariff_type: TariffType;

  @ApiPropertyOptional({ example: 101, description: "Promo code ID if any" })
  @IsOptional()
  @IsNumber()
  promo_code_id?: number;

  @ApiPropertyOptional({ example: 2.5, description: "Discount amount if any" })
  @IsOptional()
  @IsNumber()
  discount_amount?: number;

  @ApiProperty({ example: 1, description: "Service Area ID" })
  @IsNumber()
  @IsPositive()
  service_area_id: number;
}
