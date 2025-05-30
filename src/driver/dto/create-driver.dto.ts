import { ApiProperty } from "@nestjs/swagger";

export class CreateDriverDto {
  @ApiProperty({ example: "+1234567890" })
  phone_number: string;

  @ApiProperty({ example: "John" })
  first_name: string;

  @ApiProperty({ example: "Doe" })
  last_name: string;

  @ApiProperty({ example: "DL1234567890" })
  driver_license_number: string;
}
