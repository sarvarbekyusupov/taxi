import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";

@Injectable()
export class UserCategoryGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const params = req.params;

    if (!user) throw new UnauthorizedException();

    switch (user.role) {
      case "client":
        if (params.client_id && +params.client_id !== user.sub) {
          throw new ForbiddenException(
            "Clients can only access their own or allowed client data"
          );
        }
        break;

      case "driver":
        if (params.driver_id && +params.driver_id !== user.sub) {
          throw new ForbiddenException(
            "Drivers can only access their own or allowed driver data"
          );
        }
        break;

      case "admin":
        if (params.admin_id && +params.admin_id !== user.sub) {
          throw new ForbiddenException(
            "Admins can only access their own account"
          );
        }
        break;

      case "super_admin":
        return true; // full access
    }

    return true;
  }
}
