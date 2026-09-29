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
import setupSocket from "./src/services/socketHandlers.js";
import csrfProtection from "./src/middleware/csrfProtection.js";
import { setIo } from "./src/services/queue.js";

const app = express();
app.set("trust proxy", 1);
const httpServer = createServer(app);

const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isOriginAllowed(origin) {
  if (!origin) return true;
  return allowedOrigins.includes(origin);
}

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) callback(null, true);
      else callback(new Error(`[CORS] blocked: ${origin}`));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

setupSocket(io);
setIo(io);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        connectSrc: ["'self'", ...allowedOrigins, "ws:", "wss:"],
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
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) callback(null, true);
      else callback(new Error(`[CORS] blocked: ${origin}`));
    },
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
app.use("/api", executeRoutes);
app.use("/api/room", roomRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is healthy" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

export { app, httpServer, io };
export default app;
