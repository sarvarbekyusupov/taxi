import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtTokenService } from "./jwt.service";
import { ROLES_KEY } from "../common/decorators/role.decorator";

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtTokenService: JwtTokenService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles) return true;

    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers.authorization;
    if (!authHeader)
      throw new UnauthorizedException("Missing Authorization Header");

    const [bearer, token] = authHeader.split(" ");
    if (bearer !== "Bearer" || !token)
      throw new UnauthorizedException("Invalid Authorization Format");

    const secrets = {
      super_admin: process.env.SUPER_ADMIN_ACCESS_TOKEN_KEY,
      admin: process.env.ADMIN_ACCESS_TOKEN_KEY,
      driver: process.env.DRIVER_ACCESS_TOKEN_KEY,
      client: process.env.CLIENT_ACCESS_TOKEN_KEY,
    };

    let payload: any = null;
    let matchedRole: string | null = null;

    for (const [role, key] of Object.entries(secrets)) {
      if (!key) continue;

      try {
        const decoded = await this.jwtTokenService.verifyAccessToken(
          token,
          key as string
        );

        if (decoded?.role?.toLowerCase() === role.toLowerCase()) {
          payload = decoded;
          matchedRole = role;
          break;
        }
      } catch {
        continue; // silently skip if verification fails
      }
    }

    if (!payload || !matchedRole) {
      throw new UnauthorizedException("Invalid or expired token");
    }

    if (!roles.includes(matchedRole)) {
      throw new ForbiddenException("Access denied for this role");
    }

    req.user = payload; // Attach user to request
    return true;
  }
}
