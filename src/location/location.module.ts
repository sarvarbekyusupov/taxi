import { Module } from "@nestjs/common";
import { LocationGateway } from "./location.gateway";
import { LocationController } from "./location.controller";
import { AuthModule } from "../auth/auth.module";
import { ServiceAreasModule } from "../service-areas/service-areas.module";

@Module({
  imports:[AuthModule, ServiceAreasModule],
  controllers: [LocationController],
  providers: [LocationGateway],
})
export class LocationModule {}
