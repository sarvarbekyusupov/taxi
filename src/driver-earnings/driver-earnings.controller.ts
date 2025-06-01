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
import { DriverEarningService } from "./driver-earnings.service";
import { CreateDriverEarningDto } from "./dto/create-driver-earning.dto";
import { UpdateDriverEarningDto } from "./dto/update-driver-earning.dto";

import { ApiBearerAuth, ApiTags, ApiOperation } from "@nestjs/swagger";
import { RoleGuard } from "../auth/role.guard";
import { UserCategoryGuard } from "../auth/user.guard";
import { Roles } from "../common/decorators/role.decorator";

@ApiTags("Driver Earnings")
@ApiBearerAuth()
@UseGuards(RoleGuard, UserCategoryGuard)
@Roles("driver")
@Controller("driver-earnings")
export class DriverEarningsController {
  constructor(private readonly driverEarningsService: DriverEarningService) {}

  @Post()
  @ApiOperation({ summary: "Create a new driver earning record" })
  create(@Body() createDriverEarningDto: CreateDriverEarningDto) {
    return this.driverEarningsService.create(createDriverEarningDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all driver earnings" })
  findAll() {
    return this.driverEarningsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a driver earning by ID" })
  findOne(@Param("id") id: string) {
    return this.driverEarningsService.findOne(+id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a driver earning by ID" })
  update(
    @Param("id") id: string,
    @Body() updateDriverEarningDto: UpdateDriverEarningDto
  ) {
    return this.driverEarningsService.update(+id, updateDriverEarningDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a driver earning by ID" })
  remove(@Param("id") id: string) {
    return this.driverEarningsService.remove(+id);
  }
}
