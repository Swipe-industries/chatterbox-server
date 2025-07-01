import { messages } from "../models/messageModel.js";
import { db } from "../config/db.js";
import { eq, asc } from "drizzle-orm";
import status from "http-status";

export const addMessage = async (req, res) => {
  try {
    //saving the message in the table:
    const messaggeData = await db.insert(messages).values(req.body).returning();

    return res.status(200).json(messaggeData[0]);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
};

export const getMessage = async (req, res) => {
  const chatId = req.params.chatId;
  const { limit = 20, cursor } = req.query;

  try {
    //retrieving all the messages based on chatId
    const allMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt))
      .limit(Number(limit));
      
    return res.status(status.OK).json({
      status: status.OK,
      message: "All messages fetched",
      data: allMessages
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
};
