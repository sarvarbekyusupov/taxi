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
  Query,
  ParseFloatPipe,
  NotFoundException,
  HttpCode,
  HttpStatus,
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
  ApiQuery,
  ApiBody,
} from "@nestjs/swagger";
import { ServiceArea } from "./entities/service-area.entity";

// Enhanced mock data for better examples
const mockServiceArea = {
  id: 1,
  name: "Tashkent Center",
  city: "Tashkent",
  center_lat: 41.311081,
  center_lng: 69.240562,
  radius_km: 5.0,
  is_active: true,
  created_at: "2025-07-17T06:26:48.000Z",
  updated_at: "2025-07-17T06:26:48.000Z",
  tariffs: [
    {
      id: 1,
      vehicle_type: "sedan",
      base_fare: 5000,
      per_km_rate: 1000,
      per_minute_rate: 200,
      minimum_fare: 3000,
      is_active: true,
    },
  ],
  daily_stats: [
    {
      date: "2025-07-17",
      total_rides: 156,
      total_revenue: 2340000,
      average_ride_duration: 15.5,
    },
  ],
};

const mockServiceAreaList = [
  mockServiceArea,
  {
    id: 2,
    name: "Chilanzar",
    city: "Tashkent",
    center_lat: 41.275,
    center_lng: 69.2,
    radius_km: 4.5,
    is_active: true,
    created_at: "2025-07-17T07:15:22.000Z",
    updated_at: "2025-07-17T07:15:22.000Z",
    tariffs: [],
    daily_stats: [],
  },
  {
    id: 3,
    name: "Yunusabad",
    city: "Tashkent",
    center_lat: 41.335,
    center_lng: 69.289,
    radius_km: 6.0,
    is_active: false,
    created_at: "2025-07-17T08:30:15.000Z",
    updated_at: "2025-07-17T09:45:30.000Z",
    tariffs: [],
    daily_stats: [],
  },
];

// Error response examples
const errorResponses = {
  badRequest: {
    statusCode: 400,
    message: "Validation failed",
    error: "Bad Request",
    details: [
      {
        field: "center_lat",
        message: "center_lat must be a valid latitude between -90 and 90",
      },
      {
        field: "radius_km",
        message: "radius_km must be a positive number",
      },
    ],
  },
  unauthorized: {
    statusCode: 401,
    message: "Unauthorized",
    error: "Unauthorized",
  },
  forbidden: {
    statusCode: 403,
    message: "Forbidden resource",
    error: "Forbidden",
  },
  notFound: {
    statusCode: 404,
    message: "Service area with ID 999 not found",
    error: "Not Found",
  },
  locationNotFound: {
    statusCode: 404,
    message: "No active service area found for coordinates (41.123, 69.456)",
    error: "Not Found",
  },
};

@ApiTags("Service Areas")
@Controller("service-areas")
@ApiBearerAuth()
export class ServiceAreasController {
  constructor(private readonly serviceAreasService: ServiceAreaService) {}

