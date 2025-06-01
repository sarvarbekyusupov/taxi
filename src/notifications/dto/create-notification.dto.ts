import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsDateString,
} from "class-validator";
import {
  NotificationChannel,
  NotificationRecipientType,
  NotificationStatus,
  NotificationType,
} from "../enums/notification.enum";

export class CreateNotificationDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  recipient_id: number;

  @ApiProperty({ enum: NotificationRecipientType })
  @IsEnum(NotificationRecipientType)
  recipient_type: NotificationRecipientType;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiProperty({ enum: NotificationStatus, required: false })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiProperty({ required: false, type: String })
  @IsOptional()
  @IsDateString()
  scheduled_at?: Date;
}
