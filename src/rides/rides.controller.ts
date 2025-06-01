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
import { RideService } from "./rides.service";
import { CreateRideDto } from "./dto/create-ride.dto";
import { UpdateRideDto } from "./dto/update-ride.dto";
import { UserCategoryGuard } from "../auth/user.guard";
import { RoleGuard } from "../auth/role.guard";
import { Roles } from "../common/decorators/role.decorator";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";

@ApiTags("Rides")
@ApiBearerAuth()
@Controller("rides")
@UseGuards(RoleGuard, UserCategoryGuard)
export class RidesController {
  constructor(private readonly ridesService: RideService) {}

  @Post()
  @Roles("admin", "super_admin", "client")
  @ApiOperation({ summary: "Create a new ride (client or admin)" })
  create(@Body() createRideDto: CreateRideDto) {
    return this.ridesService.create(createRideDto);
  }

  @Get()
  @Roles("admin", "super_admin")
  @ApiOperation({ summary: "Get all rides (admin only)" })
  findAll() {
    return this.ridesService.findAll();
  }

  @Get(":id")
  @Roles("admin", "super_admin")
  @ApiOperation({ summary: "Get ride by ID (admin only)" })
  findOne(@Param("id") id: string) {
    return this.ridesService.findOne(+id);
  }

  @Patch(":id")
  @Roles("admin", "super_admin")
  @ApiOperation({ summary: "Update ride by ID (admin only)" })
  update(@Param("id") id: string, @Body() updateRideDto: UpdateRideDto) {
    return this.ridesService.update(+id, updateRideDto);
  }

  @Delete(":id")
  @Roles("admin", "super_admin")
  @ApiOperation({ summary: "Delete ride by ID (admin only)" })
  remove(@Param("id") id: string) {
    return this.ridesService.remove(+id);
  }
}
