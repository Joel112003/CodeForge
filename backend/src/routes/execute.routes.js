import express from "express";
import {
  execute,
  getHistory,
  getExecutionById,
} from "../controllers/execute.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { executionLimiter } from "../middleware/rateLimiter.js";
import validateExecution from "../middleware/validateExecution.js";

const router = express.Router();

router.post(
  "/run",
  executionLimiter,
  authenticateToken,
  validateExecution,
  execute,
);
router.get("/history", authenticateToken, getHistory);
router.get("/history/:id", authenticateToken, getExecutionById);

export default router;
