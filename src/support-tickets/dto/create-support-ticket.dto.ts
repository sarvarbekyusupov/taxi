import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
} from "class-validator";
import {
  SupportTicketStatus,
  SupportTicketUserType,
  SupportTicketCategory,
} from "../enum/support-ticket.enums";

export class CreateSupportTicketDto {
  @ApiProperty({ example: 123 })
  @IsNotEmpty()
  @IsNumber()
  user_id: number;

  @ApiProperty({ enum: SupportTicketUserType })
  @IsNotEmpty()
  @IsEnum(SupportTicketUserType)
  user_type: SupportTicketUserType;

  @ApiProperty({ example: 456, required: false })
  @IsOptional()
  @IsNumber()
  ride_id?: number;

  @ApiProperty({ enum: SupportTicketCategory })
  @IsNotEmpty()
  @IsEnum(SupportTicketCategory)
  category: SupportTicketCategory;

  @ApiProperty({ enum: SupportTicketStatus })
  @IsNotEmpty()
  @IsEnum(SupportTicketStatus)
  status: SupportTicketStatus;

  @ApiProperty({ example: "App crashed" })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({ example: "The app crashes when I try to book a ride." })
  @IsNotEmpty()
  @IsString()
  description: string;
}
