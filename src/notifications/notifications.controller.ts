import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { UpdateNotificationDto } from "./dto/update-notification.dto";
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
} from "@nestjs/swagger";
import { RoleGuard } from "../auth/role.guard";
import { UserCategoryGuard } from "../auth/user.guard";
import { Roles } from "../common/decorators/role.decorator";

@ApiTags("Notifications")
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: "Create and send a notification" })
  @ApiBody({
    type: CreateNotificationDto,
    examples: {
      push: {
        summary: "Push notification to a client",
        value: {
          recipient_id: 12,
          recipient_type: "user",
          type: "system",
          channel: "push",
          title: "New Ride Alert",
          message: "Your ride is on the way",
          data: { rideId: 45 },
        },
      },
      email: {
        summary: "Email notification to a driver",
        value: {
          recipient_id: 9,
          recipient_type: "driver",
          type: "promotion",
          channel: "email",
          title: "Special Bonus",
          message: "You've earned a new bonus this week!",
        },
      },
    },
  })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Get all notifications" })
  findAll() {
    return this.notificationsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a specific notification by ID" })
  @ApiParam({ name: "id", type: Number })
  findOne(@Param("id") id: number) {
    return this.notificationsService.findOne(+id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a notification" })
  @ApiParam({ name: "id", type: Number })
  update(@Param("id") id: number, @Body() dto: UpdateNotificationDto) {
    return this.notificationsService.update(+id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a notification" })
  @ApiParam({ name: "id", type: Number })
  remove(@Param("id") id: number) {
    return this.notificationsService.remove(+id);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark notification as read" })
  @ApiParam({ name: "id", type: Number })
  markAsRead(@Param("id") id: number) {
    return this.notificationsService.markAsRead(+id);
  }

  @Get("unread/count")
  @ApiOperation({ summary: "Count unread notifications for a user" })
  @ApiQuery({ name: "recipient_id", type: Number })
  countUnread(@Query("recipient_id") recipient_id: number) {
    return this.notificationsService.countUnread(+recipient_id);
  }

  @Post("mass/clients")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Send notification to all clients (Admin only)" })
  @ApiBody({
    type: CreateNotificationDto,
    examples: {
      promotion: {
        summary: "Mass push to all clients",
        value: {
          type: "promotion",
          channel: "push",
          title: "20% Off!",
          message: "Limited-time discount for loyal users",
        },
      },
    },
  })
  sendToAllClients(
    @Body()
    dto: Omit<CreateNotificationDto, "recipient_id" | "recipient_type">
  ) {
    return this.notificationsService.sendToMultipleRecipients(dto, "client");
  }

  @Post("mass/drivers")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Send notification to all drivers (Admin only)" })
  @ApiBody({
    type: CreateNotificationDto,
    examples: {
      alert: {
        summary: "Alert to all drivers",
        value: {
          type: "alert",
          channel: "sms",
          title: "Platform Maintenance",
          message: "We’ll be down for maintenance at 2 AM",
        },
      },
    },
  })
  sendToAllDrivers(
    @Body()
    dto: Omit<CreateNotificationDto, "recipient_id" | "recipient_type">
  ) {
    return this.notificationsService.sendToMultipleRecipients(dto, "driver");
  }
}
