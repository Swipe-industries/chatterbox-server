import { config } from "dotenv";
config();
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
const sql = neon(connectionString);
const db = drizzle(sql);

console.log("DB client initialized successfully ✅");

//Following is nother way to verify the connection before starting the server

// async function verifyDbConnection() {
//   try {
//     await db.select().from(users).where(eq(users.username, "dev.user")); //verifying connection before starting the server
//     console.log("Database connection verified ✅");
//   } catch (error) {
//     console.error("DB verification failed ❌", error);
//     throw error;
//   }
// }

export { db };
