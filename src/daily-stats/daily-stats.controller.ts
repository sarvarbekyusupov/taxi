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
import { DailyStatsService } from "./daily-stats.service";
import { UpdateDailyStatDto } from "./dto/update-daily-stat.dto";
import { CreateDailyStatsDto } from "./dto/create-daily-stat.dto";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Roles } from "../common/decorators/role.decorator";
import { RoleGuard } from "../auth/role.guard";
import { UserCategoryGuard } from "../auth/user.guard";

@ApiTags("Daily Stats")
@ApiBearerAuth()
@UseGuards(RoleGuard, UserCategoryGuard)
@Roles("admin")
@Controller("daily-stats")
export class DailyStatsController {
  constructor(private readonly dailyStatsService: DailyStatsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new daily stat entry" })
  create(@Body() createDailyStatDto: CreateDailyStatsDto) {
    return this.dailyStatsService.create(createDailyStatDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all daily stats" })
  findAll() {
    return this.dailyStatsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a daily stat by ID" })
  findOne(@Param("id") id: string) {
    return this.dailyStatsService.findOne(+id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a daily stat by ID" })
  update(
    @Param("id") id: string,
    @Body() updateDailyStatDto: UpdateDailyStatDto
  ) {
    return this.dailyStatsService.update(+id, updateDailyStatDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a daily stat by ID" })
  remove(@Param("id") id: string) {
    return this.dailyStatsService.remove(+id);
  }
}
