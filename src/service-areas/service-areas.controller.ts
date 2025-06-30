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
import { ServiceAreaService } from "./service-areas.service";
import { CreateServiceAreaDto } from "./dto/create-service-area.dto";
import { UpdateServiceAreaDto } from "./dto/update-service-area.dto";
import { Roles } from "../common/decorators/role.decorator";
import { RoleGuard } from "../auth/role.guard";
import { UserCategoryGuard } from "../auth/user.guard";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from "@nestjs/swagger";

@ApiTags("Service Areas")
@ApiBearerAuth()
@UseGuards(RoleGuard, UserCategoryGuard)
@Roles("admin", "super_admin")
@Controller("service-areas")
export class ServiceAreasController {
  constructor(private readonly serviceAreasService: ServiceAreaService) {}

  @Post()
  @ApiOperation({ summary: "Create a new service area" })
  @ApiResponse({
    status: 201,
    description: "Service area created successfully",
  })
  @ApiResponse({ status: 400, description: "Validation failed" })
  create(@Body() createServiceAreaDto: CreateServiceAreaDto) {
    return this.serviceAreasService.create(createServiceAreaDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all service areas" })
  @ApiResponse({ status: 200, description: "List of service areas" })
  findAll() {
    return this.serviceAreasService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a service area by ID" })
  @ApiParam({ name: "id", type: Number, example: 1 })
  @ApiResponse({ status: 200, description: "Service area found" })
  @ApiResponse({ status: 404, description: "Service area not found" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.serviceAreasService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a service area by ID" })
  @ApiParam({ name: "id", type: Number, example: 1 })
  @ApiResponse({ status: 200, description: "Service area updated" })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 404, description: "Service area not found" })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateServiceAreaDto: UpdateServiceAreaDto
  ) {
    return this.serviceAreasService.update(id, updateServiceAreaDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a service area by ID" })
  @ApiParam({ name: "id", type: Number, example: 1 })
  @ApiResponse({ status: 200, description: "Service area deleted" })
  @ApiResponse({ status: 404, description: "Service area not found" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.serviceAreasService.remove(id);
  }
}
