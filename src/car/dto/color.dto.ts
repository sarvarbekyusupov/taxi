import { IsString, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateColorDto {
  @IsString()
  @ApiProperty({ example: "White", description: "Color name" })
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: "#FFFFFF",
    description: "Hex code of the color",
    required: false,
  })
  hex?: string;
}
