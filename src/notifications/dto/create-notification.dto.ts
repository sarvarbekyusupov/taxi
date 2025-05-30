import { ApiProperty } from "@nestjs/swagger";
import {
  NotificationChannel,
  NotificationRecipientType,
  NotificationStatus,
  NotificationType,
} from "../enums/notification.enum";

export class CreateNotificationDto {
  @ApiProperty()
  recipient_id: number;

  @ApiProperty({ enum: NotificationRecipientType })
  recipient_type: NotificationRecipientType;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ enum: NotificationChannel })
  channel: NotificationChannel;

  @ApiProperty({ required: false })
  title?: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false, type: Object })
  data?: Record<string, any>;

  @ApiProperty({ enum: NotificationStatus, required: false })
  status?: NotificationStatus;

  @ApiProperty({ required: false, type: String })
  scheduled_at?: Date;
}
