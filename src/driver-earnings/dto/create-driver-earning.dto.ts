import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsDateString, IsString, IsNumber } from "class-validator";

export class CreateDriverEarningDto {
  @ApiProperty({ example: 10 })
  @IsNumber()
  driver_id: number;

  @ApiProperty({ example: 101 })
  @IsNumber()
  ride_id: number;

  @ApiProperty({ example: "120.50" })
  @IsString()
  gross_amount: string;

  @ApiProperty({ example: "0.15" })
  @IsString()
  commission_rate: string;

  @ApiProperty({ example: "18.08" })
  @IsString()
  commission_amount: string;

  @ApiProperty({ example: "102.42" })
  @IsString()
  net_amount: string;

  @ApiProperty({ example: "2025-05-29T12:00:00Z", required: false })
  @IsOptional()
  @IsDateString()
  processed_at?: Date;
}
