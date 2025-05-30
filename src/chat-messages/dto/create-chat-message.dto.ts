import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsDateString,
} from "class-validator";

export class CreateChatMessageDto {
  @ApiProperty({ example: 101, description: "ID of the ride" })
  @IsNumber()
  ride_id: number;

  @ApiProperty({
    example: "client",
    description: "Type of sender (client or driver)",
  })
  @IsString()
  sender_type: string;

  @ApiProperty({ example: 55, description: "Sender ID" })
  @IsNumber()
  sender_id: number;

  @ApiProperty({
    example: "Is the driver nearby?",
    description: "Message content",
  })
  @IsString()
  message: string;

  @ApiProperty({
    example: "text",
    description: "Type of message",
    required: false,
  })
  @IsOptional()
  @IsString()
  message_type?: string;

  @ApiProperty({
    example: false,
    description: "Whether the message is read",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_read?: boolean;

  @ApiProperty({
    example: "2025-05-29T13:45:00Z",
    description: "Timestamp when sent",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  sent_at?: Date;
}
