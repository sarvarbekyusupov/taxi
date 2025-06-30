import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtTokenService } from "../auth/jwt.service";
import { redisClient } from "../redis/redis.provider";
import * as process from "process";
import { Logger } from "@nestjs/common";

@WebSocketGateway({
  cors: {
    origin: "*", // ⚠️ Production’da frontend domainni qo‘yish kerak
  },
})
export class LocationGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LocationGateway.name);

  constructor(private readonly jwtTokenService: JwtTokenService) {}

  // ✅ Client ulanayotganda JWT ni tekshirish
  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(" ")[1];

      const role = client.handshake.auth?.role;

      if (!token || !role) throw new Error("Token yoki rol berilmagan");

      const key = {
        driver: process.env.DRIVER_ACCESS_TOKEN_KEY,
        client: process.env.CLIENT_ACCESS_TOKEN_KEY,
        admin: process.env.ADMIN_ACCESS_TOKEN_KEY,
      }[role];

      if (!key) throw new Error("Noto‘g‘ri rol");

      const payload = await this.jwtTokenService.verifyAccessToken(token, key);

      client.data.user = {
        userId: payload.sub,
        role: payload.role,
      };

      this.logger.log(
        `WebSocket ulandi: userId=${payload.sub}, role=${payload.role}`
      );
    } catch (err) {
      this.logger.error("WebSocket ulanishda xato:", err.message);
      client.disconnect();
    }
  }

  // 📍 Haydovchining joylashuvi yuborilganda ishlaydi
  @SubscribeMessage("driverLocation")
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
      this.logger.warn("Noto‘g‘ri foydalanuvchi location yubormoqda");
      return;
    }

    const driverId = user.userId;

    // 🔄 Online statusini tekshirish
    const status = await redisClient.get(`driver:${driverId}:status`);
    const isOnline = status === "online";

    // 🔄 Ride bor-yo‘qligini tekshirish
    const currentRide = await redisClient.get(`driver:${driverId}:ride`);
    const isInRide = !!currentRide;

    // ❗ Agar offline va rideId yo‘q bo‘lsa, locationni inkor etish
    if (!isOnline && !data.rideId) {
      this.logger.log(`Driver ${driverId} offline, location qabul qilinmadi`);
      return;
    }

    // ✅ Haydovchining so‘nggi joylashuvini saqlash
    await redisClient.set(
      `driver:${driverId}:location`,
      JSON.stringify({ lat: data.lat, lng: data.lng })
    );

    // 🎯 Agar ride ichida bo‘lsa — ride location saqlash va emit
    if (data.rideId) {
      await redisClient.set(`driver:${driverId}:ride`, data.rideId.toString());
      await redisClient.set(
        `ride:${data.rideId}:driverLocation`,
        JSON.stringify({ driverId, lat: data.lat, lng: data.lng })
      );

      this.server.emit(`locationUpdate:ride:${data.rideId}`, {
        driverId,
        lat: data.lat,
        lng: data.lng,
      });
    }

    // 🗺 Agar umumiy xaritada ko‘rinadigan haydovchi bo‘lsa
    if (isOnline && !isInRide) {
      this.server.emit("locationUpdate:public", {
        driverId,
        lat: data.lat,
        lng: data.lng,
      });
    }
  }
}
