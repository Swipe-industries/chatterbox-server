import express from "express";
import { getConversation, markMessagesRead} from "../controllers/messageController.js"
import { authMiddleware } from "../middlewares/auth.js";


const router = express.Router();

router.get('/message/conversation/:chatId',authMiddleware, getConversation);
router.patch('/message/isRead', authMiddleware, markMessagesRead);


export default router;