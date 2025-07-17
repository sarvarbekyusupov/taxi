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
  HttpStatus,
  HttpCode,
  Query,
  ParseFloatPipe,
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
  ApiResponse,
  ApiQuery,
} from "@nestjs/swagger";

@ApiTags("Tariffs")
@Controller("tariff")
export class TariffController {
  constructor(private readonly tariffService: TariffService) {}

  @ApiBearerAuth()
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin", "super_admin")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create a new tariff",
    description:
      "Creates a new tariff with service area and car type relations",
  })
  @ApiBody({
    type: CreateTariffDto,
    description: "Tariff creation data",
    examples: {
      economy: {
        summary: "Economy tariff example",
        description: "Basic economy car tariff for city center",
        value: {
          name: "Daytime Economy", // <-- Added name
          service_area_id: 1,
          car_type_id: 1,
          base_fare: 10000,
          per_km_rate: 1500,
          per_minute_rate: 300,
          minimum_fare: 5000,
          cancellation_fee: 2000,
          is_active: true,
        },
      },
      premium: {
        summary: "Premium tariff example",
        description: "Premium car tariff with higher rates",
        value: {
          name: "Airport Premium", // <-- Added name
          service_area_id: 2,
          car_type_id: 2,
          base_fare: 25000,
          per_km_rate: 3000,
          per_minute_rate: 500,
          minimum_fare: 15000,
          cancellation_fee: 5000,
          is_active: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Tariff created successfully",
    example: {
      id: 1,
      name: "Economy", // <-- Added name
      service_area_id: 1,
      car_type_id: 1,
      base_fare: 10000,
      per_km_rate: 1500,
      per_minute_rate: 300,
      minimum_fare: 5000,
      cancellation_fee: 2000,
      is_active: true,
      created_at: "2025-07-17T10:30:00.000Z",
      updated_at: "2025-07-17T10:30:00.000Z",
      service_area: {
        id: 1,
        name: "Tashkent Center",
        is_active: true,
      },
      car_type: {
        id: 1,
        name: "Economy",
        description: "Standard economy vehicle",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid input data",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient permissions",
  })
  @ApiResponse({
    status: 404,
    description: "Not found - Service area or car type not found",
  })
  create(@Body() dto: CreateTariffDto) {
    return this.tariffService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: "Get all tariffs",
    description:
      "Retrieves all tariffs with service area relations, ordered by creation date",
  })
  @ApiResponse({
    status: 200,
    description: "List of tariffs retrieved successfully",
    example: [
      {
        id: 1,
        service_area_id: 1,
        car_type_id: 1,
        base_fare: 10000,
        per_km_rate: 1500,
        per_minute_rate: 300,
        minimum_fare: 5000,
        cancellation_fee: 2000,
        is_active: true,
        created_at: "2025-07-17T10:30:00.000Z",
        updated_at: "2025-07-17T10:30:00.000Z",
        service_area: {
          id: 1,
          name: "Tashkent Center",
          region_id: 1,
          district_id: 1,
          coordinates: "41.2995,69.2401",
          is_active: true,
        },
      },
      {
        id: 2,
        service_area_id: 2,
        car_type_id: 2,
        base_fare: 25000,
        per_km_rate: 3000,
        per_minute_rate: 500,
        minimum_fare: 15000,
        cancellation_fee: 5000,
        is_active: true,
        created_at: "2025-07-17T09:15:00.000Z",
        updated_at: "2025-07-17T09:15:00.000Z",
        service_area: {
          id: 2,
          name: "Tashkent Airport",
          region_id: 1,
          district_id: 2,
          coordinates: "41.2576,69.2813",
          is_active: true,
        },
      },
    ],
  })
  findAll() {
    return this.tariffService.findAll();
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get tariff by ID",
    description: "Retrieves a specific tariff with service area relation",
  })
  @ApiParam({
    name: "id",
    type: Number,
    example: 1,
    description: "Unique identifier of the tariff",
  })
  @ApiResponse({
    status: 200,
    description: "Tariff retrieved successfully",
    example: {
      id: 1,
      service_area_id: 1,
      car_type_id: 1,
      base_fare: 10000,
      per_km_rate: 1500,
      per_minute_rate: 300,
      minimum_fare: 5000,
      cancellation_fee: 2000,
      is_active: true,
      created_at: "2025-07-17T10:30:00.000Z",
      updated_at: "2025-07-17T10:30:00.000Z",
      service_area: {
        id: 1,
        name: "Tashkent Center",
        region_id: 1,
        district_id: 1,
        coordinates: "41.2995,69.2401",
        is_active: true,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid ID format",
    example: {
      statusCode: 400,
      message: "Validation failed (numeric string is expected)",
      error: "Bad Request",
    },
  })
  @ApiResponse({
    status: 404,
    description: "Tariff not found",
    example: {
      statusCode: 404,
      message: "Tariff not found",
      error: "Not Found",
    },
  })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.tariffService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin", "super_admin")
  @Patch(":id")
  @ApiOperation({
    summary: "Update tariff by ID",
    description: "Updates specific fields of an existing tariff",
  })
  @ApiParam({
    name: "id",
    type: Number,
    example: 1,
    description: "Unique identifier of the tariff to update",
  })
  @ApiBody({
    type: UpdateTariffDto,
    description: "Fields to update (all optional)",
    examples: {
      priceUpdate: {
        summary: "Update pricing only",
        description: "Update base fare and per kilometer rate",
        value: {
          base_fare: 12000,
          per_km_rate: 1800,
        },
      },
      statusUpdate: {
        summary: "Update status only",
        description: "Activate or deactivate tariff",
        value: {
          is_active: false,
        },
      },
      fullUpdate: {
        summary: "Update multiple fields",
        description: "Update various tariff parameters",
        value: {
          base_fare: 15000,
          per_km_rate: 2000,
          per_minute_rate: 400,
          minimum_fare: 8000,
          cancellation_fee: 3000,
          is_active: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Tariff updated successfully",
    example: {
      affected: 1,
      generatedMaps: [],
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid input data",
    example: {
      statusCode: 400,
      message: ["base_fare must be a positive number"],
      error: "Bad Request",
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing token",
    example: {
      statusCode: 401,
      message: "Unauthorized",
    },
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient permissions",
    example: {
      statusCode: 403,
      message: "Forbidden resource",
    },
  })
  @ApiResponse({
    status: 404,
    description: "Tariff not found",
    example: {
      statusCode: 404,
      message: "Tariff not found",
      error: "Not Found",
    },
  })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateTariffDto) {
    return this.tariffService.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin", "super_admin")
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete tariff by ID",
    description: "Permanently removes a tariff from the system",
  })
  @ApiParam({
    name: "id",
    type: Number,
    example: 1,
    description: "Unique identifier of the tariff to delete",
  })
  @ApiResponse({
    status: 204,
    description: "Tariff deleted successfully (no content returned)",
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid ID format",
    example: {
      statusCode: 400,
      message: "Validation failed (numeric string is expected)",
      error: "Bad Request",
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing token",
    example: {
      statusCode: 401,
      message: "Unauthorized",
    },
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient permissions",
    example: {
      statusCode: 403,
      message: "Forbidden resource",
    },
  })
  @ApiResponse({
    status: 404,
    description: "Tariff not found",
    example: {
      statusCode: 404,
      message: "Tariff not found",
      error: "Not Found",
    },
  })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.tariffService.remove(id);
  }

  // --- NEW ENDPOINT ---
  @Get("search/by-location")
  @ApiOperation({
    summary: "Find tariffs by geographic location",
    description:
      "Finds all active tariffs for a given latitude and longitude by checking which service area they fall into.",
  })
  @ApiQuery({
    name: "lat",
    type: Number,
    required: true,
    description: "The latitude of the location.",
    example: 41.2995,
  })
  @ApiQuery({
    name: "lng",
    type: Number,
    required: true,
    description: "The longitude of the location.",
    example: 69.2401,
  })
  @ApiResponse({
    status: 200,
    description: "A list of applicable tariffs for the location.",
    example: [
      {
        id: 1,
        base_fare: 10000,
        per_km_rate: 1500,
        per_minute_rate: 300,
        minimum_fare: 5000,
        cancellation_fee: 2000,
        is_active: true,
        created_at: "2025-07-17T10:30:00.000Z",
        updated_at: "2025-07-17T10:30:00.000Z",
        service_area: {
          id: 1,
          name: "Tashkent Center",
        },
        car_type: {
          id: 1,
          name: "Economy",
          description: "Standard economy vehicle",
        },
      },
      {
        id: 3,
        base_fare: 20000,
        per_km_rate: 2500,
        per_minute_rate: 400,
        minimum_fare: 10000,
        cancellation_fee: 4000,
        is_active: true,
        created_at: "2025-07-17T11:00:00.000Z",
        updated_at: "2025-07-17T11:00:00.000Z",
        service_area: {
          id: 1,
          name: "Tashkent Center",
        },
        car_type: {
          id: 2,
          name: "Business",
          description: "Comfortable business class vehicle",
        },
      },
    ],
  })
  @ApiResponse({
    status: 404,
    description:
      "No active service area or tariffs found for the provided coordinates.",
    example: {
      statusCode: 404,
      message: "No active service area found for the provided coordinates.",
      error: "Not Found",
    },
  })
  findTariffsByLocation(
    @Query("lat", ParseFloatPipe) lat: number,
    @Query("lng", ParseFloatPipe) lng: number
  ) {
    return this.tariffService.findTariffsByLocation(lat, lng);
  }
  // --- END OF NEW ENDPOINT ---
}
