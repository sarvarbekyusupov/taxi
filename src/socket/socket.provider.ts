// import { Server } from "socket.io";

// let io: Server | null = null;

// export const SOCKET_IO_SERVER = "SOCKET_IO_SERVER";

// export const setSocketInstance = (server: Server) => {
//   io = server;
// };

// export const getSocketInstance = (): Server | null => {
//   return io;
// };

import { Server } from "socket.io";

let io: Server | null = null;

export const SOCKET_IO_SERVER = "SOCKET_IO_SERVER";

export const setSocketInstance = (server: Server) => {
  console.log("✅ [SOCKET PROVIDER] Setting Socket.IO server instance", {
    serverExists: !!server,
    serverType: server?.constructor?.name,
    timestamp: new Date().toISOString(),
  });
  io = server;
};

export const getSocketInstance = (): Server | null => {
  console.log("🔍 [SOCKET PROVIDER] Getting Socket.IO server instance", {
    serverExists: !!io,
    serverType: io?.constructor?.name,
    timestamp: new Date().toISOString(),
  });
  return io;
};