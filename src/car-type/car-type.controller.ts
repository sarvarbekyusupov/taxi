import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { CarTypeService } from './car-type.service';
import { CreateCarTypeDto } from './dto/create-car-type.dto';
import { UpdateCarTypeDto } from './dto/update-car-type.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CarType } from './entities/car-type.entity';

@ApiTags("car-type")
@Controller("car-type")
export class CarTypeController {
  constructor(private readonly carTypeService: CarTypeService) {}

  @Post()
  @ApiOperation({ summary: "Create a new car type" })
  @ApiResponse({
    status: 201,
    description: "The car type has been successfully created.",
    type: CarType,
  })
  @ApiResponse({ status: 400, description: "Bad Request. Invalid input data." })
  create(@Body() createCarTypeDto: CreateCarTypeDto) {
    return this.carTypeService.create(createCarTypeDto);
  }

  @Get()
  @ApiOperation({ summary: "Retrieve all car types" })
  @ApiResponse({
    status: 200,
    description: "A list of all car types.",
    type: [CarType],
  })
  findAll() {
    return this.carTypeService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Retrieve a single car type by ID" })
  @ApiParam({
    name: "id",
    required: true,
    description: "The ID of the car type",
  })
  @ApiResponse({
    status: 200,
    description: "The requested car type.",
    type: CarType,
  })
  @ApiResponse({
    status: 404,
    description: "Car type with the given ID not found.",
  })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.carTypeService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update an existing car type" })
  @ApiParam({
    name: "id",
    required: true,
    description: "The ID of the car type to update",
  })
  @ApiResponse({
    status: 200,
    description: "The car type has been successfully updated.",
    type: CarType,
  })
  @ApiResponse({
    status: 404,
    description: "Car type with the given ID not found.",
  })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateCarTypeDto: UpdateCarTypeDto
  ) {
    return this.carTypeService.update(id, updateCarTypeDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a car type" })
  @ApiParam({
    name: "id",
    required: true,
    description: "The ID of the car type to delete",
  })
  @ApiResponse({
    status: 200,
    description: "The car type has been successfully deleted.",
  })
  @ApiResponse({
    status: 404,
    description: "Car type with the given ID not found.",
  })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.carTypeService.remove(id);
  }
}
