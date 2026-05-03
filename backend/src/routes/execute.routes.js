import express from "express";
import { execute } from "../controllers/execute.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/run", authenticateToken, execute);

export default router;
