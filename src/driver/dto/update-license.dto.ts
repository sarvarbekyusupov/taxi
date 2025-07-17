// Create a new file or update your existing DTO file

import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsObject, IsOptional, IsString, IsUrl, ValidateNested } from "class-validator";

// 1. DTO for the nested "documents" object
class DocumentsPayloadDto {
  @ApiProperty({
    description: "URL for the identity card (passport)",
    required: false,
  })
  @IsOptional()
  @IsUrl()
  identityCard?: string;

  @ApiProperty({ description: "URL for the driving license", required: false })
  @IsOptional()
  @IsUrl()
  drivingLicence?: string;

  @ApiProperty({
    description: "URL for the vehicle technical passport",
    required: false,
  })
  @IsOptional()
  @IsUrl()
  vehicleInformation?: string;

  // You should ask the mobile dev for the keys for these other documents:
  @ApiProperty({
    description: "URL for the passenger license",
    required: false,
  })
  @IsOptional()
  @IsUrl()
  passengerLicence?: string;

  @ApiProperty({
    description: "URL for the self-employment certificate",
    required: false,
  })
  @IsOptional()
  @IsUrl()
  selfEmploymentCertificate?: string;
}

// 2. Main DTO for the entire request body
export class UpdateDriverDocumentsApiDto {
  @ApiProperty({
    description:
      "The driver's ID (Note: This is ignored by the server for security reasons)",
    example: "5",
    required: false, // Make it optional
  })
  @IsOptional()
  @IsString()
  driver_id?: string;

  @ApiProperty({ type: DocumentsPayloadDto })
  @IsObject()
  @ValidateNested() // <-- Validates the inner object
  @Type(() => DocumentsPayloadDto) // <-- Helps NestJS instantiate the inner class
  documents: DocumentsPayloadDto;
}
