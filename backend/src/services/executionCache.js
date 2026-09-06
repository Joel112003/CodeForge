import crypto from "crypto";
import redis from "../config/redis.js";

const CACHE_MAX_SIZE = 1000;
const CACHE_TTL = 3600; // 1 hour
const CACHE_ZSET = "exec_cache:lru"; // sorted set: score = last access timestamp
const CACHE_PREFIX = "exec_cache:result:"; // hash per result

// Keywords that indicate non-deterministic code — skip cache for these
const NON_DETERMINISTIC_PATTERNS = [
  /\bMath\.random\b/,
  /\bDate\.now\b/,
  /\bnew\s+Date\b/,
  /\bfetch\s*\(/,
  /\brequire\s*\(\s*['"]https?/,
  /\bimport\s*\(/,
  /\bsetTimeout\b/,
  /\bsetInterval\b/,
  /\bprocess\.env\b/,
  /\bos\.\w+/,
  /\brandom\.\w+/,
  /\btime\.\w+/,
  /\bdatetime\b/i,
  /\buuid/i,
  /\b__import__\s*\(/,
  /\binput\s*\(/,
];

/**
 * Generate a deterministic cache key from language + code.
 * Uses SHA-256 for content-addressable storage.
 */
export function cacheKey(language, code) {
  const normalized = `${language}:${code.trim()}`;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Check if code is likely non-deterministic (contains randomness, time, I/O).
 * Returns true if the code should bypass the cache.
 */
export function isNonDeterministic(code) {
  return NON_DETERMINISTIC_PATTERNS.some((pattern) => pattern.test(code));
}

/**
 * Look up a cached execution result.
 * Returns { hit: true, output, duration_ms } or { hit: false }.
 *
 * On hit, updates the access timestamp in the LRU sorted set
 * so recently accessed items survive eviction.
 */
export async function cacheGet(language, code) {
  if (isNonDeterministic(code)) return { hit: false };

  const key = cacheKey(language, code);
  const resultKey = `${CACHE_PREFIX}${key}`;

  const result = await redis.hgetall(resultKey);
  if (!result || !result.output) return { hit: false };

  // Touch: update access time so this entry stays in the LRU
  await redis.zadd(CACHE_ZSET, Date.now(), key);

  return {
    hit: true,
    output: result.output,
    duration_ms: parseInt(result.duration_ms, 10) || 0,
    cached: true,
  };
}

/**
 * Store an execution result in the cache.
 * If the cache exceeds CACHE_MAX_SIZE, evict the least-recently-used entries.
 *
 * LRU eviction uses a Redis sorted set where the score is the last access
 * timestamp. The lowest scores (oldest access) are evicted first.
 */
export async function cacheSet(language, code, output, durationMs) {
  if (isNonDeterministic(code)) return;

  const key = cacheKey(language, code);
  const resultKey = `${CACHE_PREFIX}${key}`;

  // Store the result as a Redis hash
  await redis.hset(resultKey, {
    output: output,
    duration_ms: String(durationMs),
    language: language,
    cached_at: new Date().toISOString(),
  });
  await redis.expire(resultKey, CACHE_TTL);

  // Track access time in the LRU sorted set
  await redis.zadd(CACHE_ZSET, Date.now(), key);

  // Evict if over capacity: remove entries with the oldest access times
  const currentSize = await redis.zcard(CACHE_ZSET);
  if (currentSize > CACHE_MAX_SIZE) {
    const evictCount = currentSize - CACHE_MAX_SIZE;
    // Get the keys to evict (lowest scores = oldest access)
    const staleKeys = await redis.zrange(CACHE_ZSET, 0, evictCount - 1);

    if (staleKeys.length > 0) {
      const pipeline = redis.pipeline();
      for (const staleKey of staleKeys) {
        pipeline.del(`${CACHE_PREFIX}${staleKey}`);
      }
      pipeline.zremrangebyrank(CACHE_ZSET, 0, evictCount - 1);
      await pipeline.exec();
    }
  }
}

/**
 * Get cache statistics for the metrics dashboard.
 */
export async function cacheStats() {
  const size = await redis.zcard(CACHE_ZSET);
  return { size, maxSize: CACHE_MAX_SIZE };
}
