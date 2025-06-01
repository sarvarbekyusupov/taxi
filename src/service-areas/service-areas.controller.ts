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
import { ServiceAreaService } from "./service-areas.service";
import { CreateServiceAreaDto } from "./dto/create-service-area.dto";
import { UpdateServiceAreaDto } from "./dto/update-service-area.dto";
import { Roles } from "../common/decorators/role.decorator";
import { RoleGuard } from "../auth/role.guard";
import { UserCategoryGuard } from "../auth/user.guard";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";

@ApiTags("Service Areas")
@ApiBearerAuth()
@Controller("service-areas")
@UseGuards(RoleGuard, UserCategoryGuard)
@Roles("admin", "super_admin")
export class ServiceAreasController {
  constructor(private readonly serviceAreasService: ServiceAreaService) {}

  @Post()
  @ApiOperation({ summary: "Create a new service area" })
  create(@Body() createServiceAreaDto: CreateServiceAreaDto) {
    return this.serviceAreasService.create(createServiceAreaDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all service areas" })
  findAll() {
    return this.serviceAreasService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a service area by ID" })
  findOne(@Param("id") id: string) {
    return this.serviceAreasService.findOne(+id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a service area by ID" })
  update(
    @Param("id") id: string,
    @Body() updateServiceAreaDto: UpdateServiceAreaDto
  ) {
    return this.serviceAreasService.update(+id, updateServiceAreaDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a service area by ID" })
  remove(@Param("id") id: string) {
    return this.serviceAreasService.remove(+id);
  }
}
