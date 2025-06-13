import { inArray, sql } from "drizzle-orm";
import { chats } from "../models/chatModel.js";
import { db } from "../../config/db.js";
import status from "http-status";
import { users } from "../models/userModel.js";
import { messages } from "../models/messageModel.js";
import { eq } from "drizzle-orm";

export const createChat = async (req, res) => {
  try {
    const { user1Id, user2Id } = req.body;

    // Validate input
    if (!user1Id || !user2Id) {
      return res.status(status.BAD_REQUEST).json({
        status: status.BAD_REQUEST,
        message: "Both user1Id and user2Id are required",
      });
    }

    // Check if the chat already exists
    const existingChat = await db
      .select()
      .from(chats)
      .where(
        sql`${chats.user1Id} = ${user1Id} AND ${chats.user2Id} = ${user2Id}`
      );

    if (existingChat.length > 0) {
      return res.status(status.CONFLICT).json({
        status: status.CONFLICT,
        message: "Chat already exists",
        data: existingChat[0],
      });
    }

    // Create a new chat
    const [newChat] = await db
      .insert(chats)
      .values({ user1Id, user2Id })
      .returning();

    return res.status(status.CREATED).json({
      status: status.CREATED,
      message: "Chat created successfully",
      data: newChat,
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    return res.status(status.INTERNAL_SERVER_ERROR).json({
      status: status.INTERNAL_SERVER_ERROR,
      message: "An error occurred while creating the chat",
    });
  }
};

export const userChats = async (req, res) => {
  // const getLastMessage = (messagesData) => {
  //   if (!messagesData || messagesData.length === 0) {
  //     return ""; // Return an empty string if no messages are available
  //   }
  //   return messagesData.reduce((latest, current) => {
  //     return new Date(current.createdAt) > new Date(latest.createdAt)
  //       ? current
  //       : latest;
  //   }, messagesData[0]);
  // };

  try {
    const loggedInUserId = req.user.id;

    // Step 1: Fetch all the chats where the user is a participant
    const userChatsData = await db
      .select()
      .from(chats)
      .where(
        sql`${chats.user1Id} = ${loggedInUserId} OR ${chats.user2Id} = ${loggedInUserId}`
      );

    // Handle case where no chats are found
    if (!userChatsData || userChatsData.length === 0) {
      return res.status(status.NOT_FOUND).json({
        status: status.NOT_FOUND,
        message: "No chats found!",
      });
    }

    const chatIds = userChatsData.map((chat) => chat.id);
    const receiverIds = userChatsData.map((chat) =>
      chat.user1Id === loggedInUserId ? chat.user2Id : chat.user1Id
    );

    // Step 2: Fetch reveiver's details in one go
    const reveivers = await db
      .select()
      .from(users)
      .where(inArray(users.id, receiverIds));

    const userMap = new Map(reveivers.map((user) => [user.id, user]));

    // Step 3: Fetch latest messages per chat (1 per chat)
    const latestMessages = await Promise.all(
      chatIds.map(async (chatId) => {
        const [latest] = await db
          .select({
            content: messages.content,
            createdAt: messages.createdAt
          })
          .from(messages)
          .where(eq(messages.chatId, chatId))
          .orderBy(messages.createdAt, "desc")
          .limit(1);
        return { ...latest, chatId };
      })
    );

    const latestMessageMap = new Map(
      latestMessages.map((msg) => [msg.chatId, msg])
    );

    // Step 4: Fetch unread message counts per chat
    const unreadCounts = await Promise.all(
      chatIds.map(async (chatId) => {
        const result = await db.execute(
          sql`SELECT COUNT(*)::int AS count FROM ${messages} WHERE ${messages.chatId} = ${chatId} AND ${messages.isRead} = false`
        );
        const count = result.rows?.[0]?.count || 0;
        return { chatId, count };
      })
    );

    const unreadCountMap = new Map(
      unreadCounts.map((entry) => [entry.chatId, entry.count])
    );

    // Step 5: Build final chat list
    const chatDetails = userChatsData.map((chat) => {
      const participantId =
        chat.user1Id === loggedInUserId ? chat.user2Id : chat.user1Id;

      const user = userMap.get(participantId);
      const lastMessage = latestMessageMap.get(chat.id);
      const unreadCount = unreadCountMap.get(chat.id) || 0;

      return {
        chatId: chat.id,
        userId: user?.id || null,
        name: user?.name || "Unknown",
        gender: user?.gender || "Unknown",
        lastMessage: lastMessage?.content || "",
        lastSeen: lastMessage?.createdAt || chat.createdAt,
        unreadCount,
      };
    });

    return res.status(status.OK).json({
      status: status.OK,
      message: "Chats retrieved successfully",
      chats: chatDetails,
    });
  } catch (error) {
    console.error("Error retrieving user chats:", error);
    return res.status(status.INTERNAL_SERVER_ERROR).json({
      status: status.INTERNAL_SERVER_ERROR,
      message: "An error occurred while retrieving user chats",
    });
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
