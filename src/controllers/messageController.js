import { messages } from "../models/messageModel.js";
import { db } from "../config/db.js";
import { eq, and, lt, desc } from "drizzle-orm";
import status from "http-status";
import validator from "validator";
import { getErrorResponse, getSuccessResponse } from "../utils/response.js";

export const getConversation = async (req, res) => {
  try {
    const chatId = req.params.chatId;
    const { limit = 20, cursor } = req.query;

    //validation:
    if (!validator.isUUID(chatId)) {
      throw new Error("Invalid chatId");
    }
    if (Number(limit) > 30) {
      throw new Error("Invalid limit");
    }
    if (cursor && !validator.isISO8601(cursor)) {
      throw new Error("Invalid cursor format");
    }

    //building conditional query
    const conditions = [eq(messages.chatId, chatId)];
    if (cursor) {
      const dateCursor = new Date(cursor);
      if (isNaN(dateCursor)) {
        throw new Error("Invalid cursor date");
      }
      conditions.push(lt(messages.createdAt, dateCursor));
    }

    //retrieving all the messages based on chatId
    const allMessages = await db
      .select()
      .from(messages)
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt))
      .limit(Number(limit));

    return res
      .status(status.OK)
      .json(getSuccessResponse(status.OK, "User conversation", allMessages));
  } catch (error) {
    return res
      .status(status.INTERNAL_SERVER_ERROR)
      .json(getErrorResponse(status.INTERNAL_SERVER_ERROR, error.message));
  }
};

export const markMessagesRead = async (req, res) => {
  try {
    const { chatId } = req.body;

    if (!validator.isUUID(chatId)) {
      throw new Error("Invalid chatId");
    }

    const response = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.chatId, chatId));

    return res
      .status(status.OK)
      .json(
        getSuccessResponse(status.OK, "Marked messages as read", {
          rowsUpdated: response.rowCount,
        })
      );
  } catch (err) {
    return res
      .status(status.INTERNAL_SERVER_ERROR)
      .json(getErrorResponse(status.INTERNAL_SERVER_ERROR, err.message));
  }
};
