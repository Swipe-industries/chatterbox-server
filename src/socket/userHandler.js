import { db } from "../config/db.js";
import { users } from "../models/userModel.js";
import { sql, eq } from "drizzle-orm";
import { getSuccessResponse } from "../utils/response.js";

export const updateLastSeen = async ({ io, socket, activeUsers }) => {
  try {
    await db
      .update(users)
      .set({ lastSeen: sql`NOW()` })
      .where(eq(users.id, socket.userId));
  } catch (err) {
    console.error("Error in updating lastSeen: ", err);
  }
  io.emit(
    "users:active",
    getSuccessResponse("OK", "Updated active users", activeUsers)
  );
};

export const handleUserTyping = ({ io, socket, activeUsers }) => {
  return async (payload) => {
    const senderId = socket.userId;
    const receiverId = payload.receiverId;

    const receiver = activeUsers.find((user) => user.userId === receiverId);
    if (receiver) {
      io.to(receiver.socketId).emit("user:typing", getSuccessResponse("OK", "User is typing", {userId: senderId}));
    }
  };
};

export const handleUserNotTyping = ({ io, socket, activeUsers }) => {
  return async (payload) => {
    const senderId = socket.userId;
    const receiverId = payload.receiverId;

    const receiver = activeUsers.find((user) => user.userId === receiverId);
    if (receiver) {
      io.to(receiver.socketId).emit("user:notTyping", getSuccessResponse("OK", "User stopped typing", {userId: senderId}));
    }
  };
};
