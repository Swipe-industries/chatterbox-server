import express from "express";
import { userChats, getNewUsers, findChatId } from "../controllers/chatControllers.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.get("/chat/user", authMiddleware, userChats);
router.get("/chat/users/:receiverId", authMiddleware, findChatId);
router.get("/chat/new/users", authMiddleware, getNewUsers);

export default router