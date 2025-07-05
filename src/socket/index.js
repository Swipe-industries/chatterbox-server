import { Server } from "socket.io";
import { socketAuth } from "../middlewares/auth.js";
import { addUser } from "./userHandler.js";
import { sendMessage } from "./messageHandler.js";

export default function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  io.use(socketAuth);

  let activeUsers = [];

  const onConnection = (socket) => {
    //all event handlers here:
    socket.on("user:add", addUser({io, socket, activeUsers}));
    socket.on("message:send", sendMessage({io, socket, activeUsers}));


    socket.on("disconnect", (reason) => {
      console.log("Disconnected: ", reason);
      activeUsers = activeUsers.filter((user) => user.userId !== socket.userId);
    });
  };

  io.on("connection", onConnection);
}

//   socket.on("user-typing", ({ userId, receiverId }) => {
//     const user = activeUsers.find((user) => user.userId === userId);
//     if (user) {
//       user.isTyping = true;
//       io.to(
//         activeUsers.find((user) => user.userId === receiverId)?.socketId
//       ).emit("user-typing", userId);
//     }
//   });

//   socket.on("user-stop-typing", ({ userId, receiverId }) => {
//     const user = activeUsers.find((user) => user.userId === userId);
//     if (user) {
//       user.isTyping = false;
//       io.to(
//         activeUsers.find((user) => user.userId === receiverId)?.socketId
//       ).emit("user-stop-typing", userId);
//     }
//   });

//   socket.on("disconnect", async () => {
//     //Finding the disconnected user:
//     const disconnectedUser = activeUsers.find(
//       (user) => user.socketId === socket.id
//     );

//     //Removing the user from the list of active users:
//     activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);

//     // emitting to all:
//     io.emit("get-users", activeUsers);

//     //Updating the database:
//     if (disconnectedUser) {
//       try {
//         await db
//           .update(users)
//           .set({ lastSeen: new Date() })
//           .where(eq(users.id, disconnectedUser.userId));
//       } catch (error) {
//         console.error("Error updating lastSeen: ", error);
//       }
//     }
//   });
// });
