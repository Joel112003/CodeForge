import redis from "../config/redis.js";

/**
 * Metrics Collector — Sliding window counters using Redis sorted sets.
 *
 * DSA: Sliding Window Algorithm
 *   - Each metric is a Redis sorted set where:
 *     - Members are unique event IDs (timestamp + random suffix)
 *     - Scores are Unix timestamps (ms)
 *   - To count events in the last N seconds:
 *     ZRANGEBYSCORE key (now - windowMs) now → count of events in window
 *   - Old entries are pruned on every write (ZREMRANGEBYSCORE)
 *
 * System Design: Time-Series Metrics, Observability
 *   - No external dependencies (Prometheus/Grafana) — self-contained
 *   - Efficient: O(log N) per write, O(log N + M) per read
 */

const METRIC_PREFIX = "metrics:";
const DEFAULT_WINDOW_MS = 60_000;    // 1-minute window for rate calculations
const MAX_WINDOW_MS = 300_000;       // 5-minute max retention per metric
const METRIC_TTL = 600;              // 10-minute Redis TTL for auto-cleanup

// Metric names
export const MetricNames = {
  EXECUTIONS: "executions",
  ERRORS: "errors",
  CACHE_HITS: "cache_hits",
  CACHE_MISSES: "cache_misses",
  CIRCUIT_BREAKER_REJECTIONS: "circuit_breaker_rejections",
  QUEUE_ADDED: "queue_added",
  QUEUE_COMPLETED: "queue_completed",
  QUEUE_FAILED: "queue_failed",
  LATENCY: "latency",           // stores duration values, not counts
};

/**
 * Record a single event in a metric's sliding window.
 * @param {string} metric - Metric name from MetricNames
 * @param {number} [value=1] - Optional value (e.g. latency in ms)
 */
export async function recordMetric(metric, value = 1) {
  const key = `${METRIC_PREFIX}${metric}`;
  const now = Date.now();
  // Use timestamp + random suffix as member to ensure uniqueness
  const member = `${now}:${Math.random().toString(36).slice(2, 8)}:${value}`;

  const pipeline = redis.pipeline();
  pipeline.zadd(key, now, member);
  // Prune events older than the max window
  pipeline.zremrangebyscore(key, 0, now - MAX_WINDOW_MS);
  pipeline.expire(key, METRIC_TTL);
  await pipeline.exec();
}

/**
 * Count events in the last windowMs milliseconds.
 * @param {string} metric - Metric name
 * @param {number} [windowMs=60000] - Window size in ms
 * @returns {Promise<number>} Count of events in window
 */
export async function countMetric(metric, windowMs = DEFAULT_WINDOW_MS) {
  const key = `${METRIC_PREFIX}${metric}`;
  const now = Date.now();
  return redis.zcount(key, now - windowMs, now);
}

/**
 * Get the average value of events in the last windowMs milliseconds.
 * Used for latency metrics where each event stores a value.
 * @param {string} metric - Metric name
 * @param {number} [windowMs=60000] - Window size in ms
 * @returns {Promise<number>} Average value
 */
export async function avgMetric(metric, windowMs = DEFAULT_WINDOW_MS) {
  const key = `${METRIC_PREFIX}${metric}`;
  const now = Date.now();
  const members = await redis.zrangebyscore(key, now - windowMs, now);

  if (members.length === 0) return 0;

  let sum = 0;
  for (const member of members) {
    // member format: "timestamp:random:value"
    const parts = member.split(":");
    const value = parseFloat(parts[2]) || 0;
    sum += value;
  }

  return Math.round(sum / members.length);
}

/**
 * Get a full snapshot of all metrics for the admin dashboard.
 * Returns counts per-minute and per-5-minutes, plus averages for latency.
 */
export async function getMetricsSnapshot() {
  const [
    executions1m,
    executions5m,
    errors1m,
    errors5m,
    cacheHits1m,
    cacheMisses1m,
    cbRejections1m,
    queueAdded1m,
    queueCompleted1m,
    queueFailed1m,
    avgLatency1m,
    avgLatency5m,
  ] = await Promise.all([
    countMetric(MetricNames.EXECUTIONS, 60_000),
    countMetric(MetricNames.EXECUTIONS, 300_000),
    countMetric(MetricNames.ERRORS, 60_000),
    countMetric(MetricNames.ERRORS, 300_000),
    countMetric(MetricNames.CACHE_HITS, 60_000),
    countMetric(MetricNames.CACHE_MISSES, 60_000),
    countMetric(MetricNames.CIRCUIT_BREAKER_REJECTIONS, 60_000),
    countMetric(MetricNames.QUEUE_ADDED, 60_000),
    countMetric(MetricNames.QUEUE_COMPLETED, 60_000),
    countMetric(MetricNames.QUEUE_FAILED, 60_000),
    avgMetric(MetricNames.LATENCY, 60_000),
    avgMetric(MetricNames.LATENCY, 300_000),
  ]);

  const cacheTotal1m = cacheHits1m + cacheMisses1m;
  const cacheHitRate = cacheTotal1m > 0
    ? Math.round((cacheHits1m / cacheTotal1m) * 100)
    : 0;

  return {
    timestamp: new Date().toISOString(),
    executions: { perMinute: executions1m, per5Minutes: executions5m },
    errors: { perMinute: errors1m, per5Minutes: errors5m },
    cache: {
      hitsPerMinute: cacheHits1m,
      missesPerMinute: cacheMisses1m,
      hitRate: cacheHitRate,
    },
    circuitBreaker: { rejectionsPerMinute: cbRejections1m },
    queue: {
      addedPerMinute: queueAdded1m,
      completedPerMinute: queueCompleted1m,
      failedPerMinute: queueFailed1m,
    },
    latency: {
      avgMs1m: avgLatency1m,
      avgMs5m: avgLatency5m,
    },
  };
}
