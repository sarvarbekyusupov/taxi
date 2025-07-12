import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtTokenService } from "../auth/jwt.service";
import { redisClient } from "../redis/redis.provider";
import { Logger, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { DriverService } from "../driver/driver.service";
import { UpdateLocationDto } from "../driver/dto/update-location.dto";
import { RoleGuard } from "../auth/role.guard";
import { Roles } from "../common/decorators/role.decorator";
import { WsRoleGuard } from "../auth/ws.role.guard";
import { WsAuthGuard } from "../auth/ws-auth.guard";
import { WsException } from "@nestjs/websockets";

// Configuration constants
const DRIVER_HEARTBEAT_INTERVAL = 10000; // 10 seconds
const DRIVER_HEARTBEAT_TIMEOUT = 30000; // 30 seconds
const LOCATION_UPDATE_RATE_LIMIT = 1000; // 1 second
const MAX_SEARCH_RADIUS = 50; // 50 km max search radius
const CLEANUP_INTERVAL = 60000; // 1 minute

// Interfaces
interface DriverLocation {
  driverId: string;
  lat: number;
  lng: number;
  timestamp: number;
}

interface AuthenticatedUser {
  userId: string;
  role: string;
}

interface ViewBounds {
  ne: { lat: number; lng: number };
  sw: { lat: number; lng: number };
}

type ValidRoles = "driver" | "client" | "admin" | "super_admin";

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["authorization", "role", "x-role"],
  },
  transports: ["websocket"],
})
export class LocationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LocationGateway.name);

  // Driver state management
  private driverUpdateTimestamps = new Map<string, number>();
  private driverHeartbeatTimers = new Map<string, NodeJS.Timeout>();
  private locationUpdateLimiter = new Map<string, number>();

  // Cleanup timer
  private cleanupTimer: NodeJS.Timeout;

  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly driverService: DriverService
  ) {}

  afterInit(server: Server) {
    this.logger.log("LocationGateway initialized");
    this.startCleanupTimer();
  }

  // === CONNECTION MANAGEMENT ===

  async handleConnection(client: Socket) {
    this.logger.log(`New connection attempt from client ${client.id}`);

    try {
      const user = await this.authenticateClient(client);
      if (!user) {
        return; // Authentication failed, client already disconnected
      }

      client.data.user = user;
      this.logger.log(`Client authenticated: ${user.userId} (${user.role})`);

      client.emit("auth:success", {
        message: "Successfully authenticated",
        userId: user.userId,
        role: user.role,
      });

      // Start heartbeat for drivers
      if (user.role === "driver") {
        await this.initializeDriver(client, user.userId);
      }
    } catch (error) {
      this.logger.error(`Connection failed: ${error.message}`);
      client.emit("auth:error", { message: "Authentication failed" });
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnecting: ${client.id}`);

    const user = client.data?.user as AuthenticatedUser;
    if (user?.role === "driver") {
      await this.cleanupDriver(user.userId);
    }
  }

  // === AUTHENTICATION ===

  private async authenticateClient(
    client: Socket
  ): Promise<AuthenticatedUser | null> {
    const { token, role } = this.extractAuthData(client);

    if (!token || !role) {
      this.logger.warn("Connection rejected: Missing token or role");
      client.emit("auth:error", {
        message: "Missing authentication credentials",
      });
      client.disconnect(true);
      return null;
    }

    const secretKey = this.getSecretKey(role);
    if (!secretKey) {
      this.logger.warn(`Connection rejected: Invalid role "${role}"`);
      client.emit("auth:error", {
        message: "Invalid role",
        validRoles: ["driver", "client", "admin", "super_admin"],
      });
      client.disconnect(true);
      return null;
    }

    try {
      const payload = await this.jwtTokenService.verifyAccessToken(
        token,
        secretKey
      );

      if (!payload.sub || !payload.role) {
        throw new Error("Invalid token payload: missing sub or role");
      }

      return {
        userId: payload.sub,
        role: payload.role,
      };
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      client.emit("auth:error", { message: "Invalid token" });
      client.disconnect(true);
      return null;
    }
  }

  private extractAuthData(client: Socket): {
    token: string | null;
    role: ValidRoles | null;
  } {
    const authHeader = client.handshake.headers?.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader || null;

    const role =
      ((client.handshake.headers?.role ||
        client.handshake.headers?.["x-role"]) as ValidRoles) || null;

    return { token, role };
  }

  private getSecretKey(role: ValidRoles): string | undefined {
    const secrets: Record<ValidRoles, string | undefined> = {
      driver: process.env.DRIVER_ACCESS_TOKEN_KEY,
      client: process.env.CLIENT_ACCESS_TOKEN_KEY,
      admin: process.env.ADMIN_ACCESS_TOKEN_KEY,
      super_admin: process.env.SUPER_ADMIN_ACCESS_TOKEN_KEY,
    };

    return secrets[role];
  }

  // === DRIVER MANAGEMENT ===

  private async initializeDriver(client: Socket, driverId: string) {
    try {
      // Set driver as online
      await this.setDriverStatus(driverId, "online");
      this.startHeartbeat(client);
      this.logger.log(`Driver ${driverId} initialized and online`);
    } catch (error) {
      this.logger.error(
        `Failed to initialize driver ${driverId}: ${error.message}`
      );
    }
  }

  private async cleanupDriver(driverId: string) {
    try {
      this.stopHeartbeat(driverId);
      await this.setDriverStatus(driverId, "offline");
      await this.removeDriverLocation(driverId);
      this.locationUpdateLimiter.delete(driverId);
      this.logger.log(`Driver ${driverId} cleaned up`);
    } catch (error) {
      this.logger.error(
        `Failed to cleanup driver ${driverId}: ${error.message}`
      );
    }
  }

  // === HEARTBEAT SYSTEM ===

  private startHeartbeat(client: Socket) {
    const driverId = client.data?.user?.userId;
    if (!driverId) {
      this.logger.warn("Cannot start heartbeat: No driver ID found");
      return;
    }

    this.logger.debug(`Starting heartbeat for driver ${driverId}`);
    this.driverUpdateTimestamps.set(driverId, Date.now());

    const timer = setInterval(async () => {
      const lastHeartbeat = this.driverUpdateTimestamps.get(driverId);
      if (
        !lastHeartbeat ||
        Date.now() - lastHeartbeat > DRIVER_HEARTBEAT_TIMEOUT
      ) {
        this.logger.log(`Driver ${driverId} heartbeat timeout`);
        await this.handleDriverTimeout(driverId);
        this.stopHeartbeat(driverId);
        client.disconnect(true);
      }
    }, DRIVER_HEARTBEAT_INTERVAL);

    this.driverHeartbeatTimers.set(driverId, timer);
  }

  private stopHeartbeat(driverId: string) {
    const timer = this.driverHeartbeatTimers.get(driverId);
    if (timer) {
      clearInterval(timer);
      this.driverHeartbeatTimers.delete(driverId);
      this.driverUpdateTimestamps.delete(driverId);
      this.logger.debug(`Stopped heartbeat for driver ${driverId}`);
    }
  }

  private async handleDriverTimeout(driverId: string) {
    try {
      await this.setDriverStatus(driverId, "offline");
      this.server.emit("driver:status:update", {
        driverId,
        status: "offline",
        reason: "timeout",
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle driver timeout ${driverId}: ${error.message}`
      );
    }
  }

  // === WEBSOCKET MESSAGE HANDLERS ===

  @UseGuards(WsAuthGuard, WsRoleGuard)
  @Roles("driver")
  @SubscribeMessage("driver:heartbeat")
  handleDriverHeartbeat(@ConnectedSocket() client: Socket) {
    const user = client.data.user as AuthenticatedUser;
    if (user?.role === "driver") {
      this.driverUpdateTimestamps.set(user.userId, Date.now());
      this.logger.debug(`Heartbeat received from driver ${user.userId}`);
    }
  }

  @UseGuards(WsAuthGuard, WsRoleGuard)
  @Roles("driver")
  @SubscribeMessage("location:update")
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async handleLocationUpdate(
    @MessageBody() updateLocationDto: UpdateLocationDto,
    @ConnectedSocket() client: Socket
  ) {
    const user = client.data.user as AuthenticatedUser;
    const driverId = user.userId;

    try {
      // Validate driver ID consistency
      if (
        updateLocationDto.driverId &&
        updateLocationDto.driverId.toString() !== driverId
      ) {
        throw new WsException("Driver ID mismatch");
      }

      // Rate limiting
      if (!this.checkRateLimit(driverId)) {
        throw new WsException("Rate limit exceeded");
      }

      // Validate coordinates
      this.validateCoordinates(updateLocationDto.lat, updateLocationDto.lng);

      // Update location
      await this.updateDriverLocation(driverId, updateLocationDto);

      // Update heartbeat
      this.driverUpdateTimestamps.set(driverId, Date.now());

      // Broadcast update
      await this.broadcastLocationUpdate(driverId, updateLocationDto);

      return {
        success: true,
        message: "Location updated successfully",
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error(
        `Location update failed for driver ${driverId}: ${error.message}`
      );
      throw new WsException(error.message || "Location update failed");
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage("driver:subscribe")
  handleDriverSubscribe(
    @MessageBody() data: { driverId: string },
    @ConnectedSocket() client: Socket
  ) {
    if (!data.driverId) {
      throw new WsException("Driver ID is required");
    }

    const room = `driver:${data.driverId}`;
    client.join(room);
    this.logger.log(
      `Client ${client.id} subscribed to driver ${data.driverId}`
    );

    return { success: true, room };
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage("ride:subscribe")
  handleRideSubscribe(
    @MessageBody() data: { rideId: string },
    @ConnectedSocket() client: Socket
  ) {
    if (!data.rideId) {
      throw new WsException("Ride ID is required");
    }

    const user = client.data.user as AuthenticatedUser;
    const room = `ride:${data.rideId}`;
    client.join(room);

    this.logger.log(
      `User ${user.userId} (${user.role}) subscribed to ride ${data.rideId}`
    );
    return { success: true, room };
  }

  @UseGuards(WsAuthGuard, WsRoleGuard)
  @Roles("client")
  @SubscribeMessage("drivers:in-view")
  async handleDriversInView(
    @MessageBody() bounds: ViewBounds,
    @ConnectedSocket() client: Socket
  ) {
    try {
      this.validateBounds(bounds);
      const drivers = await this.getDriversInBounds(bounds);

      client.emit("drivers:in-view:response", {
        drivers,
        count: drivers.length,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error(`Failed to get drivers in view: ${error.message}`);
      throw new WsException("Failed to retrieve drivers in view");
    }
  }

  @UseGuards(WsAuthGuard, WsRoleGuard)
  @Roles("admin", "super_admin")
  @SubscribeMessage("drivers:all")
  async handleAllDriversRequest(@ConnectedSocket() client: Socket) {
    try {
      const drivers = await this.getAllDriverLocations();

      client.emit("drivers:all:response", {
        drivers,
        count: drivers.length,
        timestamp: Date.now(),
      });

      this.logger.log(`Sent ${drivers.length} driver locations to admin`);
    } catch (error) {
      this.logger.error(`Failed to get all drivers: ${error.message}`);
      throw new WsException("Failed to retrieve all drivers");
    }
  }

  @UseGuards(WsAuthGuard, WsRoleGuard)
  @Roles("driver")
  @SubscribeMessage("driver:go-offline")
  async handleDriverGoOffline(@ConnectedSocket() client: Socket) {
    const user = client.data.user as AuthenticatedUser;
    const driverId = user.userId;

    try {
      await this.setDriverStatus(driverId, "offline");
      await this.removeDriverLocation(driverId);
      this.stopHeartbeat(driverId);

      client.emit("driver:status:update", {
        status: "offline",
        reason: "manual",
      });

      this.server.emit("driver:status:update", {
        driverId,
        status: "offline",
        reason: "manual",
      });

      this.logger.log(`Driver ${driverId} manually went offline`);
      return { success: true, status: "offline" };
    } catch (error) {
      this.logger.error(`Failed to set driver offline: ${error.message}`);
      throw new WsException("Failed to go offline");
    }
  }

  // === UTILITY METHODS ===

  private checkRateLimit(driverId: string): boolean {
    const now = Date.now();
    const lastUpdate = this.locationUpdateLimiter.get(driverId);

    if (lastUpdate && now - lastUpdate < LOCATION_UPDATE_RATE_LIMIT) {
      return false;
    }

    this.locationUpdateLimiter.set(driverId, now);
    return true;
  }

  private validateCoordinates(lat: number, lng: number) {
    if (lat < -90 || lat > 90) {
      throw new Error("Invalid latitude: must be between -90 and 90");
    }
    if (lng < -180 || lng > 180) {
      throw new Error("Invalid longitude: must be between -180 and 180");
    }
  }

  private validateBounds(bounds: ViewBounds) {
    if (!bounds.ne || !bounds.sw) {
      throw new Error("Invalid bounds: missing ne or sw");
    }

    if (bounds.ne.lat <= bounds.sw.lat || bounds.ne.lng <= bounds.sw.lng) {
      throw new Error("Invalid bounds: ne must be greater than sw");
    }

    const distance = this.calculateDistance(bounds.ne, bounds.sw);
    if (distance > MAX_SEARCH_RADIUS) {
      throw new Error(
        `Search area too large: ${distance}km > ${MAX_SEARCH_RADIUS}km`
      );
    }
  }

  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.lat * Math.PI) / 180) *
        Math.cos((point2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // === REDIS OPERATIONS ===

  private async updateDriverLocation(
    driverId: string,
    location: UpdateLocationDto
  ) {
    const pipeline = redisClient.multi();

    try {
      // Update database
      await this.driverService.updateLocation(
        parseInt(driverId),
        location.lat,
        location.lng
      );

      // Update Redis geospatial data
      pipeline.geoAdd("drivers:location", {
        longitude: location.lng,
        latitude: location.lat,
        member: driverId,
      });

      // Store detailed location data
      pipeline.set(
        `driver:${driverId}:location`,
        JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          timestamp: Date.now(),
          rideId: location.rideId || null,
        }),
        { EX: 3600 } // 1 hour expiration
      );

      // Update status
      pipeline.set(`driver:${driverId}:status`, "online", { EX: 3600 });

      await pipeline.exec();
    } catch (error) {
      this.logger.error(`Failed to update driver location: ${error.message}`);
      throw new Error("Location update failed");
    }
  }

  private async broadcastLocationUpdate(
    driverId: string,
    location: UpdateLocationDto
  ) {
    const payload = {
      driverId,
      lat: location.lat,
      lng: location.lng,
      timestamp: Date.now(),
    };

    // Broadcast to driver subscribers
    this.server
      .to(`driver:${driverId}`)
      .emit("driver:location:update", payload);

    // Broadcast to ride subscribers if rideId is present
    if (location.rideId) {
      this.server
        .to(`ride:${location.rideId}`)
        .emit("driver:location:update", payload);
    }
  }

  private async getDriversInBounds(
    bounds: ViewBounds
  ): Promise<DriverLocation[]> {
    const center = {
      latitude: (bounds.ne.lat + bounds.sw.lat) / 2,
      longitude: (bounds.ne.lng + bounds.sw.lng) / 2,
    };

    const radius = this.calculateDistance(bounds.ne, bounds.sw) / 2;

    try {
      // Use geoSearch without WITHCOORD to avoid type issues
      const driverIds = await redisClient.geoSearch(
        "drivers:location",
        {
          longitude: center.longitude,
          latitude: center.latitude,
        },
        {
          radius: radius,
          unit: "km",
        }
      );

      return await this.getDriverLocationDetails(driverIds as string[]);
    } catch (error) {
      this.logger.error(`Failed to search drivers in bounds: ${error.message}`);
      throw new Error("Failed to search drivers");
    }
  }

  private async getAllDriverLocations(): Promise<DriverLocation[]> {
    try {
      const driverIds = (await redisClient.zRange(
        "drivers:location",
        0,
        -1
      )) as string[];
      return await this.getDriverLocationDetails(driverIds);
    } catch (error) {
      this.logger.error(`Failed to get all driver locations: ${error.message}`);
      throw new Error("Failed to get all drivers");
    }
  }

  private async getDriverLocationDetails(
    driverIds: string[]
  ): Promise<DriverLocation[]> {
    if (driverIds.length === 0) return [];

    const pipeline = redisClient.multi();
    driverIds.forEach((driverId) => {
      pipeline.get(`driver:${driverId}:location`);
    });

    const results = await pipeline.exec();
    const drivers: DriverLocation[] = [];

    if (results) {
      results.forEach((result, index) => {
        if (result && result[1]) {
          try {
            const locationData = JSON.parse(result[1] as string);
            drivers.push({
              driverId: driverIds[index],
              lat: locationData.lat,
              lng: locationData.lng,
              timestamp: locationData.timestamp,
            });
          } catch (error) {
            this.logger.warn(
              `Invalid location data for driver ${driverIds[index]}`
            );
          }
        }
      });
    }

    return drivers;
  }

  private async setDriverStatus(
    driverId: string,
    status: "online" | "offline"
  ) {
    try {
      await redisClient.set(`driver:${driverId}:status`, status, { EX: 3600 });
      await redisClient.set(
        `driver:${driverId}:lastSeen`,
        Date.now().toString(),
        { EX: 86400 }
      ); // 24 hours
    } catch (error) {
      this.logger.error(`Failed to set driver status: ${error.message}`);
      throw new Error("Failed to update driver status");
    }
  }

  private async removeDriverLocation(driverId: string) {
    try {
      const pipeline = redisClient.multi();
      pipeline.zRem("drivers:location", driverId);
      pipeline.del(`driver:${driverId}:location`);
      await pipeline.exec();
    } catch (error) {
      this.logger.error(`Failed to remove driver location: ${error.message}`);
    }
  }

  // === CLEANUP ===

  private startCleanupTimer() {
    this.cleanupTimer = setInterval(async () => {
      await this.cleanupStaleData();
    }, CLEANUP_INTERVAL);
  }

  private async cleanupStaleData() {
    try {
      const cutoffTime = Date.now() - DRIVER_HEARTBEAT_TIMEOUT;

      // Clean up rate limiter
      for (const [
        driverId,
        timestamp,
      ] of this.locationUpdateLimiter.entries()) {
        if (timestamp < cutoffTime) {
          this.locationUpdateLimiter.delete(driverId);
        }
      }

      this.logger.debug("Cleanup completed");
    } catch (error) {
      this.logger.error(`Cleanup failed: ${error.message}`);
    }
  }

  // === LIFECYCLE ===

  onModuleDestroy() {
    // Clean up all timers
    this.driverHeartbeatTimers.forEach((timer) => clearInterval(timer));
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.logger.log("LocationGateway destroyed");
  }
}
