import { pgTable, timestamp, uuid, foreignKey, unique } from "drizzle-orm/pg-core";
import { users } from "./userModel.js";

export const chats = pgTable(
  "chats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user1Id: uuid("user1_id").notNull(), // First user in the chat
    user2Id: uuid("user2_id").notNull(), // Second user in the chat
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueChat: unique().on(table.user1Id, table.user2Id), // Prevent duplicate chats
    user1Fk: foreignKey({
      columns: [table.user1Id],
      foreignColumns: [users.id],
      onDelete: "cascade",
    }),
    user2Fk: foreignKey({
      columns: [table.user2Id],
      foreignColumns: [users.id],
      onDelete: "cascade",
    }),
  })
);
