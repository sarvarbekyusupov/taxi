import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, MinLength } from "class-validator";

export class CreateCarTypeDto {
  @ApiProperty({
    example: "Business",
    description: "The name of the car type.",
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({
    example: "For comfortable business class trips.",
    description: "A brief description of the car type.",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
