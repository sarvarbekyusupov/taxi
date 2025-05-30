import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtTokenService } from './jwt.service';
import { JwtModule } from '@nestjs/jwt';


@Module({
  imports: [
    JwtModule.register({
      secret: "your_jwt_secret", // use ConfigService for production
      signOptions: { expiresIn: "1d" },
    }),
  ],
  controllers: [],
  providers: [AuthService, JwtTokenService], // ✅ Include JwtTokenService here
  exports: [AuthService, JwtTokenService], // ✅ Now this works
})
export class AuthModule {}

