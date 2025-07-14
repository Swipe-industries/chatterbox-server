import { and, eq, lt, or, sql } from "drizzle-orm";
import { chats } from "../models/chatModel.js";
import { db } from "../config/db.js";
import status from "http-status";
import { getErrorResponse, getSuccessResponse } from "../utils/response.js";
import { newChatValidator } from "../utils/validation.js";
import { users } from "../models/userModel.js";
import validator from "validator";

export const userChats = async (req, res) => {
  try {
    const loggedInUserId = req.user.userId;

    const response = await db.execute(
      sql`
      SELECT 
      c.id AS "chatId",
      u.id AS "userId",
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

export const getNewUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user.userId;
    //not taking care of pagination for now. will do that later on
    // const { limit = 10, cursor } = req.query;

    // //validating the limit:
    // if (Number(limit) > 10) {
    //   throw new Error("Invalid limit");
    // }
    // if (cursor && !validator.isISO8601(cursor)) {
    //   throw new Error("Invalid cursor format");
    // }

    // const conditions = [];
    // if(cursor){
    //   const dateCursor = new Date(cursor);
    //   if(NaN(dateCursor)){
    //     throw new Error("Invalid cursor date");
    //   }
    //   conditions.push(lt(users.createdAt, dateCursor));
    // }

    //fetching users from user table:
    const response = await db
      .select({
        userId: users.id,
        name: users.name,
        username: users.username,
        gender: users.gender,
        lastSeen: users.lastSeen,
        updatedAt: users.updatedAt,
        createdAt: users.createdAt,
        deletedAt: users.deletedAt,
      })
      .from(users);

    //removing self from the response:
    const usersData = response.filter((user) => user.userId !== loggedInUserId);
    res
      .status(status.OK)
      .json(
        getSuccessResponse(
          status.OK,
          "Available users on ChatterBox",
          usersData
        )
      );
  } catch (err) {
    return res
      .status(status.INTERNAL_SERVER_ERROR)
      .json(getErrorResponse(status.INTERNAL_SERVER_ERROR, err.message));
  }
};

export const findChatId = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const receiverId = req.params.receiverId;

    if (!validator.isUUID(receiverId)) {
      throw new Error("Invalid receiverId");
    }

    //prevent self-chat:
    if (senderId === receiverId) {
      throw new Error("Chats with self are not allowed");
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
      return res.status(status.OK).json(
        getSuccessResponse(status.OK, "Chat already exists", {
          existingChat: true,
          chatId: existingChat[0].id,
        })
      );
    } else {
      return res
        .status(status.OK)
        .json(
          getSuccessResponse(
            status.OK,
            "Chat not found, create on on new message!", {
              existingChat: false
            }
          )
        );
    }
  } catch (err) {
    return res
      .status(status.INTERNAL_SERVER_ERROR)
      .json(getErrorResponse(status.INTERNAL_SERVER_ERROR, err.message));
  }
};
