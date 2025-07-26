import { forwardRef, Module } from "@nestjs/common";
import { LocationGateway } from "./location.gateway";
import { AuthModule } from "../auth/auth.module";
import { ServiceAreasModule } from "../service-areas/service-areas.module";
import { DriverModule } from "../driver/driver.module";
import { DriverService } from "../driver/driver.service";
import {  LocationGatewayDocsController } from "./location.controller";
import { WsAuthGuard } from "../auth/ws-auth.guard";
import { WsRoleGuard } from "../auth/ws.role.guard";
import { RidesModule } from "../rides/rides.module";

@Module({
  imports: [
    AuthModule,
    ServiceAreasModule,
    DriverModule,
    forwardRef(() => RidesModule),
  ],
  controllers: [LocationGatewayDocsController],
  providers: [LocationGateway, WsAuthGuard, WsRoleGuard],
})
export class LocationModule {}
