import { Redis } from "ioredis";

const redis = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
  }
);

redis.once("connect", () => {
  console.log("Redis connected ");
});

redis.on("ready", () => {
  console.log("Redis ready ");
});

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

export default redis;