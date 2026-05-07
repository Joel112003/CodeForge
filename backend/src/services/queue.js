import { Queue, Worker } from "bullmq";
import redis from "../config/redis.js";
import executeCode, { normalizeLanguage } from "./executionEngine.js";
import pool from "../config/db.js";

const executionQueue = new Queue("execution", {
  connection: redis,
  defaultJobOptions: { attempts: 1, removeOnComplete: 100, removeOnFail: 500 },
});

// `io` is injected by server.js after the Socket.IO server is created.
// This breaks the circular dependency with socketHandlers.js.
let _io = null;
export function setIo(io) {
  _io = io;
}

const worker = new Worker(
  "execution",
  async (job) => {
    const { language, code, socketId, roomId, userId } = job.data;
    const normalizedLanguage = normalizeLanguage(language);

    // Resolve the socket for the requesting client
    const socket = _io?.sockets?.sockets?.get(socketId) ?? null;

    if (!socket) {
      console.warn("[queue] socket not found — client may have disconnected", { socketId });
    }

    const isGuest = !userId;
    let executionId = null;
    const startTime = Date.now();

    // Persist initial record for authenticated users only
    if (!isGuest) {
      const execution = await pool.query(
        `INSERT INTO executions (user_id, language, code, status)
         VALUES ($1, $2, $3, 'RUNNING') RETURNING id`,
        [userId, normalizedLanguage, code],
      );
      executionId = execution.rows[0].id;
    }

    const outputChunks = [];

    try {
      // Tell the client execution has started
      socket?.emit("status", "RUNNING");

      await executeCode(normalizedLanguage, code, (chunk, type) => {
        outputChunks.push(chunk);

        const payload = { output: chunk, data: chunk, type };

        // Send to the requesting client
        socket?.emit("output", payload);

        // Broadcast to everyone else in the room (collaborative editing)
        if (roomId && socket) {
          socket.to(roomId).emit("output", payload);
        }
      });

      const duration = Date.now() - startTime;
      const fullOutput = outputChunks.join("");

      // Persist result
      if (executionId) {
        await pool.query(
          `UPDATE executions SET status = 'COMPLETED', output = $1, duration_ms = $2 WHERE id = $3`,
          [fullOutput, duration, executionId],
        );
      }

      socket?.emit("status", "COMPLETED");
    } catch (err) {
      if (executionId) {
        await pool.query(
          `UPDATE executions SET status = 'ERROR', output = $1 WHERE id = $2`,
          [err.message, executionId],
        );
      }
      socket?.emit("status", "ERROR");
      socket?.emit("output", { output: err.message, data: err.message, type: "stderr" });
    }
  },
  {
    connection: redis,
    concurrency: 5,
  },
);

worker.on("completed", (job) => {
  console.log(`[queue] job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[queue] job ${job.id} failed: ${err.message}`);
});

export default executionQueue;
