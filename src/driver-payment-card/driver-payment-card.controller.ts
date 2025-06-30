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
import { DriverPaymentCardService } from "./driver-payment-card.service";
import { CreateDriverPaymentCardDto } from "./dto/create-driver-payment-card.dto";
import { UpdateDriverPaymentCardDto } from "./dto/update-driver-payment-card.dto";

import { ApiBearerAuth, ApiTags, ApiOperation } from "@nestjs/swagger";
import { RoleGuard } from "../auth/role.guard";
import { Roles } from "../common/decorators/role.decorator";
import { UserCategoryGuard } from "../auth/user.guard";

@ApiTags("Driver Payment Cards")
@UseGuards(RoleGuard, UserCategoryGuard)
@Roles("driver")
@Controller("driver-payment-card")
export class DriverPaymentCardController {
  constructor(
    private readonly driverPaymentCardService: DriverPaymentCardService
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a driver payment card" })
  create(@Body() createDriverPaymentCardDto: CreateDriverPaymentCardDto) {
    return this.driverPaymentCardService.create(createDriverPaymentCardDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all driver payment cards" })
  findAll() {
    return this.driverPaymentCardService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a driver payment card by ID" })
  findOne(@Param("id") id: string) {
    return this.driverPaymentCardService.findOne(+id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a driver payment card by ID" })
  update(
    @Param("id") id: string,
    @Body() updateDriverPaymentCardDto: UpdateDriverPaymentCardDto
  ) {
    return this.driverPaymentCardService.update(
      +id,
      updateDriverPaymentCardDto
    );
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a driver payment card by ID" })
  remove(@Param("id") id: string) {
    return this.driverPaymentCardService.remove(+id);
  }
}
