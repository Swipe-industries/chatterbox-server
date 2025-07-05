export const addUser = ({ io, socket, activeUsers }) => {
  return async (payload, callback) => {
    if (typeof callback !== "function") {
      return;
    }
    
    //validate that no payload is provided for this event:
    if (!Object.keys(payload).length == 0) {
      return callback({
        status: "INTERNAL_SERVER_ERROR ",
        message: "Invalid payload",
      });
    }

    if (!activeUsers.some((user) => user.userId === socket.userId)) {
      activeUsers.push({
        userId: socket.userId,
        socketId: socket.id,
      });
    }

    //broadcast to all connected users that user is online:
    io.emit("user:active", {
      message: "List of active users",
      data: activeUsers,
    });
    
    callback({
      status: "OK",
      message: "List of active users",
      data: activeUsers,
    });
  };
};
