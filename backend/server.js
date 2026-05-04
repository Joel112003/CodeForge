import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./src/routes/auth.routes.js";
import executeRoutes from "./src/routes/execute.routes.js";
import roomRoutes from "./src/routes/room.routes.js";
import errorHandler from "./src/middleware/errorHandler.js";
import { apiLimiter, executionLimiter } from "./src/middleware/rateLimiter.js";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
  },
});

const socketHandlers = await import("./src/services/socketHandlers.js");
socketHandlers.default(io);

app.use(helmet())                    
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
}))                                  
app.use(express.json())              
app.use(apiLimiter)                  

app.use("/api/auth", authRoutes);
app.use("/api/execute", executionLimiter, executeRoutes);  
app.use("/api/rooms", roomRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is healthy" });
});

app.use(express.static("src/../"));

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});