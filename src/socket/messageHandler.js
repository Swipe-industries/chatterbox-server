import { db } from "../config/db.js";
import { or, and, eq } from "drizzle-orm";
import validator from "validator";
import { getErrorResponse, getSuccessResponse } from "../utils/response.js";
import { messages } from "../models/messageModel.js";
import { chats } from "../models/chatModel.js";

export const sendMessage = ({ io, socket, activeUsers }) => {
  return async (payload, callback) => {
    if (typeof callback !== "function") return;

    const ALLOWED_FIELDS = [
      "chatId",
      "content",
      "messageType",
      "isRead",
      "receiverId",
    ];
    const loggedInUserId = socket.userId;

    try {
      // Validate payload keys
      const keysValid = Object.keys(payload).every((key) =>
        ALLOWED_FIELDS.includes(key)
      );
      if (!keysValid) throw new Error("Invalid payload fields");

      if (!payload.content || !payload.receiverId) {
        throw new Error("content and receiverId are required");
      }

      let chatId = payload.chatId;

      if (chatId && !validator.isUUID(chatId)) {
        throw new Error("Invalid chatId");
      }

      // Check if receiver is online
      const receiver = activeUsers.find(
        (user) => user.userId === payload.receiverId
      );
      const isReceiverOnline = !!receiver;

      // If no chatId provided, find or create
      if (!chatId) {
        // Create new chat
        const newChatRes = await db
          .insert(chats)
          .values({ user1Id: loggedInUserId, user2Id: payload.receiverId })
          .returning({ id: chats.id });

        if (newChatRes.length === 0)
          throw new Error("Failed to create new chat");

        chatId = newChatRes[0].id;
      }

      // Create message payload
      const messagePayload = {
        chatId,
        senderId: loggedInUserId,
        content: payload.content,
        messageType: payload.messageType || "text",
        isRead: isReceiverOnline,
      };

      const messageRes = await db
        .insert(messages)
        .values(messagePayload)
        .returning();

      // Emit to receiver if online
      if (isReceiverOnline && receiver.socketId) {
        io.to(receiver.socketId).emit(
          "message:receive",
          getSuccessResponse("OK", "New message", messageRes)
        );
      }

      callback(getSuccessResponse("OK", "Message sent", messageRes));
    } catch (err) {
      console.error("sendMessage error:", err);
      callback(getErrorResponse("INTERNAL_SERVER_ERROR", err.message));
    }
  };
};
