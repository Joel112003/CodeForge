import { Queue, Worker } from "bullmq";

import redis from "../config/redis.js";
import executeCode from "./executionEngine.js";
import { getSocket } from "./socketHandlers.js";

const executionQueue = new Queue("execution", { connection: redis });

const worker = new Worker(
  "execution",
  async (job) => {
    const { language, code, socketId } = job.data;
    const socket = getSocket(socketId);
    await executeCode(language, code, (chunk, type) => {
      socket?.emit("output", { data: chunk, type });
    });
  },
  {
    connection: redis,
    concurrency: 5,
  },
);

export default executionQueue;