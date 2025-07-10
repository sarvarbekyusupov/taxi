import { Controller, Get, Param, NotFoundException, Query } from "@nestjs/common";
import { redisClient } from "../redis/redis.provider";
import { RedisKeys } from "../constants/redis.keys";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";

@Controller("location")
@ApiTags("Location")
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

  @Get("drivers/online")
  @ApiOperation({ summary: "Get all online drivers' locations" })
  @ApiResponse({
    status: 200,
    description: "Returns a list of all online drivers with their latest locations",
    schema: {
      example: [
        { driverId: 1, lat: 40.123, lng: 70.456 },
        { driverId: 2, lat: 40.789, lng: 70.987 },
      ],
    },
  })
  async getAllOnlineDriversLocation() {
    const onlineDrivers: { driverId: string; lat: number; lng: number }[] = [];
    const driverStatusKeys = await redisClient.keys(RedisKeys.allDriverStatusKeys());

    for (const key of driverStatusKeys) {
      const status = await redisClient.get(key);
      if (status === "online") {
        const driverId = key.split(":")[1];
        const location = await redisClient.get(RedisKeys.driverLocation(driverId));
        if (location) {
          onlineDrivers.push({ driverId, ...JSON.parse(location) });
        }
      }
    }
    return onlineDrivers;
  }

  @Get("drivers/nearby")
  @ApiOperation({ summary: "Find available drivers near a specified location" })
  @ApiQuery({ name: "lat", type: Number, description: "Latitude of the center point" })
  @ApiQuery({ name: "lng", type: Number, description: "Longitude of the center point" })
  @ApiQuery({ name: "radius", type: Number, description: "Search radius in kilometers", example: 5 })
  @ApiResponse({
    status: 200,
    description: "Returns a list of drivers within the specified radius",
    schema: {
      example: [
        { driverId: 1, lat: 40.123, lng: 70.456 },
        { driverId: 2, lat: 40.789, lng: 70.987 },
      ],
    },
  })
  async getNearbyDrivers(
    @Query("lat") lat: number,
    @Query("lng") lng: number,
    @Query("radius") radius: number,
  ) {
    const driverIds = (await redisClient.geoSearch(
      "drivers:location",
      {
        longitude: lng,
        latitude: lat,
      },
      {
        radius: radius,
        unit: "km",
      }
    )) as string[];

    const nearbyDrivers: { driverId: string; lat: number; lng: number }[] = [];
    for (const driverId of driverIds) {
      const status = await redisClient.get(RedisKeys.driverStatus(driverId));
      if (status === "online") {
        const location = await redisClient.get(RedisKeys.driverLocation(driverId));
        if (location) {
          nearbyDrivers.push({ driverId, ...JSON.parse(location) });
        }
      }
    }
    return nearbyDrivers;
  }

  @Get("autocomplete")
  @ApiOperation({ summary: "Get location suggestions based on a search query" })
  @ApiQuery({ name: "query", type: String, description: "Search query for location autocomplete", example: "Tashkent" })
  @ApiResponse({
    status: 200,
    description: "Returns a list of location suggestions",
    schema: {
      example: [
        { description: "Tashkent, Uzbekistan", lat: 41.2995, lng: 69.2401 },
        { description: "Tashkent City, Uzbekistan", lat: 41.3111, lng: 69.2797 },
      ],
    },
  })
  async getAutocompleteSuggestions(@Query("query") query: string) {
    // In a real application, this would integrate with a geocoding service (e.g., Google Places API)
    // For now, returning mock data.
    const suggestions = [
      { description: `${query}, Uzbekistan`, lat: 41.2995, lng: 69.2401 },
      { description: `${query} City, Uzbekistan`, lat: 41.3111, lng: 69.2797 },
      { description: `Old ${query}, Uzbekistan`, lat: 41.2800, lng: 69.2200 },
    ];
    return suggestions.filter(s => s.description.toLowerCase().includes(query.toLowerCase()));
  }
}
