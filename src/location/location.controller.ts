import { Controller, Get, Param, NotFoundException } from "@nestjs/common";
import { redisClient } from "../redis/redis.provider";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger";

@Controller("rides")
@ApiTags("Real-time Location")
export class LocationController {
  @Get(":rideId/location")
  @ApiOperation({ summary: "Get driver location by ride ID" })
  @ApiParam({ name: "rideId", type: Number, example: 88 })
  @ApiResponse({
    status: 200,
    description: "Returns latest driver location",
    schema: {
      example: {
        driverId: 42,
        lat: 40.123,
        lng: 70.456,
      },
    },
  })
  @ApiResponse({ status: 404, description: "Location not found" })
  async getDriverLocation(@Param("rideId") rideId: number) {
    const raw = await redisClient.get(`ride:${rideId}:driverLocation`);
    if (!raw) throw new NotFoundException("Location not found");
    return JSON.parse(raw);
  }
}
