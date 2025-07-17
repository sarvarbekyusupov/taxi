import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateTariffDto {
  @ApiProperty({
    example: "Economy",
    description: "The unique name for the tariff.",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @ApiProperty({
    example: 1,
    description: "The ID of the service area this tariff applies to.",
  })
  @IsNumber()
  service_area_id: number;

  @ApiProperty({
    example: 2,
    description: "The ID of the car type this tariff is for.",
  })
  @IsNumber()
  @IsNotEmpty()
  car_type_id: number;

  @ApiProperty({ example: 10000 })
  @IsPositive()
  @Type(() => Number)
  base_fare: number;

  @ApiProperty({ example: 1500 })
  @IsPositive()
  @Type(() => Number)
  per_km_rate: number;

  @ApiProperty({ example: 300 })
  @IsPositive()
  @Type(() => Number)
  per_minute_rate: number;

  @ApiProperty({ example: 5000 })
  @IsPositive()
  @Type(() => Number)
  minimum_fare: number;

  @ApiProperty({ example: 2000 })
  @IsPositive()
  @Type(() => Number)
  cancellation_fee: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  @Type(() => Boolean)
  is_active: boolean;
}

