import { Module } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Admin } from "./entities/admin.entity";
import { AuthModule } from "../auth/auth.module";
import { MailModule } from "../mail/mail.module";

@Module({
  imports: [TypeOrmModule.forFeature([Admin]), MailModule, AuthModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
