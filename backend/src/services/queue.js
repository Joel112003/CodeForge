import { Queue, Worker } from "bullmq";

import redis from "../config/redis.js";
import executeCode from "./executionEngine.js";
import { getSocket } from "./socketHandlers.js";
import pool from "../config/db.js";

const executionQueue = new Queue("execution", {
  connection: redis,
  defaultJobOptions: { attempts: 1, removeOnComplete: 100, removeOnFail: 500 },
});

const worker = new Worker(
  "execution",
  async (job) => {
    const { language, code, socketId, roomId } = job.data;
    const socket = getSocket(socketId);

    // updated execution status in db
    const execution = await pool.query(
      `INSERT INTO executions 
      (user_id, language, code, status)
      VALUES ($1, $2, $3, 'RUNNING) RETURNING id`,
      [job.data.userId, language, code],
    );
    const executionId = execution.rows[0].id;
    const startTime = Date.now();

    try {
      socket?.emit("status", "RUNNING");
      await executeCode(language, code, (chunk, type) => {
        //send to the user who executed the code
        socket?.emit("output", { output: chunk, type });
      });

      // If in a room, send to everyone in that room too
      // io is not directly accessible here so we use socket
      if (roomId) {
        socket?.to(roomId).emit("output", { data: chunk, type });
      }

      const duration = Date.now() - startTime;

      //save execution result in db
      await pool.query(
        `UPDATE executions SET status = 'COMPLETED',  duration_ms = $1 WHERE id = $2`,
        [duration, executionId],
      );
      socket?.emit("status", "COMPLETED");
    } catch (err) {
      await pool.query(`UPDATE executions SET status = 'ERROR' WHERE id = $1`, [
        executionId,
      ]);
      socket?.emit("status", "ERROR");
      socket?.emit("output", { output: err.message, type: "stderr" });
    }
  },
  {
    connection: redis,
    concurrency: 5,
  },
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed with error: ${err.message}`);
});

export default executionQueue;
