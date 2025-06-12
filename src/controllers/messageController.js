import { messages } from "../models/messageModel.js";
import { db } from "../../config/db.js";
import { eq, sql } from "drizzle-orm";
import status from "http-status";
import { chats } from "../models/chatModel.js";

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
  const { limit = 20, before } = req.query;

  // const appendReceiverIds = async (messages) => {
  //   for (const message of messages) {
  //     const chat = await db
  //       .select()
  //       .from(chats)
  //       .where(
  //         eq(chats.id, message.chatId)
  //       )
  //       .limit(1);

  //     if (chat.length > 0) {
  //       const receiverId =
  //         chat[0].user1Id === message.senderId
  //           ? chat[0].user2Id
  //           : chat[0].user1Id;
  //       message.receiverId = receiverId;
  //     }
  //   }
  //   return messages;
  // };

  try {
    //retrieving all the messages based on chatId
    const allMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId));

    // const data = await appendReceiverIds(allMessages);
      
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
