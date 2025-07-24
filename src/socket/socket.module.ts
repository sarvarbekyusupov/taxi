// import { Module, Global } from "@nestjs/common";
// import { SOCKET_IO_SERVER } from "./socket.constants";
// import { getSocketInstance } from "./socket.provider";
// // Do NOT import gateways here

// @Global()
// @Module({
//   imports: [], // Gateways don't need AuthModule/DriverModule here
//   providers: [
//     {
//       provide: SOCKET_IO_SERVER,
//       useFactory: getSocketInstance,
//     },
//   ],
//   exports: [SOCKET_IO_SERVER],
// })
// export class SocketModule {}

import { Module, Global } from "@nestjs/common";
import { SOCKET_IO_SERVER } from "./socket.constants";
import { getSocketInstance } from "./socket.provider";

@Global()
@Module({
  providers: [
    {
      provide: SOCKET_IO_SERVER,
      useFactory: () => {
        const server = getSocketInstance();
        console.log("🏭 [SOCKET MODULE] Factory called", {
          serverExists: !!server,
          serverType: server?.constructor?.name,
          timestamp: new Date().toISOString(),
        });

        if (!server) {
          console.warn("⚠️ [SOCKET MODULE] Server instance is null in factory");
        }

        return server;
      },
    },
  ],
  exports: [SOCKET_IO_SERVER],
})
export class SocketModule {}