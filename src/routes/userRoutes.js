import express from "express";
import {
  searchUser,
  checkUsername,
  getLastSeen,
  resetPassword,
} from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.patch("/user/password", resetPassword);
router.get("/user/lastSeen/:userId", authMiddleware, getLastSeen);
router.get("/user/isUnique/:username", checkUsername);
router.get("/user/search", authMiddleware, searchUser);

export default router;
