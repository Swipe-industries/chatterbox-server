import { db } from "../config/db.js";
import validator from "validator";
import { getErrorResponse, getSuccessResponse } from "../utils/response.js";
import { messages } from "../models/messageModel.js";

export const sendMessage = ({ io, socket, activeUsers }) => {
  return async (payload, callback) => {
    if (typeof callback !== "function") {
      return;
    }

    const ALLOWED_FIELDS = [
      "chatId",
      "content",
      "messageType",
      "isRead",
      "receiverId",
    ];
    let isReceiverOnline = false;

    try {
      //vaidate the payload
      if (!Object.keys(payload).every((key) => ALLOWED_FIELDS.includes(key))) {
        throw new Error("Invalid Payload");
      }

      if (!validator.isUUID(payload.chatId)) {
        throw new Error("Invalid chatId");
      }

      //checking if receiver is online or not
      const receiver = activeUsers.filter(
        (user) => user.userId === payload.receiverId
      );
      if (receiver.length > 0) {
        isReceiverOnline = true;
      }

      const message = {
        chatId: payload.chatId,
        senderId: socket.userId,
        content: payload.content,
        isRead: isReceiverOnline,
      };

      const response = await db.insert(messages).values(message).returning();

      //emit an event to the reveriver to let him fetch the message in real time: (if online)
      if (isReceiverOnline) {
        io.to(receiver[0].socketId).emit(
            "message:receive",
            getSuccessResponse("OK", "New message", response)
          );
      }

      callback(getSuccessResponse("OK", "Message sent", response));
    } catch (err) {
      return callback(getErrorResponse("INTERNAL_SERVER_ERROR", err.message));
    }
  };
};
