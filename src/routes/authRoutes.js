import express from "express";
import { signup, loginUser, logout } from "../controllers/authControllers.js";

const router = express.Router();

router.post("/auth/signup", signup);
router.post("/auth/login", loginUser);
router.delete("/auth/logout", logout);

export default router;