import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RidesService } from './rides.service';

@Injectable()
export class RideAuthorizationGuard implements CanActivate {
  constructor(private reflector: Reflector, private ridesService: RidesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const rideId = request.params.id;

    if (!user || !rideId) {
      return false;
    }

    const ride = await this.ridesService.findOne(rideId);

    if (!ride) {
      return false;
    }

    if (user.role === 'admin' || user.role === 'super_admin') {
      return true;
    }

    if (user.role === 'client' && (!ride.client || ride.client.id !== user.sub)) {
      throw new ForbiddenException('You are not authorized to access this ride.');
    }

    if (user.role === 'driver' && (!ride.driver || ride.driver.id !== user.sub)) {
      throw new ForbiddenException('You are not authorized to access this ride.');
    }

    return true;
  }
}
