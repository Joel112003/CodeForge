import validateEnv from "./src/config/env.js";
import dotenv from "dotenv";

// CRITICAL: Load env vars BEFORE validation
dotenv.config();
validateEnv();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./src/routes/auth.routes.js";
import executeRoutes from "./src/routes/execute.routes.js";
import roomRoutes from "./src/routes/room.routes.js";
import errorHandler from "./src/middleware/errorHandler.js";
import { apiLimiter } from "./src/middleware/rateLimiter.js";
import { cleanupOrphanContainers } from "./src/services/containerCleanup.js";
import setupSocket from "./src/services/socketHandlers.js";
import csrfProtection from "./src/middleware/csrfProtection.js";
import { setIo } from "./src/services/queue.js";

const app = express();
app.set("trust proxy", 1);
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Wire socket handlers and give the queue access to `io`
setupSocket(io);
setIo(io);

const clientOrigin = process.env.CLIENT_URL;

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        connectSrc: ["'self'", clientOrigin, "ws:", "wss:"].filter(Boolean),
        imgSrc: ["'self'", "data:"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
      },
    },
    hsts: process.env.NODE_ENV === "production",
  }),
);
app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(apiLimiter);
app.use(csrfProtection);

app.use("/api/auth", authRoutes);
app.use("/api/execute", executeRoutes);
app.use("/api/rooms", roomRoutes);
// Backwards-compatible aliases
app.use("/api", executeRoutes);
app.use("/api/room", roomRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is healthy" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Cleanup orphan containers on startup
await cleanupOrphanContainers().catch((err) =>
  console.error("Cleanup error:", err),
);