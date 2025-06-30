import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateTariffDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  service_area_id: number;

  @ApiProperty({ example: "Economy" })
  @IsNotEmpty()
  @IsString()
  car_type: string;

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

