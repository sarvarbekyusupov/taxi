import { Server } from "socket.io";

let io: Server | null = null;

export const SOCKET_IO_SERVER = "SOCKET_IO_SERVER";

export const setSocketInstance = (server: Server) => {
  io = server;
};

export const getSocketInstance = (): Server | null => {
  return io;
};
