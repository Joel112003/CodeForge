import { register, login, me, logout, refresh } from "../controllers/auth.controller.js";
import { loginLimiter, registerLimiter } from "../middleware/rateLimiter.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import express from "express";

const router = express.Router();

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.get("/me", authenticateToken, me);
router.post("/logout", logout);
router.post("/refresh", refresh);

export default router;