
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtTokenService } from './jwt.service';
import { Socket } from 'socket.io';
import * as process from 'process';

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  constructor(private readonly jwtTokenService: JwtTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      const role = client.handshake.auth?.role;

      if (!token || !role) {
        throw new Error('Token or role not provided');
      }

      const key = {
        driver: process.env.DRIVER_ACCESS_TOKEN_KEY,
        client: process.env.CLIENT_ACCESS_TOKEN_KEY,
        admin: process.env.ADMIN_ACCESS_TOKEN_KEY,
      }[role];

      if (!key) {
        throw new Error('Invalid role');
      }

      const payload = await this.jwtTokenService.verifyAccessToken(token, key);

      client.data.user = {
        userId: payload.sub,
        role: payload.role,
      };
      
      this.logger.log(
        `WebSocket Authenticated: userId=${payload.sub}, role=${payload.role}`
      );

      return true;
    } catch (err) {
      this.logger.error(`WebSocket Authentication Error: ${err.message}`);
      client.disconnect();
      return false;
    }
  }
}
