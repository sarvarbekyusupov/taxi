import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from "class-validator";

export class CreateTariffDto {
  @ApiProperty({
    example: 1,
    description: "ID of the service area this tariff applies to",
  })
  @IsNotEmpty({ message: "Service area ID is required" })
  @IsNumber({}, { message: "Service area ID must be a number" })
  service_area_id: number;

  @ApiProperty({
    example: "Economy",
    description: "Type of car for this tariff (e.g., Economy, Premium, SUV)",
  })
  @IsNotEmpty({ message: "Car type is required" })
  @IsString({ message: "Car type must be a string" })
  car_type: string;

  @ApiProperty({ example: 10000, description: "Base fare amount in UZS" })
  @IsNotEmpty({ message: "Base fare is required" })
  @IsPositive({ message: "Base fare must be a positive number" })
  base_fare: number;

  @ApiProperty({ example: 1500, description: "Fare per kilometer in UZS" })
  @IsNotEmpty({ message: "Per km rate is required" })
  @IsPositive({ message: "Per km rate must be a positive number" })
  per_km_rate: number;

  @ApiProperty({ example: 300, description: "Fare per minute in UZS" })
  @IsNotEmpty({ message: "Per minute rate is required" })
  @IsPositive({ message: "Per minute rate must be a positive number" })
  per_minute_rate: number;

  @ApiProperty({
    example: 5000,
    description: "Minimum fare in UZS regardless of distance/time",
  })
  @IsNotEmpty({ message: "Minimum fare is required" })
  @IsPositive({ message: "Minimum fare must be a positive number" })
  minimum_fare: number;

  @ApiProperty({
    example: 2000,
    description: "Fee charged when a ride is cancelled in UZS",
  })
  @IsNotEmpty({ message: "Cancellation fee is required" })
  @IsPositive({ message: "Cancellation fee must be a positive number" })
  cancellation_fee: number;

  @ApiProperty({
    example: true,
    description: "Whether this tariff is currently active",
  })
  @IsNotEmpty({ message: "Active status is required" })
  @IsBoolean({ message: "Active status must be a boolean" })
  is_active: boolean;
}
