import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { ROLES_KEY } from "../decorators/role.decorator";

@Injectable()
export class UserGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers.authorization;

    if (!authHeader) throw new UnauthorizedException("Unauthorized user");

    const [bearer, token] = authHeader.split(" ");
    if (bearer !== "Bearer" || !token)
      throw new UnauthorizedException("Unauthorized user");

    let payload: any;
    try {
      payload = await this.jwtService.verify(token, {
        secret: process.env.ACCESS_TOKEN_KEY,
      });
    } catch (error) {
      throw new BadRequestException("Token invalid or expired");
    }

    if (!payload?.is_active) {
      throw new ForbiddenException("User is not active");
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (requiredRoles && !requiredRoles.includes(payload.role)) {
      throw new ForbiddenException("You do not have permission");
    }

    req.user = payload;
    return true;
  }
}

