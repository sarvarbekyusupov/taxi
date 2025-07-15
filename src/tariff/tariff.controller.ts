import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import { TariffService } from "./tariff.service";
import { CreateTariffDto } from "./dto/create-tariff.dto";
import { UpdateTariffDto } from "./dto/update-tariff.dto";
import { Roles } from "../common/decorators/role.decorator";
import { RoleGuard } from "../auth/role.guard";
import { UserCategoryGuard } from "../auth/user.guard";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";

@ApiTags("Tariffs")
@Controller("tariff")
export class TariffController {
  constructor(private readonly tariffService: TariffService) {}

  @ApiBearerAuth() // <- Swaggerda Bearer token uchun
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin", "super_admin")
  @Post()
  @ApiOperation({ summary: "Create a new tariff" })
  @ApiBody({
    type: CreateTariffDto,
    examples: {
      default: {
        summary: "Basic economy tariff",
        value: {
          region_id: 1,
          district_id: 1,
          car_type: "Economy",
          base_fare: 10000,
          per_km_rate: 1500,
          per_minute_rate: 300,
          minimum_fare: 5000,
          cancellation_fee: 2000,
          is_active: true,
        },
      },
    },
  })
  create(@Body() dto: CreateTariffDto) {
    return this.tariffService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Get all tariffs with service area relation" })
  findAll() {
    return this.tariffService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get tariff by ID" })
  @ApiParam({ name: "id", type: Number, example: 1 })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.tariffService.findOne(id);
  }

  @ApiBearerAuth() // <- Swaggerda Bearer token uchun
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin", "super_admin")
  @Patch(":id")
  @ApiOperation({ summary: "Update tariff by ID" })
  @ApiParam({ name: "id", type: Number, example: 1 })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateTariffDto) {
    return this.tariffService.update(id, dto);
  }

  @ApiBearerAuth() // <- Swaggerda Bearer token uchun
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin", "super_admin")
  @Delete(":id")
  @ApiOperation({ summary: "Delete tariff by ID" })
  @ApiParam({ name: "id", type: Number, example: 1 })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.tariffService.remove(id);
  }
}
