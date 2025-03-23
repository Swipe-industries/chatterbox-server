import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  boolean,
  foreignKey
} from "drizzle-orm/pg-core";
import { chats } from "./chatModel.js";
import { users } from "./userModel.js";

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chatId: uuid("chat_id"), // Foreign key to chats table
    senderId: uuid("sender_id"), // Foreign key to users table
    content: text("content"), // Message content (could be null if it's a media-only message)
    messageType: varchar("message_type", { length: 50 }).default("text"), // Type of message (e.g., text, image, video)
    createdAt: timestamp("created_at").defaultNow().notNull(),
    isRead: boolean("is_read").default(false),
  },
  (table) => ({
    chatFk: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chats.id],
      onDelete: "cascade",
    }),
    senderFk: foreignKey({
      columns: [table.senderId],
      foreignColumns: [users.id],
      onDelete: "cascade",
    }),
  })
);
