import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtTokenService } from './jwt.service';
import { JwtModule } from '@nestjs/jwt';
import { RoleGuard } from './role.guard';
import { UserCategoryGuard } from './user.guard';
// import { RoleBasedGuard } from './user.guard';


@Module({
  imports: [
    JwtModule.register({
      secret: "your_jwt_secret", // use ConfigService for production
      signOptions: { expiresIn: "1d" },
    }),
  ],
  controllers: [],
  providers: [AuthService, JwtTokenService, RoleGuard, UserCategoryGuard], // ✅ Include JwtTokenService here
  exports: [AuthService, JwtTokenService, RoleGuard, UserCategoryGuard], // ✅ Now this works
})
export class AuthModule {}

