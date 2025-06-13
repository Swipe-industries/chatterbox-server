import express from "express";
import { searchUser, getUser, checkUsername, getAllUsers } from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.get("/search-user/:username", searchUser)
router.get("/get-user/:id", getUser)
router.get("/check-username", checkUsername)
router.get("/all-users",authMiddleware, getAllUsers)

export default router;