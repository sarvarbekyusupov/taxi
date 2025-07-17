import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsLatitude,
  IsLongitude,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class CreateServiceAreaDto {
  @ApiProperty({ example: "Tashkent Center" })
  @IsString()
  name: string;

  @ApiProperty({ example: "Tashkent" })
  @IsString()
  city: string;

  @ApiProperty({
    example: 41.2995,
    description: "Latitude of the service area's center",
  })
  @Type(() => Number)
  @IsNumber()
  @IsLatitude()
  center_lat: number;

  @ApiProperty({
    example: 69.2401,
    description: "Longitude of the service area's center",
  })
  @Type(() => Number)
  @IsNumber()
  @IsLongitude()
  center_lng: number;

  @ApiProperty({
    example: 50.0,
    description: "Radius of the service area in kilometers",
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.1) // Ensures the radius is a positive value
  radius_km: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
