import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";

@Injectable()
export class RateLimitGuard implements CanActivate {
  private rateLimiter = new RateLimiterMemory({
    points: 5, // 💥 max requests
    duration: 60, // ⏱ per 60 seconds
  });

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = (request.ip ||
      request.headers["x-forwarded-for"] ||
      "unknown") as string;

    try {
      await this.rateLimiter.consume(ip); // 🛑 rate limit check
      return true;
    } catch (err) {
      throw new HttpException(
        "Too many requests, please try again later.",
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
  }
}
