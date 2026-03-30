import { io } from "socket.io-client";
import { SOCKET_URL } from "./lib/api.js";

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  reconnection: true,
  autoConnect: false,
});

export default socket;
