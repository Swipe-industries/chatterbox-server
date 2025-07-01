import express from "express";
import { createChat, userChats, findChat } from "../controllers/chatControllers.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.post("/chats/create", createChat)
router.get("/chats/all", authMiddleware, userChats)
router.get("/chats/find/:user1Id/:user2Id", findChat)

export default router