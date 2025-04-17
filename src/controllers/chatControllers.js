import { sql } from "drizzle-orm";
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
  try {
    const loggedInUserId = req.params.userId;

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
        error: "No chats found for the given user",
      });
    }

    // Step 2: Extract other participant IDs
    const chatDetails = await Promise.all(
      userChatsData.map(async (chat) => {
        const participantId =
          chat.user1Id === loggedInUserId ? chat.user2Id : chat.user1Id;

        // Step 3: Get participant details
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, participantId))
          .limit(1);

        // Step 4: Get latest message + unread count in one query
        const messagesData = await db
          .select({
            content: messages.content,
            createdAt: messages.createdAt,
            isRead: messages.isRead,
            senderId: messages.senderId,
          })
          .from(messages)
          .where(eq(messages.chatId, chat.id))
          .orderBy(messages.createdAt, "desc");

        const lastMessage =
          messagesData.length > 0 ? messagesData[0].content : "";
        const unreadCount = messagesData.filter(
          (message) => !message.isRead
        ).length;

        return {
          chatId: chat.id,
          id: user?.id || null,
          name: user?.name || "Unknown",
          gender: user?.gender || "Unknown",
          lastMessage,
          updatedAt: chat.updatedAt,
          unreadCount,
        };
      })
    );

    // Return the retrieved chats
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
