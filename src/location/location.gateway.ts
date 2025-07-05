
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtTokenService } from "../auth/jwt.service";
import { redisClient } from "../redis/redis.provider";
import { Logger, UseGuards } from "@nestjs/common";
import { WsAuthGuard } from "../auth/ws-auth.guard";

const DRIVER_HEARTBEAT_INTERVAL = 10000; // 10 seconds
const DRIVER_HEARTBEAT_TIMEOUT = 30000; // 30 seconds

interface DriverLocation {
  driverId: string;
  lat: number;
  lng: number;
}

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
@UseGuards(WsAuthGuard)
export class LocationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LocationGateway.name);
  private driverUpdateTimestamps = new Map<string, number>();
  private driverHeartbeatTimers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly jwtTokenService: JwtTokenService) {}

  async handleConnection(client: Socket) {
    const user = client.data.user;
    if (user && user.role === "driver") {
      this.logger.log(`Driver connected: ${user.userId}`);
      this.startHeartbeat(user.userId);
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user && user.role === "driver") {
      this.logger.log(`Driver disconnected: ${user.userId}`);
      this.stopHeartbeat(user.userId);
    }
  }

  @SubscribeMessage("driver:heartbeat")
  handleDriverHeartbeat(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    if (user && user.role === "driver") {
      this.driverUpdateTimestamps.set(user.userId, Date.now());
    }
  }

  private startHeartbeat(driverId: string) {
    this.driverUpdateTimestamps.set(driverId, Date.now());
    const timer = setInterval(async () => {
      const lastHeartbeat = this.driverUpdateTimestamps.get(driverId);
      if (lastHeartbeat && Date.now() - lastHeartbeat > DRIVER_HEARTBEAT_TIMEOUT) {
        this.logger.log(`Driver ${driverId} timed out.`);
        await this.setDriverOffline(driverId);
        this.stopHeartbeat(driverId);
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
    }
  }

  private async setDriverOffline(driverId: string) {
    try {
      await redisClient.set(`driver:${driverId}:status`, "offline");
      this.server.emit("driver:status:update", { driverId, status: "offline" });
    } catch (error) {
      this.logger.error(
        `Error setting driver ${driverId} offline: ${error.message}`
      );
    }
  }

  @SubscribeMessage("ride:subscribe")
  handleRideSubscribe(
    @MessageBody() data: { rideId: number },
    @ConnectedSocket() client: Socket
  ) {
    const user = client.data.user;
    if (!user) {
      return;
    }
    const room = `ride:${data.rideId}`;
    client.join(room);
    this.logger.log(
      `User ${user.userId} (${user.role}) subscribed to ride ${data.rideId}`
    );
  }

  @SubscribeMessage("client:view:update")
  async handleClientViewUpdate(
    @MessageBody()
    data: {
      ne: { lat: number; lng: number };
      sw: { lat: number; lng: number };
    },
    @ConnectedSocket() client: Socket
  ) {
    const user = client.data.user;
    if (!user || user.role !== "client") {
      return;
    }

    try {
      const driverIds = (await redisClient.geoSearch(
        "drivers:location",
        {
          longitude: (data.ne.lng + data.sw.lng) / 2,
          latitude: (data.ne.lat + data.sw.lat) / 2,
        },
        {
          width: Math.abs(data.ne.lng - data.sw.lng),
          height: Math.abs(data.ne.lat - data.sw.lat),
          unit: "km",
        }
      )) as string[];

      const drivers: DriverLocation[] = [];
      for (const driverId of driverIds) {
        const location = await redisClient.get(`driver:${driverId}:location`);
        if (location) {
          drivers.push({ driverId, ...JSON.parse(location) });
        }
      }

      client.emit("drivers:in-view", drivers);
    } catch (error) {
      this.logger.error(`Error handling client view update: ${error.message}`);
    }
  }

  @SubscribeMessage("driver:location:update")
  async handleDriverLocation(
    @MessageBody()
    data: {
      rideId?: number;
      lat: number;
      lng: number;
    },
    @ConnectedSocket() client: Socket
  ) {
    const user = client.data.user;
    if (!user || user.role !== "driver") {
      this.logger.warn("Unauthorized user trying to send location");
      return;
    }

    const driverId = user.userId;

    const now = Date.now();
    const lastUpdate = this.driverUpdateTimestamps.get(driverId);
    if (lastUpdate && now - lastUpdate < 3000) {
      this.logger.warn(`Driver ${driverId} is sending updates too frequently.`);
      return;
    }
    this.driverUpdateTimestamps.set(driverId, now);

    try {
      await redisClient.geoAdd("drivers:location", {
        longitude: data.lng,
        latitude: data.lat,
        member: driverId,
      });
      await redisClient.set(
        `driver:${driverId}:location`,
        JSON.stringify({ lat: data.lat, lng: data.lng })
      );

      if (data.rideId) {
        const room = `ride:${data.rideId}`;
        client.join(room);
        this.server.to(room).emit("ride:location:update", {
          driverId,
          lat: data.lat,
          lng: data.lng,
        });
      } else {
        this.server.emit("driver:location:public", {
          driverId,
          lat: data.lat,
          lng: data.lng,
        });
      }
    } catch (error) {
      this.logger.error(
        `Error handling driver location for driver ${driverId}: ${error.message}`
      );
    }
  }
}

