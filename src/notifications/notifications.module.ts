import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { AuthModule } from '../auth/auth.module';
import { BullModule } from '@nestjs/bull';
import { Client } from '../client/entities/client.entity';
import { Driver } from '../driver/entities/driver.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Client, Driver]),
    AuthModule,
    BullModule.registerQueue({
      name: "notifications",
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
