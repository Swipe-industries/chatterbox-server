import express from "express";
import { addMessage, getMessage} from "../controllers/messageController.js"
import { authMiddleware } from "../middlewares/auth.js";


const router = express.Router();

router.post('/add', addMessage);
router.get('/:chatId',authMiddleware, getMessage);


export default router;