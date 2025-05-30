import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Min, Max } from "class-validator";

export class CreateRatingDto {
  @ApiProperty()
  @IsInt()
  ride_id: number;

  @ApiProperty()
  @IsInt()
  client_id: number;

  @ApiProperty()
  @IsInt()
  driver_id: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  client_rating?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  driver_rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  client_comment?: string;
}
