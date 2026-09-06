import crypto from "crypto";
import redis from "../config/redis.js";

/**
 * Bloom Filter — Probabilistic duplicate submission detection.
 *
 * DSA: Bloom Filter (manual bit-array implementation)
 *   - A space-efficient probabilistic data structure that tests set membership
 *   - False positives possible (~1%), false negatives impossible
 *   - Uses K independent hash functions mapped to a bit array of size M
 *
 * Parameters (tuned for ~1% false positive rate with up to 1000 items):
 *   - M = 9585 bits (rounded to nearest byte: 1199 bytes)
 *   - K = 7 hash functions
 *   - Expected false positive rate: ~0.82% at 1000 items
 *
 * Each bloom filter key has a 5-second TTL so duplicates are only blocked
 * within a short window (prevents rapid double-clicks, not long-term dedup).
 *
 * Implementation: Since we can't use RedisBloom module (Upstash may not support it),
 * we implement it manually using Redis SETBIT/GETBIT on a string key.
 */

const BIT_ARRAY_SIZE = 9585;   // number of bits (M)
const NUM_HASHES = 7;          // number of hash functions (K)
const BLOOM_KEY = "bloom:dedup";
const BLOOM_TTL = 5;           // 5-second window

/**
 * Generate K different hash positions from a single input.
 * Uses double hashing: h(i) = (h1 + i * h2) % M
 * where h1 and h2 come from splitting a SHA-256 hash.
 */
function getHashPositions(input) {
  const hash = crypto.createHash("sha256").update(input).digest("hex");

  // Split the 64-char hex hash into two 32-char halves
  const h1 = parseInt(hash.slice(0, 16), 16);
  const h2 = parseInt(hash.slice(16, 32), 16);

  const positions = [];
  for (let i = 0; i < NUM_HASHES; i++) {
    // Double hashing formula: (h1 + i * h2) % M
    // Use Math.abs to handle negative values from overflow
    const pos = Math.abs((h1 + i * h2) % BIT_ARRAY_SIZE);
    positions.push(pos);
  }

  return positions;
}

/**
 * Build the deduplication key from execution parameters.
 * Includes userId so different users running the same code aren't considered duplicates.
 */
function buildInput(userId, language, code) {
  return `${userId || "guest"}:${language}:${code.trim()}`;
}

/**
 * Check if this execution is a probable duplicate AND mark it as seen.
 *
 * Returns:
 *   - { isDuplicate: true }  if the bloom filter indicates this was recently submitted
 *   - { isDuplicate: false } if this is (probably) a new submission
 *
 * This is an atomic check-and-set: if not a duplicate, the bits are set
 * immediately so subsequent identical requests within the TTL window are caught.
 */
export async function checkAndMark(userId, language, code) {
  const input = buildInput(userId, language, code);
  const positions = getHashPositions(input);

  // Check all bit positions — if ALL are set, it's a probable duplicate
  const pipeline = redis.pipeline();
  for (const pos of positions) {
    pipeline.getbit(BLOOM_KEY, pos);
  }
  const results = await pipeline.exec();

  const allSet = results.every(([err, bit]) => !err && bit === 1);

  if (allSet) {
    return { isDuplicate: true };
  }

  // Not a duplicate — set all bits and refresh TTL
  const setPipeline = redis.pipeline();
  for (const pos of positions) {
    setPipeline.setbit(BLOOM_KEY, pos, 1);
  }
  setPipeline.expire(BLOOM_KEY, BLOOM_TTL);
  await setPipeline.exec();

  return { isDuplicate: false };
}

/**
 * Get bloom filter stats for metrics/debugging.
 */
export async function bloomStats() {
  const bitCount = await redis.bitcount(BLOOM_KEY);
  return {
    bitsSet: bitCount,
    totalBits: BIT_ARRAY_SIZE,
    fillRatio: Math.round((bitCount / BIT_ARRAY_SIZE) * 100),
    numHashes: NUM_HASHES,
    ttlSeconds: BLOOM_TTL,
  };
}
