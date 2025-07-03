import { and, eq, or, sql } from "drizzle-orm";
import { chats } from "../models/chatModel.js";
import { db } from "../config/db.js";
import status from "http-status";
import { getErrorResponse, getSuccessResponse } from "../utils/response.js";
import { newChatValidator } from "../utils/validation.js";
import { users } from "../models/userModel.js";

export const userChats = async (req, res) => {
  try {
    const loggedInUserId = req.user.userId;

    const response = await db.execute(
      sql`
      SELECT 
      c.id AS "chatId",
      u.name,
      u.gender,
      m.content AS "lastMessage",
      m.message_type AS "lastMessageType",
      m.created_at AS "messageTime",
      COALESCE(unread.count, 0) AS "unreadCount"
      FROM chats c
      JOIN users u ON (u.id = CASE WHEN c.user1_id = ${loggedInUserId} THEN c.user2_id ELSE c.user1_id END)
      LEFT JOIN LATERAL (
      SELECT *
      FROM messages m
      WHERE m.chat_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 1
      ) m ON true
      LEFT JOIN LATERAL (
      SELECT count(*) as count
      FROM messages m2
      WHERE m2.chat_id = c.id AND m2.is_read = false AND m2.sender_id != ${loggedInUserId}
      ) unread ON true
      WHERE c.user1_id = ${loggedInUserId} OR c.user2_id = ${loggedInUserId}
      ORDER BY m.created_at DESC;
    `,
      {
        loggedInUserId,
      }
    );

    if (response.rowCount === 0) {
      return res
        .status(status.NOT_FOUND)
        .json(getErrorResponse(status.NOT_FOUND, "No chats found!"));
    }

    return res
      .status(status.OK)
      .json(
        getSuccessResponse(
          status.OK,
          "Chats retrieved successfully",
          response.rows
        )
      );
  } catch (error) {
    console.error("Error retrieving user chats:", error);
    return res
      .status(status.INTERNAL_SERVER_ERROR)
      .json(getErrorResponse(status.INTERNAL_SERVER_ERROR));
  }
};

export const createChat = async (req, res) => {
  try {
    const senderId = req.user.userId;
    newChatValidator(req);

    const { receiverId } = req.body;

    //prevent self-chat:
    if (senderId === receiverId) {
      throw new Error("Cannot create chat with yourself!");
    }

    //check if reveriver exists in DB:
    const reveriver = await db
      .select()
      .from(users)
      .where(eq(users.id, receiverId));

    if (reveriver.length === 0) {
      throw new Error("Receiver not found with given Id");
    }

    // Check if the chat already exists
    const existingChat = await db
      .select()
      .from(chats)
      .where(
        and(
          or(eq(chats.user1Id, senderId), eq(chats.user1Id, receiverId)),
          or(eq(chats.user2Id, senderId), eq(chats.user2Id, receiverId))
        )
      );

    if (existingChat.length > 0) {
      return res.status(status.CONFLICT).json(
        getSuccessResponse(status.CONFLICT, "Chat already exists", {
          chatId: existingChat[0].id,
        })
      );
    }

    // Create a new chat
    const newChat = await db
      .insert(chats)
      .values({ user1Id: senderId, user2Id: receiverId })
      .returning();

    return res
      .status(status.CREATED)
      .json(
        getSuccessResponse(
          status.CREATED,
          "New chat created successfully",
          newChat
        )
      );
  } catch (err) {
    return res
      .status(status.INTERNAL_SERVER_ERROR)
      .json(getErrorResponse(status.INTERNAL_SERVER_ERROR, err.message));
  }
};

export const findChat = async (req, res) => {
  try {
    const user1Id = req.params.user1Id;
    const user2Id = req.params.user2Id;

    // Validate that both user1Id and user2Id are provided
    if (!user1Id || !user2Id) {
      return res.status(400).json("Both user1Id and user2Id are required");
    }

    // Query the database to find the chat between user1Id and user2Id
    const userChat = await db
      .select()
      .from(chats)
      .where(
        sql`${chats.user1Id} IN (${user1Id}, ${user2Id}) 
          OR ${chats.user2Id} IN (${user1Id}, ${user2Id})`
      );

    //handling if no chats found then based on response the client can be programed to create a new chat
    if (userChat.length === 0) return res.status(400).json("No chats found");

    // Send the result back as a JSON response
    return res.status(200).json(userChat);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
};
