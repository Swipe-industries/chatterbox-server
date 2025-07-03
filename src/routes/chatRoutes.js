import express from "express";
import { createChat, userChats, findChat } from "../controllers/chatControllers.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.get("/chat/user", authMiddleware, userChats)
router.post("/chat/create", authMiddleware, createChat)
router.get("/chat/find/:user1Id/:user2Id", authMiddleware, findChat)

export default router