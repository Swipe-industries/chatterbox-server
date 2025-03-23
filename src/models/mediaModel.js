import {
  pgTable,
  foreignKey,
  varchar,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { messages } from "./messageModel.js";

export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: uuid("message_id").notNull(), // Foreign key to messages table
    fileName: varchar("file_name", { length: 255 }).notNull(), // Name of the file
    fileType: varchar("file_type", { length: 50 }).notNull(), // Type of file (e.g., image, video)
    fileUrl: varchar("file_url", { length: 255 }).notNull(), // URL where the file is stored
    uploadedAt: timestamp("uploaded_at").defaultNow(),
  },
  (table) => ({
    messageFk: foreignKey({
      columns: [table.messageId],
      foreignColumns: [messages.id],
      onDelete: "cascade",
    }),
  })
);
