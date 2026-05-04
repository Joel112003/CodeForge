import express from "express";
import { createRoomHandler, getRoomHandler } from "../controllers/room.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticateToken, createRoomHandler);
router.get("/:roomID", authenticateToken, getRoomHandler);

export default router;
