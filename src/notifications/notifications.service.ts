import { Injectable, NotFoundException, Logger, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThanOrEqual, Repository } from "typeorm";
import { Notification } from "./entities/notification.entity";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { UpdateNotificationDto } from "./dto/update-notification.dto";
import {
  NotificationStatus,
  NotificationChannel,
  NotificationRecipientType,
} from "./enums/notification.enum";
import { Server } from "socket.io";
import { SOCKET_IO_SERVER } from "../socket/socket.constants";
import { Client } from "../client/entities/client.entity";
import { Driver } from "../driver/entities/driver.entity";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,

    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,

    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,

    @Inject(SOCKET_IO_SERVER)
    private readonly socketServer: Server
  ) {}

  /**
   * Create and send notification immediately (if scheduled_at is not set)
   */
  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(dto);
    const saved = await this.notificationRepository.save(notification);

    // Don't send now if scheduled_at is set
    if (!dto.scheduled_at) {
      await this.dispatchNotification(saved);
    }

    return saved;
  }

  /**
   * Dispatch notification via the appropriate channel
   */
  private async dispatchNotification(notification: Notification) {
    try {
      switch (notification.channel) {
        case NotificationChannel.PUSH:
          await this.sendPush(notification);
          break;
        case NotificationChannel.EMAIL:
          await this.sendEmail(notification);
          break;
        case NotificationChannel.SMS:
          await this.sendSms(notification);
          break;
        default:
          this.logger.warn(`Unknown channel: ${notification.channel}`);
      }

      notification.status = NotificationStatus.SENT;
      notification.sent_at = new Date();
    } catch (err) {
      this.logger.error("Notification dispatch failed", err);
      notification.status = NotificationStatus.FAILED;
    }

    await this.notificationRepository.save(notification);
  }

  /**
   * Find all notifications
   */
  async findAll(): Promise<Notification[]> {
    return this.notificationRepository.find({
      order: { created_at: "DESC" },
    });
  }

  /**
   * Find single notification
   */
  async findOne(id: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOneBy({ id });
    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    return notification;
  }

  /**
   * Update notification
   */
  async update(id: number, dto: UpdateNotificationDto): Promise<Notification> {
    const notification = await this.notificationRepository.preload({
      id,
      ...dto,
    });
    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    return this.notificationRepository.save(notification);
  }

  /**
   * Delete notification
   */
  async remove(id: number): Promise<void> {
    const result = await this.notificationRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: number): Promise<Notification> {
    const notification = await this.findOne(id);
    notification.is_read = true;
    notification.status = NotificationStatus.READ;
    return this.notificationRepository.save(notification);
  }

  /**
   * Count unread notifications
   */
  async countUnread(recipient_id: number): Promise<number> {
    return this.notificationRepository.count({
      where: {
        recipient_id,
        is_read: false,
      },
    });
  }

  /**
   * Send all scheduled notifications
   */
  async sendScheduledNotifications() {
    const now = new Date();
    const pending = await this.notificationRepository.find({
      where: {
        scheduled_at: LessThanOrEqual(now),
        status: NotificationStatus.PENDING,
      },
    });

    for (const notif of pending) {
      await this.dispatchNotification(notif);
    }
  }

  /**
   * Send notification to all clients or drivers
   */
  async sendToMultipleRecipients(
    dto: Omit<CreateNotificationDto, "recipient_id" | "recipient_type">,
    type: "client" | "driver"
  ): Promise<number> {
    const ids = await this.getAllUserIdsByType(type);

    for (const id of ids) {
      const notif: CreateNotificationDto = {
        ...dto,
        recipient_id: id,
        recipient_type:
          type === "client"
            ? NotificationRecipientType.USER
            : NotificationRecipientType.DRIVER,
      };
      await this.create(notif);
    }

    return ids.length;
  }

  /**
   * Get all client or driver user IDs
   */
  private async getAllUserIdsByType(
    type: "client" | "driver"
  ): Promise<number[]> {
    if (type === "client") {
      const clients = await this.clientRepository.find({ select: ["id"] });
      return clients.map((c) => c.id);
    } else {
      const drivers = await this.driverRepository.find({ select: ["id"] });
      return drivers.map((d) => d.id);
    }
  }

  /**
   * Send real-time push notification via socket.io
   */
  private async sendPush(notification: Notification) {
    const room = `user-${notification.recipient_type}-${notification.recipient_id}`;
    this.socketServer.to(room).emit("notification", notification);
    this.logger.log(`Push sent to ${room}`);
  }

  /**
   * Placeholder for email integration
   */
  private async sendEmail(notification: Notification) {
    // Replace with actual email service (e.g., SendGrid, SMTP)
    this.logger.log(
      `Mock EMAIL to ${notification.recipient_id}: ${notification.message}`
    );
  }

  /**
   * Placeholder for SMS integration
   */
  private async sendSms(notification: Notification) {
    // Replace with actual SMS provider (e.g., Twilio)
    this.logger.log(
      `Mock SMS to ${notification.recipient_id}: ${notification.message}`
    );
  }
}
