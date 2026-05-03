import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from "./src/routes/auth.routes.js";
import executeRoutes from "./src/routes/execute.routes.js";
import helmet from "helmet";
import errorHandler from "./src/middleware/errorHandler.js";

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

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use("/api/auth", authRoutes);
app.use("/api/execute", executeRoutes);

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
