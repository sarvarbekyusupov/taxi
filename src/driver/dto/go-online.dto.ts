import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";

export class GoOnlineDto {
  @ApiProperty({ example: 1, description: "ID of the driver" })
  @IsNumber()
  @IsNotEmpty()
  driverId: number;

  @ApiProperty({ example: 40.7128, description: "Driver's current latitude" })
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @ApiProperty({ example: -74.0060, description: "Driver's current longitude" })
  @IsNumber()
  @IsNotEmpty()
  lng: number;
}