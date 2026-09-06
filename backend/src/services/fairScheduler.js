import redis from "../config/redis.js";


const MAX_TOKENS = 20;           // max tokens per user
const REFILL_RATE = 0.1;         // tokens per second (~6/min, ~360/hr)
const GUEST_MAX_TOKENS = 5;      // guests get fewer tokens
const TOKEN_KEY_PREFIX = "fair:tokens:";
const TOKEN_TTL = 7200;          // 2 hours — auto-cleanup inactive users

/**
 * Get the current token count for a user, applying refill since last access.
 * Returns { tokens, priority }.
 */
export async function getTokens(userId) {
  const isGuest = !userId;
  const key = `${TOKEN_KEY_PREFIX}${userId || "guest"}`;
  const maxTokens = isGuest ? GUEST_MAX_TOKENS : MAX_TOKENS;

  const data = await redis.hgetall(key);

  let tokens;
  if (!data || !data.tokens) {
    // First time — initialize with full bucket
    tokens = maxTokens;
  } else {
    // Calculate refill since last access
    const lastAccess = parseFloat(data.last_access) || Date.now();
    const elapsed = (Date.now() - lastAccess) / 1000; // seconds
    const refilled = elapsed * REFILL_RATE;
    tokens = Math.min(maxTokens, parseFloat(data.tokens) + refilled);
  }

  return { tokens: Math.round(tokens * 100) / 100, maxTokens };
}

/**
 * Consume a token and return the BullMQ priority for this job.
 *
 * BullMQ priority: lower number = higher priority.
 * We map the token count to a priority value:
 *   - Full bucket (20 tokens) → priority 1 (highest)
 *   - Empty bucket (0 tokens) → priority 20 (lowest)
 *   - Below 0 → priority 100 (extremely deprioritized, but still allowed)
 *
 * Returns { priority, tokensRemaining, allowed }.
 */
export async function consumeToken(userId) {
  const isGuest = !userId;
  const key = `${TOKEN_KEY_PREFIX}${userId || "guest"}`;
  const maxTokens = isGuest ? GUEST_MAX_TOKENS : MAX_TOKENS;

  const { tokens } = await getTokens(userId);

  // Consume one token
  const newTokens = tokens - 1;

  // Calculate priority: fewer tokens → higher priority number → lower precedence
  let priority;
  if (newTokens >= maxTokens * 0.5) {
    priority = 1;  // plenty of tokens — high priority
  } else if (newTokens >= maxTokens * 0.25) {
    priority = 5;  // moderate usage
  } else if (newTokens >= 0) {
    priority = 10; // running low
  } else {
    priority = 20; // over-budget — heavily deprioritized but still allowed
  }

  // Persist updated bucket state
  await redis.hset(key, {
    tokens: String(newTokens),
    last_access: String(Date.now()),
    max_tokens: String(maxTokens),
  });
  await redis.expire(key, TOKEN_TTL);

  return {
    priority,
    tokensRemaining: Math.max(0, newTokens),
    maxTokens,
    allowed: true, // we always allow (just deprioritize), rate limiter handles hard rejections
  };
}

/**
 * Get quota info for the frontend display.
 */
export async function getQuota(userId) {
  const { tokens, maxTokens } = await getTokens(userId);
  return {
    tokensRemaining: Math.max(0, Math.round(tokens)),
    maxTokens,
    refillRate: REFILL_RATE,
  };
}
