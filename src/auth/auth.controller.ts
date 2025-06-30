import { Controller, Post, Body, BadRequestException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CompleteSignupDto, RequestOtpDto, VerifyOtpDto } from "./dto/auth.dto";

@Controller("client-auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

 
}
