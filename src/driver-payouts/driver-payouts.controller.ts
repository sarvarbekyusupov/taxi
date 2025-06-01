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
import { DriverPayoutService } from "./driver-payouts.service";
import { CreateDriverPayoutDto } from "./dto/create-driver-payout.dto";
import { UpdateDriverPayoutDto } from "./dto/update-driver-payout.dto";

import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { RoleGuard } from "../auth/role.guard";
import { UserCategoryGuard } from "../auth/user.guard";
import { Roles } from "../common/decorators/role.decorator";

@ApiTags("Driver Payouts")
@ApiBearerAuth()
@UseGuards(RoleGuard, UserCategoryGuard)
@Roles("driver")
@Controller("driver-payouts")
export class DriverPayoutsController {
  constructor(private readonly driverPayoutsService: DriverPayoutService) {}

  @Post()
  @ApiOperation({ summary: "Create a new driver payout" })
  create(@Body() createDriverPayoutDto: CreateDriverPayoutDto) {
    return this.driverPayoutsService.create(createDriverPayoutDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all driver payouts" })
  findAll() {
    return this.driverPayoutsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a driver payout by ID" })
  findOne(@Param("id") id: string) {
    return this.driverPayoutsService.findOne(+id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a driver payout by ID" })
  update(
    @Param("id") id: string,
    @Body() updateDriverPayoutDto: UpdateDriverPayoutDto
  ) {
    return this.driverPayoutsService.update(+id, updateDriverPayoutDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a driver payout by ID" })
  remove(@Param("id") id: string) {
    return this.driverPayoutsService.remove(+id);
  }
}
