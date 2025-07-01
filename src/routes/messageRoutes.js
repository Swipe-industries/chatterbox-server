import express from "express";
import { addMessage, getMessage} from "../controllers/messageController.js"
import { authMiddleware } from "../middlewares/auth.js";


const router = express.Router();

router.post('/messages/add', addMessage);
router.get('/messages/:chatId',authMiddleware, getMessage);


export default router;