import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from "class-validator";

export class CreateTariffDto {
  @ApiProperty({ example: 1, description: "ID of the service area" })
  @IsNotEmpty({ message: "Service area ID is required" })
  @IsNumber({}, { message: "Service area ID must be a number" })
  service_area_id: number;

  @ApiProperty({
    example: "Economy",
    description: "Type of car (e.g., Economy, Premium)",
  })
  @IsNotEmpty({ message: "Car type is required" })
  @IsString({ message: "Car type must be a string" })
  car_type: string;

  @ApiProperty({ example: 10000, description: "Base fare in UZS" })
  @IsNotEmpty({ message: "Base fare is required" })
  @IsPositive({ message: "Base fare must be a positive number" })
  base_fare: number;

  @ApiProperty({ example: 1500, description: "Rate per kilometer in UZS" })
  @IsNotEmpty({ message: "Per km rate is required" })
  @IsPositive({ message: "Per km rate must be a positive number" })
  per_km_rate: number;

  @ApiProperty({ example: 300, description: "Rate per minute in UZS" })
  @IsNotEmpty({ message: "Per minute rate is required" })
  @IsPositive({ message: "Per minute rate must be a positive number" })
  per_minute_rate: number;

  @ApiProperty({ example: 5000, description: "Minimum fare in UZS" })
  @IsNotEmpty({ message: "Minimum fare is required" })
  @IsPositive({ message: "Minimum fare must be a positive number" })
  minimum_fare: number;

  @ApiProperty({
    example: 2000,
    description: "Fee for ride cancellation in UZS",
  })
  @IsNotEmpty({ message: "Cancellation fee is required" })
  @IsPositive({ message: "Cancellation fee must be a positive number" })
  cancellation_fee: number;

  @ApiProperty({ example: true, description: "Whether the tariff is active" })
  @IsNotEmpty({ message: "Active status is required" })
  @IsBoolean({ message: "Active status must be a boolean" })
  is_active: boolean;
}
