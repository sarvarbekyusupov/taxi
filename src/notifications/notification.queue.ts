// notifications/notification.queue.ts
import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { NotificationsService } from "./notifications.service";

@Processor("notifications")
export class NotificationProcessor {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Process("send-scheduled")
  async handleScheduledNotifications(job: Job) {
    await this.notificationsService.sendScheduledNotifications();
  }
}
