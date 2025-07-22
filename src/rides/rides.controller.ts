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
  Req,
  Query,
  Headers,
} from "@nestjs/common";
import { RidesService } from "./rides.service";
import { CreateRideDto } from "./dto/create-ride.dto";
import { UpdateRideDto } from "./dto/update-ride.dto";
import { UserCategoryGuard } from "../auth/user.guard";
import { RoleGuard } from "../auth/role.guard";
import { Roles } from "../common/decorators/role.decorator";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiBody,
  ApiQuery,
  ApiExcludeEndpoint,
  ApiHeader,
} from "@nestjs/swagger";
import { RideStatus } from "./entities/ride.entity";
import { Res } from "@nestjs/common";
import { Response } from "express";
import { register } from "prom-client";
import { RideAuthorizationGuard } from "./ride-authorization.guard";

@ApiTags("Rides")
@Controller("rides")
@UseGuards(RoleGuard, UserCategoryGuard)
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post()
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("client", "admin", "super_admin")
  @ApiBearerAuth()
  @ApiTags("Rides")
  @ApiOperation({
    summary: "Create a new ride",
    description:
      "Client creates a ride request which gets matched to the nearest driver. Admins can also use this for testing purposes.",
  })
  @ApiBody({
    type: CreateRideDto,
    required: true,
    examples: {
      default: {
        summary: "Typical economy ride request",
        value: {
          client_id: 12,
          pickup_latitude: 41.311081,
          pickup_longitude: 69.240562,
          pickup_address: "Tashkent City Center",
          destination_latitude: 41.3275,
          destination_longitude: 69.2817,
          destination_address: "Yunusobod District",
          estimated_distance: 8.6,
          estimated_duration_minutes: 15,
          service_area_id: 1,
          payment_method: "cash",
          promo_code_id: null,
          discount_amount: 0,
          tariff_type: "ECONOMY",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Ride created and assigned successfully",
  })
  @ApiBadRequestResponse({
    description:
      "Validation failed, rate limit exceeded, or no drivers available",
  })
  @ApiInternalServerErrorResponse({
    description: "Unexpected internal server error during ride creation",
  })
  @ApiHeader({ name: 'Idempotency-Key', description: 'Idempotency key to prevent duplicate ride creation' })
  async create(@Body() createRideDto: CreateRideDto, @Headers('Idempotency-Key') idempotencyKey: string) {
    return this.ridesService.create(createRideDto, idempotencyKey);
  }

  @Patch(":id/accept")
  @UseGuards(RoleGuard, UserCategoryGuard, RideAuthorizationGuard)
  @Roles("driver")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Driver accepts a pending ride" })
  @ApiParam({
    name: "id",
    required: true,
    type: Number,
    description: "ID of the ride to accept",
    example: 42,
  })
  @ApiCreatedResponse({
    description: "Ride was successfully accepted by the driver",
  })
  @ApiBadRequestResponse({
    description: "Ride is not in a valid state or driver is unauthorized",
  })
  @ApiNotFoundResponse({
    description: "Ride not found",
  })
  acceptRide(@Param("id", ParseIntPipe) id: number, @Req() req: any) {
    const driverId = req.user.sub;
    return this.ridesService.acceptRide(id, driverId);
  }

  @Patch(":id/start")
  @UseGuards(RoleGuard, UserCategoryGuard, RideAuthorizationGuard)
  @Roles("driver")
  @ApiBearerAuth()
  @ApiTags("Rides")
  @ApiOperation({
    summary: "Driver starts an accepted ride",
    description:
      "Allows a driver to mark a ride as started. Only the assigned driver can start the ride, and only if the status is ACCEPTED.",
  })
  @ApiParam({
    name: "id",
    required: true,
    type: Number,
    description: "ID of the ride to start",
    example: 102,
  })
  @ApiResponse({
    status: 200,
    description: "Ride started successfully",
  })
  @ApiNotFoundResponse({
    description: "Ride not found or driver not assigned",
  })
  @ApiForbiddenResponse({
    description: "You are not authorized to start this ride",
  })
  @ApiBadRequestResponse({
    description: "Ride is not in ACCEPTED state",
  })
  @ApiInternalServerErrorResponse({
    description: "Unexpected error occurred while starting ride",
  })
  async startRide(@Param("id", ParseIntPipe) id: number, @Req() req: any) {
    const driverId = req.user.sub;
    return this.ridesService.startRide(id, driverId);
  }

  @Patch(":id/complete")
  @UseGuards(RoleGuard, UserCategoryGuard, RideAuthorizationGuard)
  @Roles("driver")
  @ApiBearerAuth()
  @ApiTags("Rides")
  @ApiOperation({
    summary: "Driver completes the ride",
    description:
      "Allows the assigned driver to mark a ride as completed, optionally providing actual distance, duration, and final fare.",
  })
  @ApiParam({
    name: "id",
    required: true,
    type: Number,
    description: "ID of the ride to complete",
    example: 105,
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        actualDistance: {
          type: "number",
          example: 9.2,
          description: "Actual distance in kilometers",
        },
        actualDuration: {
          type: "number",
          example: 17,
          description: "Actual duration in minutes",
        },
        finalFare: {
          type: "number",
          example: 19000,
          description: "Final fare calculated after ride ends",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Ride marked as completed",
  })
  @ApiForbiddenResponse({
    description: "Driver is not assigned to this ride",
  })
  @ApiNotFoundResponse({
    description: "Ride not found",
  })
  @ApiBadRequestResponse({
    description: "Ride is not in STARTED status",
  })
  @ApiInternalServerErrorResponse({
    description: "Unexpected error occurred during completion",
  })
  async completeRide(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: any,
    @Body()
    body: {
      actualDistance?: number;
      actualDuration?: number;
      finalFare?: number;
    }
  ) {
    const driverId = req.user.sub;
    return this.ridesService.completeRide(id, driverId, body);
  }

  @Patch(":id/cancel")
  @UseGuards(RoleGuard, UserCategoryGuard, RideAuthorizationGuard)
  @Roles("driver", "client")
  @ApiBearerAuth()
  @ApiTags("Rides")
  @ApiOperation({
    summary: "Cancel a ride",
    description:
      "Allows a driver or client to cancel a ride before it's completed or paid. Reason is optional.",
  })
  @ApiParam({
    name: "id",
    required: true,
    type: Number,
    description: "ID of the ride to cancel",
    example: 107,
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          example: "Client no-show at pickup location",
          description: "Optional reason for cancellation",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Ride was successfully cancelled",
  })
  @ApiForbiddenResponse({
    description: "You are not authorized to cancel this ride",
  })
  @ApiNotFoundResponse({
    description: "Ride not found",
  })
  @ApiBadRequestResponse({
    description: "Ride cannot be cancelled in its current status",
  })
  @ApiInternalServerErrorResponse({
    description: "Unexpected error during ride cancellation",
  })
  async cancelRide(
    @Param("id", ParseIntPipe) id: number,
    @Body("reason") reason: string,
    @Req() req: any
  ) {
    const userId = req.user.sub;
    const role = req.user.role;
    return this.ridesService.cancelRide(id, userId, role, reason);
  }

  @Get("client/history")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("client")
  @ApiBearerAuth()
  @ApiTags("Rides")
  @ApiOperation({
    summary: "Get ride history for a client",
    description:
      "Returns paginated list of rides for the authenticated client. Supports filtering by status and date range.",
  })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 20 })
  @ApiQuery({
    name: "status",
    required: false,
    enum: RideStatus,
    example: RideStatus.COMPLETED,
  })
  @ApiQuery({
    name: "from",
    required: false,
    type: String,
    example: "2024-06-01T00:00:00.000Z",
    description: "Start date (ISO format)",
  })
  @ApiQuery({
    name: "to",
    required: false,
    type: String,
    example: "2024-06-30T23:59:59.000Z",
    description: "End date (ISO format)",
  })
  @ApiResponse({
    status: 200,
    description: "Paginated client ride history",
  })
  async getClientRides(@Req() req: any, @Query() query: any) {
    return this.ridesService.getClientRides(req.user.sub, {
      page: +query.page || 1,
      limit: +query.limit || 20,
      status: query.status,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });
  }

  @Get("driver/history")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("driver")
  @ApiBearerAuth()
  @ApiTags("Rides")
  @ApiOperation({
    summary: "Get ride history for a driver",
    description:
      "Returns paginated list of rides for the authenticated driver. Supports filtering by status and date range.",
  })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 20 })
  @ApiQuery({
    name: "status",
    required: false,
    enum: RideStatus,
    example: RideStatus.CANCELLED,
  })
  @ApiQuery({
    name: "from",
    required: false,
    type: String,
    example: "2024-06-01T00:00:00.000Z",
  })
  @ApiQuery({
    name: "to",
    required: false,
    type: String,
    example: "2024-06-30T23:59:59.000Z",
  })
  @ApiResponse({
    status: 200,
    description: "Paginated driver ride history",
  })
  async getDriverRides(@Req() req: any, @Query() query: any) {
    return this.ridesService.getDriverRides(req.user.sub, {
      page: +query.page || 1,
      limit: +query.limit || 20,
      status: query.status,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });
  }

  @Get("driver/acceptance-rate")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("driver")
  @ApiBearerAuth()
  @ApiTags("Rides")
  @ApiOperation({
    summary: "Get driver's ride acceptance rate",
    description:
      "Returns statistics on how often the driver accepts offered rides (based on Redis metrics).",
  })
  @ApiResponse({
    status: 200,
    description: "Driver acceptance statistics",
    schema: {
      example: {
        acceptanceRate: 0.75,
        totalOffers: 20,
        acceptedOffers: 15,
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: "Redis failure or circuit breaker open",
  })
  async getDriverAcceptanceRate(@Req() req: any) {
    const driverId = req.user.sub;
    return this.ridesService.getDriverAcceptanceRate(driverId);
  }

  @Get("health")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  @ApiTags("Rides")
  @ApiOperation({
    summary: "Health check for ride service",
    description:
      "Returns status of core system components: database, Redis, rate limiter, Prometheus metrics, and circuit breaker.",
  })
  @ApiResponse({
    status: 200,
    description: "Current system health status",
    schema: {
      example: {
        database: true,
        redis: true,
        circuitBreaker: {
          state: "CLOSED",
          failureCount: 0,
          lastFailureTime: 0,
          consecutiveSuccesses: 3,
        },
        rateLimit: true,
        metrics: true,
        status: "healthy",
        timestamp: "2025-06-28T12:00:00.000Z",
        version: "1.3.7",
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: "Unexpected health check failure",
  })
  async getHealthStatus() {
    return this.ridesService.getHealthStatus();
  }

  @Get("metrics")
  @Roles("admin", "super_admin") // or remove if public metrics scraping is allowed
  @UseGuards(RoleGuard, UserCategoryGuard)
  @ApiExcludeEndpoint() // hides from Swagger UI (optional & recommended)
  async getMetrics(@Res() res: Response) {
    const metrics = await this.ridesService.getMetrics();
    res.setHeader("Content-Type", register.contentType);
    res.status(200).send(metrics);
  }

  @Get("stats")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  @ApiTags("Rides")
  @ApiOperation({
    summary: "Get ride service statistics",
    description:
      "Returns aggregated metrics like active rides, total rides in last 24h, circuit breaker state, and top used tariffs. For admin dashboards.",
  })
  @ApiResponse({
    status: 200,
    description: "Service statistics",
    schema: {
      example: {
        activeRides: 12,
        totalRidesLast24h: 267,
        averageResponseTime: 0, // from metrics in future
        circuitBreakerState: {
          state: "CLOSED",
          failureCount: 0,
          consecutiveSuccesses: 3,
          lastFailureTime: 0,
        },
        topTariffs: [
          { tariff: "ECONOMY", count: 154 },
          { tariff: "COMFORT", count: 79 },
          { tariff: "DELIVERY", count: 34 },
        ],
      },
    },
  })
  async getServiceStatistics() {
    return this.ridesService.getServiceStatistics();
  }

  @Post(":id/pay")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("client", "admin", "super_admin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Process payment for a ride" })
  @ApiParam({ name: "id", type: Number })
  async processPayment(@Param("id", ParseIntPipe) id: number) {
    return this.ridesService.processPayment(id);
  }

  @Post(":id/refund")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Refund a ride" })
  @ApiParam({ name: "id", type: Number })
  @ApiBody({ schema: { properties: { amount: { type: "number" }, reason: { type: "string" } } } })
  async handleRefund(
    @Param("id", ParseIntPipe) id: number,
    @Body("amount") amount: number,
    @Body("reason") reason: string
  ) {
    return this.ridesService.handleRefund(id, amount, reason);
  }

  @Post(":id/reassign")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reassign a driver to a ride" })
  @ApiParam({ name: "id", type: Number })
  @ApiBody({ schema: { properties: { reason: { type: "string" } } } })
  async reassignDriver(@Param("id", ParseIntPipe) id: number, @Body("reason") reason: string) {
    return this.ridesService.reassignDriver(id, reason);
  }

  @Patch("driver/:id/location")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("driver")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update driver location" })
  @ApiParam({ name: "id", type: Number })
  @ApiBody({ schema: { properties: { lat: { type: "number" }, lng: { type: "number" } } } })
  async updateDriverLocation(
    @Param("id", ParseIntPipe) id: number,
    @Body("lat") lat: number,
    @Body("lng") lng: number
  ) {
    return this.ridesService.updateDriverLocation(id, lat, lng);
  }

  @Post("schedule")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("client", "admin", "super_admin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Schedule a ride" })
  async scheduleRide(@Body() createScheduledRideDto: any) {
    return this.ridesService.addSupportForScheduledRides(createScheduledRideDto);
  }

  @Get("performance")
  @UseGuards(RoleGuard, UserCategoryGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get system performance metrics" })
  async getSystemPerformanceMetrics() {
    return this.ridesService.getSystemPerformanceMetrics();
  }

  // @Get("fares/estimate")
  // @ApiOperation({ summary: "Get estimated fare based on pickup and destination" })
  // @ApiQuery({ name: "pickupLat", type: Number, description: "Pickup latitude" })
  // @ApiQuery({ name: "pickupLng", type: Number, description: "Pickup longitude" })
  // @ApiQuery({ name: "destinationLat", type: Number, description: "Destination latitude" })
  // @ApiQuery({ name: "destinationLng", type: Number, description: "Destination longitude" })
  // @ApiQuery({ name: "tariffType", enum: TariffType, description: "Type of tariff for the ride" })
  // @ApiResponse({
  //   status: 200,
  //   description: "Returns the estimated fare",
  //   schema: {
  //     example: 25000,
  //   },
  // })
  // async getEstimatedFare(
  //   @Query("pickupLat") pickupLat: number,
  //   @Query("pickupLng") pickupLng: number,
  //   @Query("destinationLat") destinationLat: number,
  //   @Query("destinationLng") destinationLng: number,
  //   @Query("tariffType") tariffType: TariffType,
  // ) {
  //   return this.ridesService.estimateFare(
  //     pickupLat,
  //     pickupLng,
  //     destinationLat,
  //     destinationLng,
  //     carTypeId,
  //   );
  // }
}
