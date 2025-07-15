// update-documents.dto.ts

import { IsOptional, IsString, IsUrl } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateDocumentsDto {
  @ApiProperty({
    example: "https://cdn.example.com/passport.jpg",
    description: "Haydovchi pasportining rasmi uchun URL",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  passport_url?: string;

  @ApiProperty({
    example: "https://cdn.example.com/tech_passport.jpg",
    description: "Avtomobil tex-pasportining rasmi uchun URL",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  vehicle_technical_passport_url?: string;

  @ApiProperty({
    example: "https://cdn.example.com/passenger_license.jpg",
    description: "Odam tashish litsenziyasining rasmi uchun URL",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  passenger_license_url?: string;

  @ApiProperty({
    example: "https://cdn.example.com/self_employed.jpg",
    description: "O'z-o'zini band qilish haqidagi hujjat rasmi uchun URL",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  self_employment_certificate_url?: string;

  // Mavjud haydovchilik guvohnomasi maydonlari
  @ApiProperty({
    example: "DL1234567890",
    description: "Haydovchilik guvohnomasi raqami",
    required: false,
  })
  @IsOptional()
  @IsString()
  driver_license_number?: string;

  @ApiProperty({
    example: "https://cdn.example.com/license.jpg",
    description: "Haydovchilik guvohnomasi rasmi uchun URL",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  driver_license_url?: string;
}
