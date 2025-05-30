import { IsString, IsBoolean, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateServiceAreaDto {
  @ApiProperty({ example: "Chilonzor" })
  @IsString()
  name: string;

  @ApiProperty({ example: "Tashkent" })
  @IsString()
  city: string;

  @ApiProperty({ example: "Uzbekistan" })
  @IsString()
  country: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
