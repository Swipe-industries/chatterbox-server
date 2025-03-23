import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config()

export default defineConfig({
  schema: './src/models',
  out: './drizzle',
  dialect: 'postgresql', // 'postgresql' | 'mysql' | 'sqlite'
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});