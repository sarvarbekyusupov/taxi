import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { UpdateNotificationDto } from "./dto/update-notification.dto";
import { Roles } from "../common/decorators/role.decorator";
import { RoleGuard } from "../auth/role.guard";
import { UserCategoryGuard } from "../auth/user.guard";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("Notifications")
@ApiBearerAuth()
@Controller("notifications")
@Roles("admin")
@UseGuards(RoleGuard, UserCategoryGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new notification" })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all notifications" })
  findAll() {
    return this.notificationsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a notification by ID" })
  findOne(@Param("id") id: string) {
    return this.notificationsService.findOne(+id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a notification by ID" })
  update(
    @Param("id") id: string,
    @Body() updateNotificationDto: UpdateNotificationDto
  ) {
    return this.notificationsService.update(+id, updateNotificationDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a notification by ID" })
  remove(@Param("id") id: string) {
    return this.notificationsService.remove(+id);
  }
}
