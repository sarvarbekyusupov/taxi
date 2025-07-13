import { IsOptional, IsString, Length, IsUrl } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateLicenseDto {
  @ApiProperty({ example: "DL1234567890" })
  @IsString()
  @Length(5, 20)
  driver_license_number: string;

  @ApiProperty({
    example: "https://example.com/license.jpg",
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: "driver_license_url must be a valid URL" })
  driver_license_url?: string;
}
