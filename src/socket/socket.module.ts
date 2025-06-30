import { Module, Global } from "@nestjs/common";
import { SOCKET_IO_SERVER } from "./socket.constants";
import { getSocketInstance } from "./socket.provider";
import { LocationGateway } from "../location/location.gateway";
import { AuthModule } from "../auth/auth.module";

@Global()
@Module({
  imports: [AuthModule],
  providers: [
    LocationGateway,
    {
      provide: SOCKET_IO_SERVER,
      useFactory: getSocketInstance,
    },
  ],
  exports: [SOCKET_IO_SERVER],
})
export class SocketModule {}
