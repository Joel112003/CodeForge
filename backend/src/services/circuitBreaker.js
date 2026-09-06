/**
 * Circuit Breaker — Fault tolerance for the execution engine.
 *
 * State machine:
 *   CLOSED  →  (failure threshold exceeded)  →  OPEN
 *   OPEN    →  (cooldown elapsed)             →  HALF_OPEN
 *   HALF_OPEN → (probe succeeds)              →  CLOSED
 *   HALF_OPEN → (probe fails)                 →  OPEN
 *
 * Tracks failures over a sliding window (last N executions).
 * When the failure rate exceeds the threshold, the circuit trips OPEN
 * and immediately rejects new requests without spawning processes.
 */

const WINDOW_SIZE = 10;         // track last N execution results
const FAILURE_THRESHOLD = 0.5;  // trip if >50% of window failed
const COOLDOWN_MS = 30_000;     // 30s before allowing a probe in HALF_OPEN
const HALF_OPEN_MAX = 1;        // how many probe requests to allow in HALF_OPEN

const State = Object.freeze({
  CLOSED: "CLOSED",
  OPEN: "OPEN",
  HALF_OPEN: "HALF_OPEN",
});

class CircuitBreaker {
  constructor() {
    this.state = State.CLOSED;
    this.results = [];        // ring buffer of booleans: true = success, false = failure
    this.openedAt = null;     // timestamp when circuit tripped OPEN
    this.halfOpenProbes = 0;  // number of in-flight probes in HALF_OPEN
  }

  /**
   * Returns the current state and metadata for the frontend health indicator.
   */
  getStatus() {
    this._checkTransition();
    const failureRate = this._failureRate();
    return {
      state: this.state,
      failureRate: Math.round(failureRate * 100),
      windowSize: this.results.length,
      cooldownRemaining:
        this.state === State.OPEN && this.openedAt
          ? Math.max(0, COOLDOWN_MS - (Date.now() - this.openedAt))
          : 0,
    };
  }

  /**
   * Check if a new request should be allowed through.
   * Returns { allowed: true } or { allowed: false, reason: string }.
   */
  canExecute() {
    this._checkTransition();

    switch (this.state) {
      case State.CLOSED:
        return { allowed: true };

      case State.OPEN:
        return {
          allowed: false,
          reason: "System temporarily unavailable — too many recent failures. Retrying automatically.",
        };

      case State.HALF_OPEN:
        if (this.halfOpenProbes < HALF_OPEN_MAX) {
          this.halfOpenProbes++;
          return { allowed: true };
        }
        return {
          allowed: false,
          reason: "System recovering — probe in progress. Please wait.",
        };

      default:
        return { allowed: true };
    }
  }

  /**
   * Record a successful execution. Feeds the sliding window.
   */
  recordSuccess() {
    this._push(true);

    if (this.state === State.HALF_OPEN) {
      // Probe succeeded → circuit closes
      this.state = State.CLOSED;
      this.openedAt = null;
      this.halfOpenProbes = 0;
      console.log("[circuit-breaker] HALF_OPEN → CLOSED (probe succeeded)");
    }
  }

  /**
   * Record a failed execution. Feeds the sliding window.
   */
  recordFailure() {
    this._push(false);

    if (this.state === State.HALF_OPEN) {
      // Probe failed → back to OPEN
      this.state = State.OPEN;
      this.openedAt = Date.now();
      this.halfOpenProbes = 0;
      console.log("[circuit-breaker] HALF_OPEN → OPEN (probe failed)");
      return;
    }

    // In CLOSED state, check if we should trip
    if (this.state === State.CLOSED && this._shouldTrip()) {
      this.state = State.OPEN;
      this.openedAt = Date.now();
      console.log(
        `[circuit-breaker] CLOSED → OPEN (failure rate ${Math.round(this._failureRate() * 100)}% > ${FAILURE_THRESHOLD * 100}%)`
      );
    }
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  _push(success) {
    this.results.push(success);
    if (this.results.length > WINDOW_SIZE) {
      this.results.shift(); // maintain sliding window size
    }
  }

  _failureRate() {
    if (this.results.length === 0) return 0;
    const failures = this.results.filter((r) => !r).length;
    return failures / this.results.length;
  }

  _shouldTrip() {
    return (
      this.results.length >= WINDOW_SIZE &&
      this._failureRate() > FAILURE_THRESHOLD
    );
  }

  /**
   * Auto-transition: if OPEN and cooldown elapsed → HALF_OPEN
   */
  _checkTransition() {
    if (
      this.state === State.OPEN &&
      this.openedAt &&
      Date.now() - this.openedAt >= COOLDOWN_MS
    ) {
      this.state = State.HALF_OPEN;
      this.halfOpenProbes = 0;
      console.log("[circuit-breaker] OPEN → HALF_OPEN (cooldown elapsed)");
    }
  }
}

// Singleton — one circuit breaker for the entire execution engine
const circuitBreaker = new CircuitBreaker();
export default circuitBreaker;
