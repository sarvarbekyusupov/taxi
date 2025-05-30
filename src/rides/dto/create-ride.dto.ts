import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RideStatus, PaymentMethod } from "../enums/ride.enums";

export class CreateRideDto {
  @ApiProperty({
    example: 1,
    description: "ID of the client requesting the ride",
  })
  client_id: number;

  @ApiProperty({
    example: 37.7749,
    description: "Latitude of the pickup location",
  })
  pickup_latitude: number;

  @ApiProperty({
    example: -122.4194,
    description: "Longitude of the pickup location",
  })
  pickup_longitude: number;

  @ApiProperty({
    example: "123 Market St, San Francisco, CA",
    description: "Pickup address",
  })
  pickup_address: string;

  @ApiProperty({ example: 37.8715, description: "Latitude of the destination" })
  destination_latitude: number;

  @ApiProperty({
    example: -122.273,
    description: "Longitude of the destination",
  })
  destination_longitude: number;

  @ApiProperty({
    example: "456 University Ave, Berkeley, CA",
    description: "Destination address",
  })
  destination_address: string;

  @ApiPropertyOptional({
    example: 15.6,
    description: "Estimated distance in kilometers",
  })
  estimated_distance?: number;

  @ApiPropertyOptional({
    example: 25,
    description: "Estimated duration in minutes",
  })
  estimated_duration_minutes?: number;

  @ApiPropertyOptional({
    example: 18.75,
    description: "Estimated fare for the ride in USD",
  })
  estimated_fare?: number;

  @ApiProperty({
    example: "CASH",
    enum: PaymentMethod,
    description: "Payment method selected",
  })
  payment_method: PaymentMethod;

  @ApiPropertyOptional({ example: 101, description: "Promo code ID if any" })
  promo_code_id?: number;

  @ApiPropertyOptional({ example: 2.5, description: "Discount amount if any" })
  discount_amount?: number;
}
