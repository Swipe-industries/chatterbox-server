import {
  uuid,
  pgTable,
  varchar,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { timestamps } from "./columns.helper.js";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    username: varchar("username", { length: 50 }).notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    gender: varchar("gender", { length: 7 }).notNull(),
    lastSeen: timestamp("last_seen"),
    ...timestamps,
  },
  (table) => ({
    usernameUnique: uniqueIndex("username_idx").on(table.username),
  })
);
