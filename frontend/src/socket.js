import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  transports: ["websocket"], // avoids polling problems
  reconnection: true
});

export default socket;