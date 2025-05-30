import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";
import {
  NotificationRecipientType,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
} from "../enums/notification.enum";

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column()
  recipient_id: number;

  @Column({
    type: "enum",
    enum: NotificationRecipientType,
  })
  recipient_type: NotificationRecipientType;

  @Column({
    type: "enum",
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: "enum",
    enum: NotificationChannel,
  })
  channel: NotificationChannel;

  @Column({ nullable: true })
  title?: string;

  @Column("text")
  message: string;

  @Column({ type: "jsonb", nullable: true })
  data?: Record<string, any>;

  @Column({
    type: "enum",
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({ type: "timestamp", nullable: true })
  scheduled_at?: Date;

  @Column({ type: "timestamp", nullable: true })
  sent_at?: Date;

  @Column({ type: "boolean", default: false })
  is_read: boolean;

  @CreateDateColumn()
  created_at: Date;
}
