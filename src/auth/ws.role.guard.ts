import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Socket } from "socket.io";
import { ROLES_KEY } from "../common/decorators/role.decorator";

@Injectable()
export class WsRoleGuard implements CanActivate {
  private readonly logger = new Logger(WsRoleGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles || roles.length === 0) {
      this.logger.log("No roles required, access granted");
      return true;
    }

    const client: Socket = context.switchToWs().getClient<Socket>();
    const user = client.data?.user;

    if (!user) {
      this.logger.warn("User not set in client.data");
      client.emit("auth:error", { message: "Authentication required" });
      client.disconnect();
      return false;
    }

    if (!roles.includes(user.role)) {
      this.logger.warn(
        `Access denied: ${user.userId} (${user.role}) - Required: ${roles.join(", ")}`
      );
      client.emit("auth:error", {
        message: "Access denied",
        expectedRoles: roles,
        actualRole: user.role,
      });
      client.disconnect();
      return false;
    }

    this.logger.log(`Role authorized: ${user.userId} (${user.role})`);
    return true;
  }
}
