import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from "@nestjs/common";
import { Socket } from "socket.io";
import { JwtTokenService } from "./jwt.service";

type ValidRoles = "driver" | "client" | "admin" | "super_admin";

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  constructor(private readonly jwtTokenService: JwtTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();

    try {
      if (client.data?.user) {
        this.logger.log(
          `WS AuthGuard: User already authenticated - ${client.data.user.userId}`
        );
        return true;
      }

      let token: string | null = null;
      const authHeader = client.handshake.headers?.authorization;

      if (authHeader) {
        token = authHeader.startsWith("Bearer ")
          ? authHeader.split(" ")[1]
          : authHeader;
      }

      const role = (client.handshake.headers?.role ||
        client.handshake.headers?.["x-role"]) as ValidRoles;

      if (!token || !role) {
        throw new Error("Missing token or role");
      }

      const secrets: Record<ValidRoles, string | undefined> = {
        driver: process.env.DRIVER_ACCESS_TOKEN_KEY,
        client: process.env.CLIENT_ACCESS_TOKEN_KEY,
        admin: process.env.ADMIN_ACCESS_TOKEN_KEY,
        super_admin: process.env.SUPER_ADMIN_ACCESS_TOKEN_KEY,
      };

      const secretKey = secrets[role];
      if (!secretKey) {
        throw new Error("Invalid role or missing secret");
      }

      const payload = await this.jwtTokenService.verifyAccessToken(
        token,
        secretKey
      );
      
      console.log("Decoded JWT payload in WsAuthGuard:", payload);


      client.data.user = {
        userId: payload.sub,
        role: payload.role,
      };

      this.logger.log(`WS Authenticated: ${payload.sub} (${payload.role})`);
      return true;
    } catch (error) {
      this.logger.warn(`WS Authentication failed: ${error.message}`);
      client.emit("auth:error", { message: "Unauthorized WebSocket access" });
      client.disconnect();
      return false;
    }
  }
}
