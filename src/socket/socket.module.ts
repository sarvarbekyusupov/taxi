import { Module, Global } from "@nestjs/common";
import { SOCKET_IO_SERVER } from "./socket.constants";
import { getSocketInstance } from "./socket.provider";
// Do NOT import gateways here

@Global()
@Module({
  imports: [], // Gateways don't need AuthModule/DriverModule here
  providers: [
    {
      provide: SOCKET_IO_SERVER,
      useFactory: getSocketInstance,
    },
  ],
  exports: [SOCKET_IO_SERVER],
})
export class SocketModule {}
