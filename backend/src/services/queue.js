import { Queue, Worker } from "bullmq";
import redis from "../config/redis.js";
import executeCode, { normalizeLanguage } from "./executionEngine.js";
import pool from "../config/db.js";
import { cacheGet, cacheSet } from "./executionCache.js";
import circuitBreaker from "./circuitBreaker.js";
import { consumeToken } from "./fairScheduler.js";
import { recordMetric, MetricNames } from "./metricsCollector.js";
import { addToDLQ } from "./dlqManager.js";

const executionQueue = new Queue("execution", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: 100,
    removeOnFail: 500,
    backoff: {
      type: "exponential",
      delay: 1000, // 1s, 2s, 4s
    },
  },
});


let _io = null;
export function setIo(io) {
  _io = io;
}


export async function enqueueExecution({ language, code, socketId, roomId, userId, sessionId }) {
  const { priority } = await consumeToken(userId);

  await executionQueue.add(
    "run",
    { language, code, socketId, roomId, userId, sessionId },
    { priority },
  );

  await recordMetric(MetricNames.QUEUE_ADDED);
}

const worker = new Worker(
  "execution",
  async (job) => {
    const { language, code, socketId, roomId, userId, sessionId } = job.data;
    const normalizedLanguage = normalizeLanguage(language);

    const socket = _io?.sockets?.sockets?.get(socketId) ?? null;

    if (!socket) {
      console.warn("[queue] socket not found — client may have disconnected", { socketId });
    }

    const cbCheck = circuitBreaker.canExecute();
    if (!cbCheck.allowed) {
      await recordMetric(MetricNames.CIRCUIT_BREAKER_REJECTIONS);
      socket?.emit("status", { status: "ERROR", sessionId });
      socket?.emit("output", {
        output: cbCheck.reason,
        data: cbCheck.reason,
        type: "stderr",
        sessionId,
      });
      return;
    }

    const cached = await cacheGet(normalizedLanguage, code);
    if (cached.hit) {
      await recordMetric(MetricNames.CACHE_HITS);

      socket?.emit("status", { status: "RUNNING", sessionId });

      const payload = { output: cached.output, data: cached.output, type: "stdout", sessionId, cached: true };
      socket?.emit("output", payload);
      if (roomId && socket) {
        socket.to(roomId).emit("output", payload);
      }

      if (userId) {
        await pool.query(
          `INSERT INTO executions (user_id, language, code, status, output, duration_ms)
           VALUES ($1, $2, $3, 'COMPLETED', $4, $5)`,
          [userId, normalizedLanguage, code, cached.output, cached.duration_ms],
        );
      }

      socket?.emit("status", { status: "CACHED", sessionId });
      await recordMetric(MetricNames.QUEUE_COMPLETED);
      circuitBreaker.recordSuccess();
      return;
    }

    await recordMetric(MetricNames.CACHE_MISSES);

    const isGuest = !userId;
    let executionId = null;
    const startTime = Date.now();

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
      socket?.emit("status", { status: "RUNNING", sessionId });

      await executeCode(normalizedLanguage, code, (chunk, type) => {
        outputChunks.push(chunk);

        const payload = { output: chunk, data: chunk, type, sessionId };

        // Send to the requesting client
        socket?.emit("output", payload);

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

      // ── Cache the result ────────────────────────────────────────────
      await cacheSet(normalizedLanguage, code, fullOutput, duration);

      // ── Record metrics ──────────────────────────────────────────────
      await recordMetric(MetricNames.EXECUTIONS);
      await recordMetric(MetricNames.LATENCY, duration);
      await recordMetric(MetricNames.QUEUE_COMPLETED);

      circuitBreaker.recordSuccess();
      socket?.emit("status", { status: "COMPLETED", sessionId });
    } catch (err) {
      const duration = Date.now() - startTime;

      if (executionId) {
        await pool.query(
          `UPDATE executions SET status = 'ERROR', output = $1, duration_ms = $2 WHERE id = $3`,
          [err.message, duration, executionId],
        );
      }

      await recordMetric(MetricNames.ERRORS);
      await recordMetric(MetricNames.LATENCY, duration);
      circuitBreaker.recordFailure();

      socket?.emit("status", { status: "ERROR", sessionId });
      socket?.emit("output", { output: err.message, data: err.message, type: "stderr", sessionId });

      // Re-throw so BullMQ can retry with exponential backoff
      throw err;
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
  console.error(`[queue] job ${job.id} failed (attempt ${job.attemptsMade}): ${err.message}`);

  // If max retries exhausted, move to Dead Letter Queue
  if (job.attemptsMade >= (job.opts?.attempts || 3)) {
    addToDLQ(job, err).catch((dlqErr) =>
      console.error(`[queue] failed to add to DLQ: ${dlqErr.message}`)
    );
    recordMetric(MetricNames.QUEUE_FAILED).catch(() => {});
  }
});

export default executionQueue;
