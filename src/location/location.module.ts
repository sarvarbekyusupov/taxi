import { Module } from "@nestjs/common";
import { LocationGateway } from "./location.gateway";
import { LocationController } from "./location.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports:[AuthModule],
  controllers: [LocationController],
  providers: [LocationGateway],
})
export class LocationModule {}
