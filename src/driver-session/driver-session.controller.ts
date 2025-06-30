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
@Controller("driver-session")
export class DriverSessionController {
  constructor(private readonly driverSessionService: DriverSessionService) {}

  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("driver") // Only drivers can access this controller
  @Post()
  @ApiOperation({ summary: "Create a driver session" })
  create(@Body() createDriverSessionDto: CreateDriverSessionDto) {
    return this.driverSessionService.create(createDriverSessionDto);
  }

  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("driver") // Only drivers can access this controller
  @Get()
  @ApiOperation({ summary: "Get all driver sessions" })
  findAll() {
    return this.driverSessionService.findAll();
  }

  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("driver") // Only drivers can access this controller
  @Get(":id")
  @ApiOperation({ summary: "Get a specific driver session by ID" })
  findOne(@Param("id") id: string) {
    return this.driverSessionService.findOne(+id);
  }

  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("driver") // Only drivers can access this controller
  @Patch(":id")
  @ApiOperation({ summary: "Update a driver session by ID" })
  update(
    @Param("id") id: string,
    @Body() updateDriverSessionDto: UpdateDriverSessionDto
  ) {
    return this.driverSessionService.update(+id, updateDriverSessionDto);
  }

  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("driver") // Only drivers can access this controller
  @Delete(":id")
  @ApiOperation({ summary: "Delete a driver session by ID" })
  remove(@Param("id") id: string) {
    return this.driverSessionService.remove(+id);
  }
}
