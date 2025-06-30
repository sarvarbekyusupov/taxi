import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";

@Injectable()
export class NotificationScheduler {
  constructor(@InjectQueue("notifications") private notificationQueue: Queue) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    await this.notificationQueue.add("send-scheduled");
  }
}
