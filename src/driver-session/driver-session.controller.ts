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
import { DriverSessionService } from "./driver-session.service";
import { CreateDriverSessionDto } from "./dto/create-driver-session.dto";
import { UpdateDriverSessionDto } from "./dto/update-driver-session.dto";

import { ApiBearerAuth, ApiTags, ApiOperation } from "@nestjs/swagger";
import { RoleGuard } from "../auth/role.guard";
import { UserCategoryGuard } from "../auth/user.guard";
import { Roles } from "../common/decorators/role.decorator";

@ApiTags("Driver Sessions")
@ApiBearerAuth()
@Controller("driver-session")
@UseGuards(RoleGuard, UserCategoryGuard)
@Roles("driver") // Only drivers can access this controller
export class DriverSessionController {
  constructor(private readonly driverSessionService: DriverSessionService) {}

  @Post()
  @ApiOperation({ summary: "Create a driver session" })
  create(@Body() createDriverSessionDto: CreateDriverSessionDto) {
    return this.driverSessionService.create(createDriverSessionDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all driver sessions" })
  findAll() {
    return this.driverSessionService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a specific driver session by ID" })
  findOne(@Param("id") id: string) {
    return this.driverSessionService.findOne(+id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a driver session by ID" })
  update(
    @Param("id") id: string,
    @Body() updateDriverSessionDto: UpdateDriverSessionDto
  ) {
    return this.driverSessionService.update(+id, updateDriverSessionDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a driver session by ID" })
  remove(@Param("id") id: string) {
    return this.driverSessionService.remove(+id);
  }
}
