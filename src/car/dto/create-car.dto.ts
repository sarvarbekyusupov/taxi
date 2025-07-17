import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsNumber, IsBoolean } from "class-validator";

export class CreateCarDto {
  @ApiProperty({ example: 101, description: "Driver ID" })
  @IsNumber()
  driver_id: number;

  @ApiProperty({ example: "Toyota", description: "Brand of the car" })
  @IsString()
  brand: string;

  @ApiProperty({ example: "Corolla", description: "Model of the car" })
  @IsString()
  model: string;

  @ApiProperty({ example: 2022, description: "Year of manufacture" })
  @IsNumber()
  year: number;

  @ApiProperty({ example: "ABC1234", description: "License plate number" })
  @IsString()
  license_plate: string;

  @ApiProperty({
    example: "Red",
    description: "Color of the car",
    required: false,
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ example: 2, description: "The ID of the car's type" })
  @IsNumber()
  car_type_id: number;

  @ApiProperty({
    example: "https://example.com/doc1.pdf",
    description: "Registration document URL",
    required: false,
  })
  @IsOptional()
  @IsString()
  registration_document_url?: string;

  @ApiProperty({
    example: "https://example.com/doc2.pdf",
    description: "Insurance document URL",
    required: false,
  })
  @IsOptional()
  @IsString()
  insurance_document_url?: string;

  @ApiProperty({
    example: true,
    description: "Car active status",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
