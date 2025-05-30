import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RideStatus, PaymentMethod } from "../enums/ride.enums";

export class RideDto {
  @ApiProperty({ example: 1234, description: "Unique ride ID" })
  id: number;

  @ApiProperty({ example: 1, description: "Client ID who requested the ride" })
  client_id: number;

  @ApiPropertyOptional({
    example: 2,
    description: "Driver ID assigned to the ride (if assigned)",
  })
  driver_id?: number;

  @ApiProperty({ example: 37.7749, description: "Pickup latitude" })
  pickup_latitude: number;

  @ApiProperty({ example: -122.4194, description: "Pickup longitude" })
  pickup_longitude: number;

  @ApiProperty({
    example: "123 Market St, San Francisco, CA",
    description: "Pickup address",
  })
  pickup_address: string;

  @ApiProperty({ example: 37.8715, description: "Destination latitude" })
  destination_latitude: number;

  @ApiProperty({ example: -122.273, description: "Destination longitude" })
  destination_longitude: number;

  @ApiProperty({
    example: "456 University Ave, Berkeley, CA",
    description: "Destination address",
  })
  destination_address: string;

  @ApiPropertyOptional({
    example: 15.6,
    description: "Estimated distance (km)",
  })
  estimated_distance?: number;

  @ApiPropertyOptional({
    example: 25,
    description: "Estimated duration (minutes)",
  })
  estimated_duration_minutes?: number;

  @ApiPropertyOptional({ example: 18.75, description: "Estimated fare (USD)" })
  estimated_fare?: number;

  @ApiPropertyOptional({
    example: 16.3,
    description: "Actual distance traveled (km)",
  })
  actual_distance_km?: number;

  @ApiPropertyOptional({
    example: 30,
    description: "Actual duration (minutes)",
  })
  actual_duration_minutes?: number;

  @ApiPropertyOptional({
    example: 20.5,
    description: "Final fare charged (USD)",
  })
  final_fare?: number;

  @ApiProperty({
    example: "REQUESTED",
    enum: RideStatus,
    description: "Current status of the ride",
  })
  status: RideStatus;

  @ApiProperty({
    example: "CASH",
    enum: PaymentMethod,
    description: "Payment method used",
  })
  payment_method: PaymentMethod;

  @ApiPropertyOptional({ example: 101, description: "Promo code ID if used" })
  promo_code_id?: number;

  @ApiPropertyOptional({ example: 2.5, description: "Discount amount applied" })
  discount_amount?: number;

  @ApiProperty({
    example: "2024-05-28T14:32:00.000Z",
    description: "Time when ride was requested",
  })
  requested_at: Date;

  @ApiPropertyOptional({
    example: "2024-05-28T14:35:00.000Z",
    description: "Time when ride was accepted",
  })
  accepted_at?: Date;

  @ApiPropertyOptional({
    example: "2024-05-28T14:40:00.000Z",
    description: "Time when ride started",
  })
  started_at?: Date;

  @ApiPropertyOptional({
    example: "2024-05-28T15:10:00.000Z",
    description: "Time when ride was completed",
  })
  completed_at?: Date;

  @ApiPropertyOptional({
    example: "2024-05-28T14:50:00.000Z",
    description: "Time when ride was cancelled",
  })
  cancelled_at?: Date;

  @ApiPropertyOptional({
    example: "Client no-show",
    description: "Reason for cancellation if any",
  })
  cancellation_reason?: string;
}
