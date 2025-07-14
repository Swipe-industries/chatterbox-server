import { Server } from "socket.io";
import { socketAuth } from "../middlewares/auth.js";
import { sendMessage } from "./messageHandler.js";
import { getSuccessResponse } from "../utils/response.js";
import { updateLastSeen, handleUserTyping, handleUserNotTyping } from "./userHandler.js";

export default function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  io.use(socketAuth);

  let activeUsers = [];

  const onConnection = (socket) => {
    //on connection adding the user to active list
    if (!activeUsers.some((user) => user.userId === socket.userId)) {
      activeUsers.push({
        userId: socket.userId,
        socketId: socket.id,
      });
    }

    io.emit(
      "users:active",
      getSuccessResponse("OK", "List of active users", activeUsers)
    );

    //all event handlers here:
    socket.on("message:send", sendMessage({ io, socket, activeUsers }));
    socket.on("user:typing", handleUserTyping({io, socket, activeUsers}));
    socket.on("user:notTyping", handleUserNotTyping({io, socket, activeUsers}));

    socket.on("disconnect", async () => {
      activeUsers = activeUsers.filter((user) => user.userId !== socket.userId);

      updateLastSeen({ io, socket, activeUsers });
    });
  };

  io.on("connection", onConnection);
}
