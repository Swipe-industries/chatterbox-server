import express from "express";
import { searchUser, getUser, checkUsername, getAllUsers, getLastSeen } from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.get("/users/last-seen/:userId", authMiddleware, getLastSeen);
router.get("/users/search-user/:username", searchUser)
router.get("/users/get-user/:id", getUser)
router.get("/users/check-username", checkUsername)
router.get("/users/all",authMiddleware, getAllUsers)

export default router;