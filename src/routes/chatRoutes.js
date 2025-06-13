import express from "express";
import { createChat, userChats, findChat } from "../controllers/chatControllers.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.post("/create", createChat)
router.get("/all", authMiddleware, userChats)
router.get("/find/:user1Id/:user2Id", findChat)

export default router