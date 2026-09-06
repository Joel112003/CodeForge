import redis from "../config/redis.js";

/**
 * Dead Letter Queue Manager — handles failed jobs after max retries.
 *
 * System Design: DLQ + Retry with Exponential Backoff
 *   - BullMQ handles retry with backoff automatically (configured in queue.js)
 *   - After max retries exhausted, jobs land here for inspection and manual replay
 *   - Admin can view, replay, or purge DLQ entries
 *
 * Storage: Redis list + hash for each DLQ entry
 */

const DLQ_LIST = "dlq:jobs";
const DLQ_PREFIX = "dlq:entry:";
const DLQ_MAX_SIZE = 500;
const DLQ_TTL = 86400 * 7; // 7 days

/**
 * Add a failed job to the Dead Letter Queue.
 * Called by the BullMQ worker when a job exhausts all retries.
 */
export async function addToDLQ(job, error) {
  const entry = {
    jobId: job.id,
    name: job.name,
    data: JSON.stringify(job.data),
    error: error?.message || String(error),
    attemptsMade: String(job.attemptsMade || 0),
    failedAt: new Date().toISOString(),
    language: job.data?.language || "unknown",
    userId: job.data?.userId || "guest",
  };

  const entryKey = `${DLQ_PREFIX}${job.id}`;

  const pipeline = redis.pipeline();
  pipeline.hset(entryKey, entry);
  pipeline.expire(entryKey, DLQ_TTL);
  pipeline.lpush(DLQ_LIST, job.id);
  // Trim to max size — remove oldest entries
  pipeline.ltrim(DLQ_LIST, 0, DLQ_MAX_SIZE - 1);
  await pipeline.exec();

  console.log(`[dlq] Job ${job.id} moved to DLQ: ${error?.message}`);
}

/**
 * List all DLQ entries (most recent first).
 * @param {number} [limit=50] - Max entries to return
 */
export async function listDLQ(limit = 50) {
  const jobIds = await redis.lrange(DLQ_LIST, 0, limit - 1);

  if (jobIds.length === 0) return [];

  const pipeline = redis.pipeline();
  for (const id of jobIds) {
    pipeline.hgetall(`${DLQ_PREFIX}${id}`);
  }
  const results = await pipeline.exec();

  return results
    .map(([err, entry]) => {
      if (err || !entry || !entry.jobId) return null;
      return {
        ...entry,
        data: tryParse(entry.data),
        attemptsMade: parseInt(entry.attemptsMade, 10) || 0,
      };
    })
    .filter(Boolean);
}

/**
 * Remove a job from the DLQ (after replay or manual purge).
 */
export async function removeFromDLQ(jobId) {
  const pipeline = redis.pipeline();
  pipeline.del(`${DLQ_PREFIX}${jobId}`);
  pipeline.lrem(DLQ_LIST, 1, jobId);
  await pipeline.exec();
}

/**
 * Get the current DLQ size.
 */
export async function dlqSize() {
  return redis.llen(DLQ_LIST);
}

/**
 * Purge all DLQ entries.
 */
export async function purgeDLQ() {
  const jobIds = await redis.lrange(DLQ_LIST, 0, -1);
  if (jobIds.length === 0) return 0;

  const pipeline = redis.pipeline();
  for (const id of jobIds) {
    pipeline.del(`${DLQ_PREFIX}${id}`);
  }
  pipeline.del(DLQ_LIST);
  await pipeline.exec();

  return jobIds.length;
}

function tryParse(str) {
  try { return JSON.parse(str); } catch { return str; }
}
