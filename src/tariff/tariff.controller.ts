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
import { TariffService } from "./tariff.service";
import { CreateTariffDto } from "./dto/create-tariff.dto";
import { UpdateTariffDto } from "./dto/update-tariff.dto";
import { Roles } from "../common/decorators/role.decorator";
import { RoleGuard } from "../auth/role.guard";
import { UserCategoryGuard } from "../auth/user.guard";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";

@ApiTags("Tariffs")
@ApiBearerAuth()
@Controller("tariff")
@UseGuards(RoleGuard, UserCategoryGuard)
@Roles("admin", "super_admin")
export class TariffController {
  constructor(private readonly tariffService: TariffService) {}

  @Post()
  @ApiOperation({ summary: "Create a new tariff" })
  create(@Body() createTariffDto: CreateTariffDto) {
    return this.tariffService.create(createTariffDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all tariffs" })
  findAll() {
    return this.tariffService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get tariff by ID" })
  findOne(@Param("id") id: string) {
    return this.tariffService.findOne(+id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update tariff by ID" })
  update(@Param("id") id: string, @Body() updateTariffDto: UpdateTariffDto) {
    return this.tariffService.update(+id, updateTariffDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete tariff by ID" })
  remove(@Param("id") id: string) {
    return this.tariffService.remove(+id);
  }
}
