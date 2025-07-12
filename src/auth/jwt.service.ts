// import { ForbiddenException, Injectable } from "@nestjs/common";
// import { JwtService } from "@nestjs/jwt";
// import * as process from "process";

// @Injectable()
// export class JwtTokenService {
//   constructor(private readonly jwtService: JwtService) {}

//   generateTokens(
//     payload: { id: number; [key: string]: any },
//     refreshKey: string,
//     accessKey: string
//   ): {
//     accessToken;
//     refreshToken;
//   } {
//     const accessToken = this.jwtService.sign(payload, {
//       secret: accessKey,
//       expiresIn: process.env.ACCESS_TOKEN_TIME,
//       subject: payload.id.toString(),
//     });

//     const refreshToken = this.jwtService.sign(payload, {
//       secret: refreshKey,
//       expiresIn: process.env.REFRESH_TOKEN_TIME,
//       subject: payload.id.toString(),
//     });

//     return {
//       accessToken,
//       refreshToken,
//     };
//   }

//   async verifyAccessToken(token: string, accessKey: string) {
//     return this.jwtService.verifyAsync(token, {
//       secret: accessKey,
//     });
//   }

//   async verifyRefreshToken(token: string, refreshKey: string) {
//     try {
//       return await this.jwtService.verifyAsync(token, {
//         secret: refreshKey,
//       });
//     } catch (err) {
//       throw new ForbiddenException("Invalid or expired refresh token");
//     }
//   }
// }

import { ForbiddenException, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as process from "process";

@Injectable()
export class JwtTokenService {
  constructor(private readonly jwtService: JwtService) {}

  generateTokens(
    payload: { id: number; [key: string]: any },
    refreshKey: string,
    accessKey: string
  ): {
    accessToken: string;
    refreshToken: string;
  } {
    // ✅ Ensure 'sub' is included in the payload
    const jwtPayload = {
      ...payload,
      sub: payload.id,
    };

    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: accessKey,
      expiresIn: process.env.ACCESS_TOKEN_TIME,
    });

    const refreshToken = this.jwtService.sign(jwtPayload, {
      secret: refreshKey,
      expiresIn: process.env.REFRESH_TOKEN_TIME,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async verifyAccessToken(token: string, accessKey: string) {
    return this.jwtService.verifyAsync(token, {
      secret: accessKey,
    });
  }

  async verifyRefreshToken(token: string, refreshKey: string) {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: refreshKey,
      });
    } catch (err) {
      throw new ForbiddenException("Invalid or expired refresh token");
    }
  }
}
