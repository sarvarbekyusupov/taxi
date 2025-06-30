import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
} from "@nestjs/common";
import { CarService } from "./car.service";
import { CreateCarDto } from "./dto/create-car.dto";
import { UpdateCarDto } from "./dto/update-car.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Roles } from "../common/decorators/role.decorator";
import { RoleGuard } from "../auth/role.guard";
import { UserCategoryGuard } from "../auth/user.guard";
import { Car } from "./entities/car.entity";

@ApiTags("car")
@ApiBearerAuth() // Applies to all routes by default
@Controller("car")
export class CarController {
  constructor(private readonly carService: CarService) {}

  @Post()
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("driver", "admin")
  @ApiOperation({ summary: "Create a car" })
  @ApiBody({ type: CreateCarDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Car created successfully.",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data.",
  })
  create(@Body() createCarDto: CreateCarDto) {
    return this.carService.create(createCarDto);
  }

  @Get()
  @UseGuards(RoleGuard)
  @Roles("admin", "super_admin")
  @ApiOperation({ summary: "Retrieve all cars" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "List of all cars.",
    type: [Car],
  })
  findAll() {
    return this.carService.findAll();
  }

  @Get(":id")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("driver", "admin", "super_admin")
  @ApiOperation({ summary: "Get car by ID" })
  @ApiParam({ name: "id", type: Number, description: "Car ID", required: true })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Car details.",
    type: Car,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Car not found." })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.carService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("driver", "admin")
  @ApiOperation({ summary: "Update a car" })
  @ApiParam({ name: "id", type: Number, description: "Car ID", required: true })
  @ApiBody({ type: UpdateCarDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Car updated successfully.",
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Car not found." })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateCarDto: UpdateCarDto
  ) {
    return this.carService.update(id, updateCarDto);
  }

  @Delete(":id")
  @UseGuards(RoleGuard)
  @Roles("admin", "super_admin")
  @ApiOperation({ summary: "Delete a car" })
  @ApiParam({ name: "id", type: Number, description: "Car ID", required: true })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Car deleted successfully.",
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Car not found." })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.carService.remove(id);
  }
}

