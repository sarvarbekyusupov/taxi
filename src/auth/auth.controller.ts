import { Controller, Post, Body, BadRequestException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CompleteSignupDto, RequestOtpDto, VerifyOtpDto } from "./dto/auth.dto";

@Controller("client-auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("request-otp")
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.sendOtp(dto.phone_number);
  }

  @Post("verify-otp")
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone_number, dto.otp);
  }

  @Post("complete-signup")
  async completeSignup(@Body() dto: CompleteSignupDto) {
    return this.authService.completeSignup(dto.phone_number, dto.name);
  }
}
