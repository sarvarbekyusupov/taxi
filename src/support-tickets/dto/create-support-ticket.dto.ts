import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsNumber } from "class-validator";

export class CreateSupportTicketDto {
  @ApiProperty({ example: "TCKT-00123" })
  @IsNotEmpty()
  @IsString()
  ticket_number: string;

  @ApiProperty({ example: 123 })
  @IsNotEmpty()
  @IsNumber()
  user_id: number;

  @ApiProperty({ example: "PASSENGER" })
  @IsNotEmpty()
  @IsString()
  user_type: string;

  @ApiProperty({ example: 456, required: false })
  @IsOptional()
  @IsNumber()
  ride_id?: number;

  @ApiProperty({ example: "Technical" })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ example: "Open" })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiProperty({ example: "App crashed" })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({ example: "The app crashes when I try to book a ride." })
  @IsNotEmpty()
  @IsString()
  description: string;
}
