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
import { forwardRef, Inject, Logger, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { DriverService } from "../driver/driver.service";
import { UpdateLocationDto } from "../driver/dto/update-location.dto";
import { Roles } from "../common/decorators/role.decorator";
import { WsRoleGuard } from "../auth/ws.role.guard";
import { WsAuthGuard } from "../auth/ws-auth.guard";
import { WsException } from "@nestjs/websockets";
import { getSocketInstance, setSocketInstance } from "../socket/socket.provider";
import { RidesService } from "../rides/rides.service";
// import { RidesService } from "../rides/rides.service";
// --- Interfaces ---
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

interface OrderNotification {
  orderId: string;
  clientId: string;
  pickupLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  dropoffLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  fare: number;
  distance: number;
  estimatedDuration: number;
  timestamp: number;
  expiresAt: number; // Buyurtma qachon tugaydi
}

interface OrderResponse {
  orderId: string;
  driverId: string;
  response: "accept" | "decline";
  timestamp: number;
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

  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly driverService: DriverService,
    private readonly ridesService: RidesService
  ) {}

  afterInit(server: Server) {
    console.log("🚀 [LOCATION GATEWAY] LocationGateway afterInit called", {
      serverExists: !!server,
      serverType: server?.constructor?.name,
      timestamp: new Date().toISOString(),
    });

    // ✅ CRITICAL: Set the server instance IMMEDIATELY
    setSocketInstance(server);

    // ✅ VERIFY the instance was set correctly
    setTimeout(() => {
      const verifyInstance = getSocketInstance();
      console.log("🔍 [LOCATION GATEWAY] Delayed verification check:", {
        instanceExists: !!verifyInstance,
        sameInstance: verifyInstance === server,
        timestamp: new Date().toISOString(),
      });
    }, 1000); // Check after 1 second

    this.logger.log(
      "✅ LocationGateway initialized and socket instance shared"
    );
  }

  async handleConnection(client: Socket) {
    this.logger.log(
      `--- handleConnection: New client trying to connect: ${client.id}`
    );

    try {
      const user = await this.authenticateClient(client);
      if (!user) {
        return;
      }

      client.data.user = user;
      this.logger.log(`Client authenticated: ${user.userId} (${user.role})`);

      // ✅ FIXED: Ensure driver joins their room for ride requests
      if (user.role === "driver") {
        const driverRoom = `driver:${user.userId}`;
        client.join(driverRoom);
        await this.initializeDriver(user.userId);

        this.logger.log(`Driver ${user.userId} joined room: ${driverRoom}`);
      }

      client.emit("auth:success", {
        message: "Successfully authenticated",
        userId: user.userId,
        role: user.role,
      });
    } catch (error) {
      this.logger.error(`Connection failed: ${error.message}`);
      client.emit("auth:error", { message: "Authentication failed" });
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnecting: ${client.id}`);

    const user = client.data?.user as AuthenticatedUser;
    if (user?.role === "driver" && user.userId) {
      await this.cleanupDriver(user.userId);
    }
  }

  // === AUTHENTICATION ===

  // Add this debug logging to your authenticateClient method in LocationGateway:

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

      // 🔍 ADD THIS DEBUG LOGGING
      console.log(
        "[DEBUG] LocationGateway JWT Payload:",
        JSON.stringify(payload, null, 2)
      );
      console.log("[DEBUG] payload.sub:", payload.sub, typeof payload.sub);
      console.log("[DEBUG] payload.id:", payload.id, typeof payload.id);
      console.log("[DEBUG] payload.role:", payload.role, typeof payload.role);

      if (!payload.sub || !payload.role) {
        throw new Error("Invalid token payload: missing sub or role");
      }

      // 🔍 ENSURE IT'S A STRING
      const userId = payload.sub.toString();
      console.log("[DEBUG] Final userId:", userId, typeof userId);

      return {
        userId: userId,
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

    // 🔍 DETAILED DEBUG
    console.log("=== WEBSOCKET CONNECTION DEBUG ===");
    console.log(
      "[DEBUG] All headers:",
      JSON.stringify(client.handshake.headers, null, 2)
    );
    console.log("[DEBUG] Raw auth header:", authHeader);
    console.log(
      "[DEBUG] Extracted token (first 50 chars):",
      token?.substring(0, 50) + "..."
    );
    console.log("[DEBUG] Full token length:", token?.length);
    console.log("[DEBUG] Role header:", role);

    // Compare tokens
    const correctTokenStart =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywicGhvbmVfbnVtYmVy";
    console.log(
      "[DEBUG] Token starts with correct sequence?",
      token?.startsWith(correctTokenStart)
    );
    console.log("==========================================");

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

  private async initializeDriver(driverId: string) {
    try {
      // ✅ Set driver as online with explicit string value
      await this.setDriverStatus(driverId, "online");

      // Add default location for testing
      await redisClient.geoAdd("drivers:geo", {
        longitude: 69.240562,
        latitude: 41.311081,
        member: driverId.toString(),
      });

      // Store detailed location data
      const locationData = {
        lat: 41.311081,
        lng: 69.240562,
        timestamp: Date.now(),
        rideId: null,
      };

      await redisClient.set(
        `driver:${driverId}:location`,
        JSON.stringify(locationData),
        { EX: 3600 }
      );

      this.logger.log(
        `Driver ${driverId} connected, is online, and location set.`
      );

      // Verify the location was added
      const verification = await redisClient.geoPos("drivers:geo", driverId);
      console.log(
        `[DEBUG] Driver ${driverId} location verification:`,
        verification
      );

      // ✅ VERIFY STATUS AFTER INITIALIZATION
      const statusCheck = await redisClient.get(`driver:${driverId}:status`);
      console.log(
        `[DEBUG] Driver ${driverId} final status check: "${statusCheck}"`
      );
    } catch (error) {
      this.logger.error(
        `Failed to initialize driver ${driverId}: ${error.message}`
      );
    }
  }

  private async cleanupDriver(driverId: string) {
    try {
      // On disconnect, set driver to offline and remove location
      await this.setDriverStatus(driverId, "offline");
      await this.removeDriverLocation(driverId);
      this.logger.log(`Driver ${driverId} disconnected and cleaned up.`);
    } catch (error) {
      this.logger.error(
        `Failed to cleanup driver ${driverId}: ${error.message}`
      );
    }
  }

  // === WEBSOCKET MESSAGE HANDLERS ===

  @UseGuards(WsAuthGuard, WsRoleGuard)
  @Roles("driver")
  @SubscribeMessage("location:update")
  // @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async handleLocationUpdate(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket
  ) {
    let dtoObject: any;

    // 1. Check if the data is a string and parse it
    if (typeof data === "string") {
      try {
        dtoObject = JSON.parse(data);
      } catch (error) {
        throw new WsException("Invalid JSON format.");
      }
    } else {
      dtoObject = data;
    }

    // 2. Handle the array case
    const finalDto = Array.isArray(dtoObject) ? dtoObject[0] : dtoObject;

    // 3. Manually validate the final object
    const updateLocationDto = new UpdateLocationDto();
    updateLocationDto.lat = finalDto.lat;
    updateLocationDto.lng = finalDto.lng;
    updateLocationDto.rideId = finalDto.rideId;
    updateLocationDto.driverId = finalDto.driverId;

    //  const errors = await this.validator.validate(updateLocationDto);
    //  if (errors.length > 0) {
    //    this.logger.warn("Validation failed for location update", errors);
    //    throw new WsException("Invalid location data provided.");
    //  }

    this.logger.log(
      `--- Received and processed "location:update" event with data:`,
      updateLocationDto
    );

    const user = client.data.user as AuthenticatedUser;
    const driverId = user.userId;

    try {
      await this.updateDriverLocation(driverId, updateLocationDto);
      await this.broadcastLocationUpdate(driverId, updateLocationDto);
      return { success: true, message: "Location updated" };
    } catch (error) {
      this.logger.error(
        `Location update failed for driver ${driverId}: ${error.message}`
      );
      throw new WsException(error.message || "Location update failed");
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

      const payload = { driverId, status: "offline", reason: "manual" };
      client.emit("driver:status:update", payload); // Acknowledge to self
      this.server.emit("driver:status:update", payload); // Broadcast to others

      this.logger.log(`Driver ${driverId} manually went offline.`);
      return { success: true, status: "offline" };
    } catch (error) {
      this.logger.error(`Failed to set driver offline: ${error.message}`);
      throw new WsException("Failed to go offline");
    }
  }

  // Other subscription handlers...

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

  // === UTILITY & REDIS METHODS ===

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
    this.validateCoordinates(bounds.ne.lat, bounds.ne.lng);
    this.validateCoordinates(bounds.sw.lat, bounds.sw.lng);
  }

  // private async updateDriverLocation(
  //   driverId: string,
  //   location: UpdateLocationDto
  // ) {
  //   try {
  //     // Update Redis geospatial data
  //     await redisClient.geoAdd("drivers:location", {
  //       longitude: location.lng,
  //       latitude: location.lat,
  //       member: driverId,
  //     });

  //     // Store detailed location data
  //     await redisClient.set(
  //       `driver:${driverId}:location`,
  //       JSON.stringify({
  //         lat: location.lat,
  //         lng: location.lng,
  //         timestamp: Date.now(),
  //         rideId: location.rideId || null,
  //       }),
  //       { EX: 3600 } // 1 hour expiration
  //     );
  //   } catch (error) {
  //     this.logger.error(`Failed to update driver location: ${error.message}`);
  //     throw new Error("Location update failed in Redis");
  //   }
  // }

  // In LocationGateway

  private async updateDriverLocation(
    driverId: string,
    location: UpdateLocationDto
  ) {
    try {
      console.log(
        `[DEBUG] 1. Entering updateDriverLocation for driver: ${driverId}`
      );
      console.log(`[DEBUG] Location data:`, {
        lat: location.lat,
        lng: location.lng,
        driverId,
      });

      // Check Redis connection status
      if (!redisClient.isReady) {
        console.error("❌ Redis client is not ready!");
        throw new Error("Redis client is not connected");
      }

      // Validate coordinates before Redis operation
      this.validateCoordinates(location.lat, location.lng);

      // FIXED: Change from "drivers:location" to "drivers:geo" to match search service
      console.log(`[DEBUG] About to call geoAdd with:`, {
        key: "drivers:geo",
        longitude: Number(location.lng),
        latitude: Number(location.lat),
        member: driverId.toString(),
      });

      const geoAddResult = await redisClient.geoAdd("drivers:geo", {
        longitude: Number(location.lng),
        latitude: Number(location.lat),
        member: driverId.toString(),
      });

      console.log(
        `[DEBUG] 2. Successfully executed geoAdd for driver: ${driverId}, result: ${geoAddResult}`
      );

      // Store detailed location data
      const locationData = {
        lat: location.lat,
        lng: location.lng,
        timestamp: Date.now(),
        rideId: location.rideId || null,
      };

      console.log(`[DEBUG] About to call set with:`, {
        key: `driver:${driverId}:location`,
        data: locationData,
      });

      const setResult = await redisClient.set(
        `driver:${driverId}:location`,
        JSON.stringify(locationData),
        { EX: 3600 } // 1 hour expiration
      );

      console.log(
        `[DEBUG] 3. Successfully executed set for driver: ${driverId}, result: ${setResult}`
      );

      // Verify the data was written
      const verification = await redisClient.get(`driver:${driverId}:location`);
      console.log(`[DEBUG] 4. Verification read result:`, verification);

    } catch (error) {
      this.logger.error(
        `[DEBUG] FAILED to update driver location for driver ${driverId}: ${error.message}`
      );
      console.error(`[DEBUG] Full error:`, error);
      throw new Error("Location update failed in Redis");
    }
  }

  private async getDriversInBounds(
    bounds: ViewBounds
  ): Promise<DriverLocation[]> {
    try {
      // FIXED: Change from "drivers:location" to "drivers:geo"
      const driverIds = await redisClient.geoRadius(
        "drivers:geo",
        {
          longitude: (bounds.ne.lng + bounds.sw.lng) / 2,
          latitude: (bounds.ne.lat + bounds.sw.lat) / 2,
        },
        this.calculateDistance(bounds.ne, bounds.sw),
        "km"
      );

      return await this.getDriverLocationDetails(driverIds as string[]);
    } catch (error) {
      this.logger.error(`Failed to search drivers in bounds: ${error.message}`);
      throw new Error("Failed to search drivers");
    }
  }

  private async removeDriverLocation(driverId: string) {
    try {
      const pipeline = redisClient.multi();
      // FIXED: Change from "drivers:location" to "drivers:geo"
      pipeline.zRem("drivers:geo", driverId);
      pipeline.del(`driver:${driverId}:location`);
      await pipeline.exec();
    } catch (error) {
      this.logger.error(`Failed to remove driver location: ${error.message}`);
    }
  }

  private async broadcastLocationUpdate(
    driverId: string,
    location: UpdateLocationDto
  ) {
    const payload: DriverLocation = {
      driverId,
      lat: location.lat,
      lng: location.lng,
      timestamp: Date.now(),
    };

    // Broadcast to anyone subscribed to this driver's specific room
    this.server
      .to(`driver:${driverId}`)
      .emit("driver:location:update", payload);

    // If the driver is on a ride, broadcast to the ride room as well
    if (location.rideId) {
      this.server
        .to(`ride:${location.rideId}`)
        .emit("driver:location:update", payload);
    }
  }

  // private async getDriversInBounds(
  //   bounds: ViewBounds
  // ): Promise<DriverLocation[]> {
  //   try {
  //     const driverIds = await redisClient.geoRadius(
  //       "drivers:location",
  //       {
  //         longitude: (bounds.ne.lng + bounds.sw.lng) / 2,
  //         latitude: (bounds.ne.lat + bounds.sw.lat) / 2,
  //       },
  //       this.calculateDistance(bounds.ne, bounds.sw),
  //       "km"
  //     );

  //     return await this.getDriverLocationDetails(driverIds as string[]);
  //   } catch (error) {
  //     this.logger.error(`Failed to search drivers in bounds: ${error.message}`);
  //     throw new Error("Failed to search drivers");
  //   }
  // }

  private async getDriverLocationDetails(
    driverIds: string[]
  ): Promise<DriverLocation[]> {
    if (driverIds.length === 0) return [];

    const results = await redisClient.mGet(
      driverIds.map((id) => `driver:${id}:location`)
    );

    return results
      .map((result, index) => {
        if (result) {
          return JSON.parse(result) as DriverLocation;
        }
        return null;
      })
      .filter((loc) => loc !== null);
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

  private async setDriverStatus(
    driverId: string,
    status: "online" | "offline"
  ) {
    try {
      // ✅ FIXED: Ensure we store the exact string value
      console.log(`[DEBUG] Setting driver ${driverId} status to: "${status}"`);

      await redisClient.set(`driver:${driverId}:status`, status, { EX: 86400 });

      // Verify the status was set correctly
      const verifyStatus = await redisClient.get(`driver:${driverId}:status`);
      console.log(
        `[DEBUG] Verified driver ${driverId} status is now: "${verifyStatus}"`
      );
    } catch (error) {
      this.logger.error(`Failed to set driver status: ${error.message}`);
      throw new Error("Failed to update driver status in Redis");
    }
  }
  // private async removeDriverLocation(driverId: string) {
  //   try {
  //     const pipeline = redisClient.multi();
  //     pipeline.zRem("drivers:location", driverId);
  //     pipeline.del(`driver:${driverId}:location`);
  //     await pipeline.exec();
  //   } catch (error) {
  //     this.logger.error(`Failed to remove driver location: ${error.message}`);
  //   }
  // }

  @SubscribeMessage("test:ping")
  handleTestPing(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    this.logger.log("--- PING-PONG! Test event received! ---", data);

    // Send a response directly back to the client that sent the message
    client.emit("test:pong", {
      message: "Hello from the server!",
      userId: client.data.user.userId,
    });
  }

  // === BUYURTMA MANAGEMENT ===

  /**
   * Drayver buyurtmalarni tinglashni boshlaydi
   */
  @UseGuards(WsAuthGuard, WsRoleGuard)
  @Roles("driver")
  @SubscribeMessage("driver:listen-orders")
  async handleDriverListenOrders(@ConnectedSocket() client: Socket) {
    const user = client.data.user as AuthenticatedUser;
    const driverId = user.userId;

    try {
      // Drayver "orders" room'iga qo'shiladi
      const orderRoom = `orders:available`;
      client.join(orderRoom);

      // Drayver-specific room ham yaratamiz
      const driverOrderRoom = `driver:${driverId}:orders`;
      client.join(driverOrderRoom);

      this.logger.log(`Driver ${driverId} started listening for orders`);

      return {
        success: true,
        message: "Now listening for orders",
        rooms: [orderRoom, driverOrderRoom],
      };
    } catch (error) {
      this.logger.error(`Failed to start listening orders: ${error.message}`);
      throw new WsException("Failed to start listening for orders");
    }
  }

  /**
   * Drayver buyurtmalarni tinglashni to'xtatadi
   */
  @UseGuards(WsAuthGuard, WsRoleGuard)
  @Roles("driver")
  @SubscribeMessage("driver:stop-listening-orders")
  async handleDriverStopListeningOrders(@ConnectedSocket() client: Socket) {
    const user = client.data.user as AuthenticatedUser;
    const driverId = user.userId;

    try {
      // Room'lardan chiqib ketadi
      client.leave(`orders:available`);
      client.leave(`driver:${driverId}:orders`);

      this.logger.log(`Driver ${driverId} stopped listening for orders`);

      return {
        success: true,
        message: "Stopped listening for orders",
      };
    } catch (error) {
      this.logger.error(`Failed to stop listening orders: ${error.message}`);
      throw new WsException("Failed to stop listening for orders");
    }
  }

  /**
   * Drayver buyurtmani qabul qiladi yoki rad etadi
   */
  @UseGuards(WsAuthGuard, WsRoleGuard)
  @Roles("driver")
  @SubscribeMessage("driver:respond-order")
  async handleDriverRespondOrder(
    @MessageBody() data: { orderId: string; response: "accept" | "decline" },
    @ConnectedSocket() client: Socket
  ) {
    const user = client.data.user as AuthenticatedUser;
    const driverId = user.userId;

    if (!data.orderId || !data.response) {
      throw new WsException("Order ID and response are required");
    }

    if (!["accept", "decline"].includes(data.response)) {
      throw new WsException("Response must be 'accept' or 'decline'");
    }

    try {
      const orderResponse: OrderResponse = {
        orderId: data.orderId,
        driverId,
        response: data.response,
        timestamp: Date.now(),
      };

      // Redis'da javobni saqlash
      await redisClient.set(
        `order:${data.orderId}:response:${driverId}`,
        JSON.stringify(orderResponse),
        { EX: 300 } // 5 daqiqa
      );

      // Admin/dispatcher'larga javob jo'natish
      this.server
        .to(`order:${data.orderId}`)
        .emit("order:driver-response", orderResponse);

      // Client'ga ham xabar berish (agar qabul qilgan bo'lsa)
      if (data.response === "accept") {
        this.server
          .to(`order:${data.orderId}:client`)
          .emit("order:driver-found", {
            orderId: data.orderId,
            driverId,
            timestamp: Date.now(),
          });
      }

      this.logger.log(
        `Driver ${driverId} ${data.response}ed order ${data.orderId}`
      );

      return {
        success: true,
        message: `Order ${data.response}ed successfully`,
        orderId: data.orderId,
      };
    } catch (error) {
      this.logger.error(`Failed to respond to order: ${error.message}`);
      throw new WsException("Failed to respond to order");
    }
  }

  /**
   * Admin/Dispatcher tomonidan yangi buyurtma yuborish
   */
  @UseGuards(WsAuthGuard, WsRoleGuard)
  @Roles("admin", "super_admin")
  @SubscribeMessage("admin:broadcast-order")
  async handleBroadcastOrder(
    @MessageBody()
    orderData: Omit<OrderNotification, "timestamp" | "expiresAt">,
    @ConnectedSocket() client: Socket
  ) {
    const user = client.data.user as AuthenticatedUser;

    try {
      const orderNotification: OrderNotification = {
        ...orderData,
        timestamp: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 daqiqa
      };

      // Redis'da buyurtmani saqlash
      await redisClient.set(
        `order:${orderData.orderId}:details`,
        JSON.stringify(orderNotification),
        { EX: 600 } // 10 daqiqa
      );

      // Barcha online drayverlarga yuborish
      this.server.to("orders:available").emit("new:order", orderNotification);

      // Admin'lar uchun alohida room
      const adminRoom = `order:${orderData.orderId}`;
      client.join(adminRoom);

      this.logger.log(
        `Admin ${user.userId} broadcasted order ${orderData.orderId} to all available drivers`
      );

      return {
        success: true,
        message: "Order broadcasted to available drivers",
        orderId: orderData.orderId,
        expiresAt: orderNotification.expiresAt,
      };
    } catch (error) {
      this.logger.error(`Failed to broadcast order: ${error.message}`);
      throw new WsException("Failed to broadcast order");
    }
  }

  /**
   * Client buyurtma room'iga qo'shiladi
   */
  @UseGuards(WsAuthGuard, WsRoleGuard)
  @Roles("client")
  @SubscribeMessage("client:subscribe-order")
  async handleClientSubscribeOrder(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: Socket
  ) {
    if (!data.orderId) {
      throw new WsException("Order ID is required");
    }

    const user = client.data.user as AuthenticatedUser;
    const clientOrderRoom = `order:${data.orderId}:client`;

    client.join(clientOrderRoom);

    this.logger.log(
      `Client ${user.userId} subscribed to order ${data.orderId} updates`
    );

    return {
      success: true,
      room: clientOrderRoom,
      orderId: data.orderId,
    };
  }

  /**
   * Buyurtma bekor qilish
   */
  @UseGuards(WsAuthGuard, WsRoleGuard)
  @Roles("client", "admin", "super_admin")
  @SubscribeMessage("order:cancel")
  async handleCancelOrder(
    @MessageBody() data: { orderId: string; reason?: string },
    @ConnectedSocket() client: Socket
  ) {
    const user = client.data.user as AuthenticatedUser;

    if (!data.orderId) {
      throw new WsException("Order ID is required");
    }

    try {
      const cancelData = {
        orderId: data.orderId,
        cancelledBy: user.userId,
        reason: data.reason || "No reason provided",
        timestamp: Date.now(),
      };

      // Redis'da bekor qilish ma'lumotini saqlash
      await redisClient.set(
        `order:${data.orderId}:cancelled`,
        JSON.stringify(cancelData),
        { EX: 3600 } // 1 soat
      );

      // Barcha tegishli room'larga xabar berish
      this.server
        .to(`order:${data.orderId}`)
        .emit("order:cancelled", cancelData);
      this.server
        .to(`order:${data.orderId}:client`)
        .emit("order:cancelled", cancelData);
      this.server.to("orders:available").emit("order:cancelled", cancelData);

      this.logger.log(
        `Order ${data.orderId} cancelled by ${user.userId} (${user.role})`
      );

      return {
        success: true,
        message: "Order cancelled successfully",
        orderId: data.orderId,
      };
    } catch (error) {
      this.logger.error(`Failed to cancel order: ${error.message}`);
      throw new WsException("Failed to cancel order");
    }
  }

  // === UTILITY METHODS ===

  /**
   * Online drayverlar ro'yxatini olish
   */
  // private async getOnlineDrivers(): Promise<string[]> {
  //   try {
  //     const driverKeys = await redisClient.keys("driver:*:status");
  //     const drivers = [];

  //     for (const key of driverKeys) {
  //       const status = await redisClient.get(key);
  //       if (status === "online") {
  //         const driverId = key.split(":")[1]; // "driver:123:status" -> "123"
  //         drivers.push(driverId);
  //       }
  //     }

  //     return drivers;
  //   } catch (error) {
  //     this.logger.error(`Failed to get online drivers: ${error.message}`);
  //     return [];
  //   }
  // }
  private async getOnlineDrivers(): Promise<string[]> {
    try {
      const driverKeys = await redisClient.keys("driver:*:status");
      // ✅ Explicitly type the array as an array of strings
      const drivers: string[] = [];

      for (const key of driverKeys) {
        const status = await redisClient.get(key);
        if (status === "online") {
          const driverId = key.split(":")[1];
          drivers.push(driverId); // This is now valid
        }
      }

      return drivers;
    } catch (error) {
      this.logger.error(`Failed to get online drivers: ${error.message}`);
      return [];
    }
  }

  /**
   * Buyurtma ma'lumotlarini olish
   */
  private async getOrderDetails(
    orderId: string
  ): Promise<OrderNotification | null> {
    try {
      const orderData = await redisClient.get(`order:${orderId}:details`);
      return orderData ? JSON.parse(orderData) : null;
    } catch (error) {
      this.logger.error(`Failed to get order details: ${error.message}`);
      return null;
    }
  }

  // Add these methods to your LocationGateway for driver ride management

  // @UseGuards(WsAuthGuard, WsRoleGuard)
  // @Roles("driver")
  // @SubscribeMessage("ride:respond")
  // async handleRideResponse(
  //   @MessageBody()
  //   data: {
  //     rideId: number;
  //     accepted: boolean;
  //     reason?: string;
  //   },
  //   @ConnectedSocket() client: Socket
  // ) {
  //   const user = client.data.user as AuthenticatedUser;
  //   const driverId = parseInt(user.userId);

  //   // --- ✅ ADD THIS LOGGING BLOCK ---
  //   this.logger.log(
  //     `[RIDE RESPONSE] Received 'ride:respond' from Driver ID: ${driverId}`,
  //     {
  //       payload: data,
  //       rideId: data.rideId,
  //       accepted: data.accepted,
  //       timestamp: new Date().toISOString(),
  //     }
  //   );
  //   // --- END OF LOGGING BLOCK ---

  //   if (!data.rideId || typeof data.accepted !== "boolean") {
  //     throw new WsException("RideId and accepted (boolean) are required");
  //   }

  //   this.logger.log(`🚖 Driver ${driverId} responded to ride ${data.rideId}:`, {
  //     accepted: data.accepted,
  //     reason: data.reason,
  //     timestamp: new Date().toISOString(),
  //   });

  //   try {
  //     if (data.accepted) {
  //       // ✅ CRITICAL: This MUST update the database immediately
  //       const updatedRide = await this.ridesService.acceptRide(
  //         data.rideId,
  //         driverId
  //       );

  //       this.logger.log(
  //         `✅ Ride ${data.rideId} accepted by driver ${driverId}`,
  //         {
  //           rideId: data.rideId,
  //           driverId,
  //           newStatus: updatedRide.status,
  //           acceptedAt: updatedRide.accepted_at,
  //         }
  //       );

  //       // Notify client about acceptance
  //       this.server.to(`ride:${data.rideId}:client`).emit("ride:accepted", {
  //         rideId: data.rideId,
  //         driverId: driverId,
  //         acceptedAt: updatedRide.accepted_at,
  //         message: "Driver accepted your ride!",
  //       });
  //     } else {
  //       // ✅ CRITICAL: This MUST update the database immediately
  //       await this.ridesService.handleRideRejection(
  //         data.rideId,
  //         driverId,
  //         data.reason || "Driver declined"
  //       );

  //       this.logger.log(
  //         `❌ Ride ${data.rideId} rejected by driver ${driverId}`,
  //         {
  //           rideId: data.rideId,
  //           driverId,
  //           reason: data.reason,
  //         }
  //       );

  //       // Notify client about rejection
  //       this.server.to(`ride:${data.rideId}:client`).emit("ride:rejected", {
  //         rideId: data.rideId,
  //         reason: data.reason || "Driver declined",
  //         message: "Looking for another driver...",
  //       });
  //     }

  //     return {
  //       success: true,
  //       message: `Ride ${data.accepted ? "accepted" : "rejected"} successfully`,
  //       rideId: data.rideId,
  //       status: data.accepted ? "accepted" : "rejected",
  //     };
  //   } catch (error) {
  //     this.logger.error(`❌ Failed to process ride response:`, {
  //       driverId,
  //       rideId: data.rideId,
  //       error: error.message,
  //       stack: error.stack,
  //     });
  //     throw new WsException(error.message || "Failed to process ride response");
  //   }
  // }

  // Add this enhanced logging to your LocationGateway handleRideResponse method

  @UseGuards(WsAuthGuard, WsRoleGuard)
  @Roles("driver")
  @SubscribeMessage("ride:respond")
  async handleRideResponse(
    @MessageBody() rawData: any,
    @ConnectedSocket() client: Socket
  ) {
    const user = client.data.user as AuthenticatedUser;
    const driverId = parseInt(user.userId);

    // ✅ FIXED: Handle both string and object data
    let data: {
      rideId: number;
      accepted: boolean;
      reason?: string;
    };

    console.log("🚗 [RIDE RESPONSE DEBUG] ======================");
    console.log("📥 Raw data received:", JSON.stringify(rawData, null, 2));
    console.log("📥 Raw data type:", typeof rawData);

    // Parse JSON string if needed
    if (typeof rawData === "string") {
      try {
        data = JSON.parse(rawData);
        console.log("✅ Successfully parsed JSON string");
      } catch (error) {
        console.error("❌ Failed to parse JSON string:", error);
        throw new WsException("Invalid JSON format in request");
      }
    } else {
      data = rawData;
      console.log("✅ Data already parsed as object");
    }

    console.log("📊 Parsed data:", JSON.stringify(data, null, 2));
    console.log("👤 Driver info:", {
      userId: user.userId,
      userIdType: typeof user.userId,
      driverId: driverId,
      driverIdType: typeof driverId,
      role: user.role,
    });
    console.log("🎯 Validation checks:", {
      hasRideId: !!data.rideId,
      rideIdType: typeof data.rideId,
      rideIdValue: data.rideId,
      hasAccepted: typeof data.accepted !== "undefined",
      acceptedType: typeof data.accepted,
      acceptedValue: data.accepted,
    });
    console.log("================================================");

    this.logger.log(
      `[RIDE RESPONSE] Received 'ride:respond' from Driver ID: ${driverId}`,
      {
        payload: data,
        rideId: data.rideId,
        accepted: data.accepted,
        timestamp: new Date().toISOString(),
      }
    );

    // ✅ ENHANCED VALIDATION
    if (!data.rideId) {
      console.error("❌ Missing rideId in request");
      throw new WsException("RideId is required");
    }

    if (typeof data.accepted !== "boolean") {
      console.error("❌ Invalid accepted field:", {
        value: data.accepted,
        type: typeof data.accepted,
        expected: "boolean",
      });
      throw new WsException("Accepted field must be a boolean");
    }

    // Convert rideId to number if it's a string
    const rideId =
      typeof data.rideId === "string" ? parseInt(data.rideId, 10) : data.rideId;

    if (isNaN(rideId)) {
      console.error(
        "❌ Invalid rideId - cannot convert to number:",
        data.rideId
      );
      throw new WsException("Invalid rideId format");
    }

    console.log("✅ Validation passed, calling service method...");
    console.log("📞 Calling ridesService with:", {
      rideId: rideId,
      driverId: driverId,
      accepted: data.accepted,
    });

    try {
      if (data.accepted) {
        console.log("🎉 Driver ACCEPTED - calling acceptRide...");
        const updatedRide = await this.ridesService.acceptRide(
          rideId,
          driverId
        );

        console.log("✅ acceptRide returned:", {
          rideId: updatedRide.id,
          status: updatedRide.status,
          acceptedAt: updatedRide.accepted_at,
          driverId: updatedRide.driver?.id,
        });

        // Notify client
        this.server.to(`ride:${rideId}:client`).emit("ride:accepted", {
          rideId: rideId,
          driverId: driverId,
          acceptedAt: updatedRide.accepted_at,
          message: "Driver accepted your ride!",
        });

        console.log("📢 Sent acceptance notification to client");
      } else {
        console.log("❌ Driver REJECTED - calling handleRideRejection...");
        await this.ridesService.handleRideRejection(
          rideId,
          driverId,
          data.reason || "Driver declined"
        );

        console.log("✅ handleRideRejection completed");

        // Notify client
        this.server.to(`ride:${rideId}:client`).emit("ride:rejected", {
          rideId: rideId,
          reason: data.reason || "Driver declined",
          message: "Looking for another driver...",
        });

        console.log("📢 Sent rejection notification to client");
      }

      const response = {
        success: true,
        message: `Ride ${data.accepted ? "accepted" : "rejected"} successfully`,
        rideId: rideId,
        status: data.accepted ? "accepted" : "rejected",
      };

      console.log("✅ Handler completed successfully:", response);
      return response;
    } catch (error) {
      console.error("💥 Service method failed:", {
        error: error.message,
        stack: error.stack,
        rideId: rideId,
        driverId: driverId,
      });

      this.logger.error(`❌ Failed to process ride response:`, {
        driverId,
        rideId: rideId,
        error: error.message,
        stack: error.stack,
      });
      throw new WsException(error.message || "Failed to process ride response");
    }
  }

  // Also add this method to check the current ride status
  @SubscribeMessage("debug:ride-status")
  async debugRideStatus(
    @MessageBody() data: { rideId: number },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const ride = await this.ridesService.findOne(data.rideId);

      console.log("🔍 [DEBUG] Current ride status:", {
        rideId: data.rideId,
        found: !!ride,
        status: ride?.status,
        driverId: ride?.driver?.id,
        clientId: ride?.client?.id,
        acceptedAt: ride?.accepted_at,
        createdAt: ride?.requested_at,
      });

      return {
        success: true,
        ride: ride
          ? {
              id: ride.id,
              status: ride.status,
              driverId: ride.driver?.id,
              clientId: ride.client?.id,
              acceptedAt: ride.accepted_at,
              requestedAt: ride.requested_at,
            }
          : null,
      };
    } catch (error) {
      console.error("❌ Debug ride status failed:", error);
      return { success: false, error: error.message };
    }
  }

  @UseGuards(WsAuthGuard, WsRoleGuard)
  @Roles("driver")
  @SubscribeMessage("ride:start")
  async handleRideStart(
    @MessageBody() data: { rideId: number },
    @ConnectedSocket() client: Socket
  ) {
    const user = client.data.user as AuthenticatedUser;
    const driverId = parseInt(user.userId);

    try {
      // Update ride status in database (you'll need to inject RidesService or create a method)
      // For now, we'll just update Redis and notify
      await redisClient.set(`ride:${data.rideId}:status`, "in_progress", {
        EX: 3600,
      });
      await redisClient.set(
        `ride:${data.rideId}:started_at`,
        Date.now().toString(),
        { EX: 3600 }
      );

      // Notify client that ride has started
      this.server.to(`ride:${data.rideId}:client`).emit("ride:started", {
        rideId: data.rideId,
        driverId: driverId,
        startedAt: new Date().toISOString(),
        message: "Your ride has started!",
      });

      this.logger.log(`Ride ${data.rideId} started by driver ${driverId}`);

      return {
        success: true,
        message: "Ride started",
        rideId: data.rideId,
      };
    } catch (error) {
      this.logger.error(`Failed to start ride: ${error.message}`);
      throw new WsException("Failed to start ride");
    }
  }

  @UseGuards(WsAuthGuard, WsRoleGuard)
  @Roles("driver")
  @SubscribeMessage("ride:complete")
  async handleRideComplete(
    @MessageBody()
    data: {
      rideId: number;
      finalFare?: number;
      actualDistance?: number;
      actualDuration?: number;
    },
    @ConnectedSocket() client: Socket
  ) {
    const user = client.data.user as AuthenticatedUser;
    const driverId = parseInt(user.userId);

    try {
      // Update ride status
      await redisClient.set(`ride:${data.rideId}:status`, "completed", {
        EX: 3600,
      });
      await redisClient.set(
        `ride:${data.rideId}:completed_at`,
        Date.now().toString(),
        { EX: 3600 }
      );

      // Clear driver's current ride
      await redisClient.del(`driver:${driverId}:ride`);

      // Notify client that ride is complete
      this.server.to(`ride:${data.rideId}:client`).emit("ride:completed", {
        rideId: data.rideId,
        driverId: driverId,
        completedAt: new Date().toISOString(),
        finalFare: data.finalFare,
        actualDistance: data.actualDistance,
        actualDuration: data.actualDuration,
        message: "Your ride is complete! Thank you for riding with us.",
      });

      this.logger.log(`Ride ${data.rideId} completed by driver ${driverId}`);

      return {
        success: true,
        message: "Ride completed",
        rideId: data.rideId,
      };
    } catch (error) {
      this.logger.error(`Failed to complete ride: ${error.message}`);
      throw new WsException("Failed to complete ride");
    }
  }

  // Client subscription to ride updates
  @UseGuards(WsAuthGuard, WsRoleGuard)
  @Roles("client")
  @SubscribeMessage("ride:subscribe")
  async handleRideSubscription(
    @MessageBody() data: { rideId: number },
    @ConnectedSocket() client: Socket
  ) {
    if (!data.rideId) {
      throw new WsException("Ride ID is required");
    }

    const user = client.data.user as AuthenticatedUser;
    const clientRoom = `ride:${data.rideId}:client`;

    client.join(clientRoom);

    this.logger.log(
      `Client ${user.userId} subscribed to ride ${data.rideId} updates`
    );

    return {
      success: true,
      message: `Subscribed to ride ${data.rideId} updates`,
      room: clientRoom,
    };
  }

  @UseGuards(WsAuthGuard, WsRoleGuard)
  @Roles("driver")
  @SubscribeMessage(/^ride:\d+:response$/) // ✅ Dynamic pattern to match ride:X:response
  async handleDynamicRideResponse(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket
  ) {
    // Extract rideId from the event name or data
    const rideId =
      data.rideId || parseInt(client.handshake.query.rideId as string);

    const user = client.data.user as AuthenticatedUser;
    const driverId = parseInt(user.userId);

    this.logger.log(`🚖 Driver ${driverId} responded to ride ${rideId}:`, {
      accepted: data.accepted,
      reason: data.reason,
      eventPattern: "ride:X:response",
    });

    try {
      if (data.accepted) {
        await this.ridesService.acceptRide(rideId, driverId);
        this.logger.log(`✅ Ride ${rideId} accepted by driver ${driverId}`);
      } else {
        await this.ridesService.handleRideRejection(
          rideId,
          driverId,
          data.reason || "Driver declined"
        );
        this.logger.log(`❌ Ride ${rideId} rejected by driver ${driverId}`);
      }

      return { success: true, rideId };
    } catch (error) {
      this.logger.error(`❌ Failed to process ride response:`, {
        driverId,
        rideId,
        error: error.message,
      });
      throw new WsException(error.message);
    }
  }
}