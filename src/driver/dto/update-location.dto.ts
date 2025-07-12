import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, Min, Max } from "class-validator";

export class UpdateLocationDto {
  @ApiProperty({
    example: 1,
    description:
      "ID of the driver (optional, will be extracted from JWT if not provided)",
    required: false,
  })
  @IsNumber()
  @IsOptional()
  driverId?: number;

  @ApiProperty({
    example: 1,
    description: "ID of the ride (optional)",
    required: false,
  })
  @IsNumber()
  @IsOptional()
  rideId?: number;

  @ApiProperty({
    example: 40.7128,
    description: "Driver's current latitude",
    minimum: -90,
    maximum: 90,
  })
  @IsNumber({}, { message: "Latitude must be a valid number" })
  @IsNotEmpty({ message: "Latitude is required" })
  @Min(-90, { message: "Latitude must be between -90 and 90" })
  @Max(90, { message: "Latitude must be between -90 and 90" })
  lat: number;

  @ApiProperty({
    example: -74.006,
    description: "Driver's current longitude",
    minimum: -180,
    maximum: 180,
  })
  @IsNumber({}, { message: "Longitude must be a valid number" })
  @IsNotEmpty({ message: "Longitude is required" })
  @Min(-180, { message: "Longitude must be between -180 and 180" })
  @Max(180, { message: "Longitude must be between -180 and 180" })
  lng: number;
}