  // --- USER-FACING ENDPOINT ---
  @Get("by-location")
  @ApiOperation({
    summary: "Find service area by GPS location",
    description: `
      Finds the most specific active service area for a given latitude and longitude.
      Essential for rider and driver apps to determine the correct tariff zone.
      
      **How it works:**
      - Uses Haversine formula to calculate distance from point to service area centers
      - Only returns active service areas (is_active = true)
      - If multiple areas contain the point, returns the one with smallest radius
      - Includes related tariffs and daily statistics
      
      **Use cases:**
      - Ride pricing calculations
      - Driver zone assignment
      - Service availability checks
    `,
  })
  @ApiQuery({
    name: "lat",
    type: Number,
    required: true,
    description: "Latitude coordinate (-90 to 90)",
    example: 41.311081,
  })
  @ApiQuery({
    name: "lng",
    type: Number,
    required: true,
    description: "Longitude coordinate (-180 to 180)",
    example: 69.240562,
  })
  @ApiResponse({
    status: 200,
    description: "The most specific service area found for the location.",
    content: {
      "application/json": {
        example: mockServiceArea,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid latitude or longitude parameters.",
    content: {
      "application/json": {
        example: {
          statusCode: 400,
          message: "Validation failed",
          error: "Bad Request",
          details: [
            {
              field: "lat",
              message: "lat must be a number between -90 and 90",
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Authentication required.",
    content: {
      "application/json": {
        example: errorResponses.unauthorized,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "No active service area found for the provided coordinates.",
    content: {
      "application/json": {
        example: errorResponses.locationNotFound,
      },
    },
  })
  async findByLocation(
    @Query("lat", ParseFloatPipe) lat: number,
    @Query("lng", ParseFloatPipe) lng: number
  ): Promise<ServiceArea> {
    const area = await this.serviceAreasService.findAreaByCoordinates(lat, lng);
    if (!area) {
      throw new NotFoundException(
        `No active service area found for coordinates (${lat}, ${lng})`
      );
    }
    return area;
  }

  // --- ADMIN ENDPOINTS ---
  @Post()
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin", "super_admin")
  @ApiOperation({
    summary: "ADMIN: Create a new service area",
    description: `
      Creates a new service area with specified geographic boundaries and properties.
      
      **Requirements:**
      - Admin or super_admin role
      - Valid latitude/longitude coordinates
      - Positive radius in kilometers
      - Unique area name within the same city
      
      **Note:** Newly created areas are active by default unless specified otherwise.
    `,
  })
  @ApiBody({
    type: CreateServiceAreaDto,
    description: "Service area data to create",
    examples: {
      basic: {
        summary: "Basic service area",
        value: {
          name: "Mirzo Ulugbek",
          city: "Tashkent",
          center_lat: 41.325,
          center_lng: 69.285,
          radius_km: 5.5,
          is_active: true,
        },
      },
      airport: {
        summary: "Airport service area",
        value: {
          name: "Tashkent International Airport",
          city: "Tashkent",
          center_lat: 41.257861,
          center_lng: 69.281186,
          radius_km: 2.0,
          is_active: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Service area created successfully.",
    content: {
      "application/json": {
        example: mockServiceArea,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Validation failed or invalid input data.",
    content: {
      "application/json": {
        example: errorResponses.badRequest,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Authentication required.",
    content: {
      "application/json": {
        example: errorResponses.unauthorized,
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Insufficient permissions. Admin role required.",
    content: {
      "application/json": {
        example: errorResponses.forbidden,
      },
    },
  })
  create(
    @Body() createServiceAreaDto: CreateServiceAreaDto
  ): Promise<ServiceArea> {
    return this.serviceAreasService.create(createServiceAreaDto);
  }

  @Get()
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin", "super_admin")
  @ApiOperation({
    summary: "ADMIN: Get all service areas",
    description: `
      Retrieves all service areas with their related tariffs and daily statistics.
      
      **Includes:**
      - Basic area information (name, location, radius)
      - Associated tariffs for different vehicle types
      - Daily statistics and performance metrics
      - Activity status (active/inactive)
      
      **Sorting:** Results are ordered by area ID in ascending order.
    `,
  })
  @ApiResponse({
    status: 200,
    description: "List of all service areas with related data.",
    content: {
      "application/json": {
        example: mockServiceAreaList,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Authentication required.",
    content: {
      "application/json": {
        example: errorResponses.unauthorized,
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Insufficient permissions. Admin role required.",
    content: {
      "application/json": {
        example: errorResponses.forbidden,
      },
    },
  })
  findAll(): Promise<ServiceArea[]> {
    return this.serviceAreasService.findAll();
  }

  @Get(":id")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin", "super_admin")
  @ApiOperation({
    summary: "ADMIN: Get a service area by ID",
    description: `
      Retrieves a specific service area by its unique identifier.
      
      **Includes:**
      - Complete area details
      - Associated tariffs
      - Daily statistics
      - Creation and update timestamps
    `,
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "Unique service area identifier",
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "Service area details with related data.",
    content: {
      "application/json": {
        example: mockServiceArea,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Authentication required.",
    content: {
      "application/json": {
        example: errorResponses.unauthorized,
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Insufficient permissions. Admin role required.",
    content: {
      "application/json": {
        example: errorResponses.forbidden,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Service area not found.",
    content: {
      "application/json": {
        example: errorResponses.notFound,
      },
    },
  })
  findOne(@Param("id", ParseIntPipe) id: number): Promise<ServiceArea> {
    return this.serviceAreasService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin", "super_admin")
  @ApiOperation({
    summary: "ADMIN: Update a service area",
    description: `
      Updates an existing service area with new data. Only provided fields will be updated.
      
      **Updatable fields:**
      - name: Area display name
      - city: City name
      - center_lat: Center latitude
      - center_lng: Center longitude
      - radius_km: Coverage radius
      - is_active: Active status
      
      **Note:** Updating geographic boundaries may affect existing rides and pricing.
    `,
  })
  @ApiParam({
    name: "id",
    type: Number,
    description: "Unique service area identifier",
    example: 1,
  })
  @ApiBody({
    type: UpdateServiceAreaDto,
    description: "Fields to update (partial update supported)",
    examples: {
      nameAndStatus: {
        summary: "Update name and status",
        value: {
          name: "Tashkent Center - Updated",
          is_active: false,
        },
      },
      locationAndRadius: {
        summary: "Update location and radius",
        value: {
          center_lat: 41.315,
          center_lng: 69.245,
          radius_km: 6.0,
        },
      },
      fullUpdate: {
        summary: "Complete update",
        value: {
          name: "Downtown Tashkent",
          city: "Tashkent",
          center_lat: 41.311081,
          center_lng: 69.240562,
          radius_km: 5.5,
          is_active: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Service area updated successfully.",
    content: {
      "application/json": {
        example: {
          ...mockServiceArea,
          name: "Tashkent Center - Updated",
          updated_at: "2025-07-17T12:30:45.000Z",
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input data or validation errors.",
    content: {
      "application/json": {
        example: errorResponses.badRequest,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Authentication required.",
    content: {
      "application/json": {
        example: errorResponses.unauthorized,
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Insufficient permissions. Admin role required.",
    content: {
      "application/json": {
        example: errorResponses.forbidden,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Service area not found.",
    content: {
      "application/json": {
        example: errorResponses.notFound,
      },
    },
  })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateServiceAreaDto: UpdateServiceAreaDto
  ): Promise<ServiceArea> {
    return this.serviceAreasService.update(id, updateServiceAreaDto);
  }

  @Delete(":id")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin", "super_admin")
  @ApiOperation({
    summary: "ADMIN: Delete a service area",
    description: `
      Permanently deletes a service area from the system.
      
      **Warning:** This action cannot be undone and will:
      - Remove all associated tariffs
      - Clear daily statistics
      - Affect historical ride data references
      
      **Recommendation:** Consider deactivating instead of deleting for data integrity.
    `,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({
    name: "id",
    type: Number,
    description: "Unique service area identifier",
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: "Service area deleted successfully. No content returned.",
  })
  @ApiResponse({
    status: 401,
    description: "Authentication required.",
    content: {
      "application/json": {
        example: errorResponses.unauthorized,
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Insufficient permissions. Admin role required.",
    content: {
      "application/json": {
        example: errorResponses.forbidden,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Service area not found.",
    content: {
      "application/json": {
        example: errorResponses.notFound,
      },
    },
  })
  remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.serviceAreasService.remove(id);
  }
}
