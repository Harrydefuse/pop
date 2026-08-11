/**
 * A cached, single-flight wrapper around `findIdeas`.
 *
 * A scan is expensive in a way a browser must not be allowed to trigger
 * casually: one run makes a candle request per symbol and up to `explainTop`
 * model calls. A dashboard that polls `/api/ideas` on a timer would hammer both
 * the exchange and the API, so this holds the last result and serves it until
 * it goes stale.
 *
 * Single-flight matters as much as the cache. Two tabs opening at once, or a
 * refresh landing mid-run, must join the run already in progress rather than
 * starting a second one — otherwise the first page load doubles the cost.
 */
import { findIdeas } from './index.js';

export function createIdeaService(config, {
  find = findIdeas,
  ttlMs = 10 * 60_000,
  now = () => Date.now(),
  ...defaults
} = {}) {
  let cached = null;
  let inFlight = null;
  let lastError = null;

  const fresh = () => cached !== null && now() - cached.completedAt < ttlMs;

  async function run(options = {}) {
    const startedAt = now();
    try {
      const result = await find(config, { ...defaults, ...options });
      cached = { ...result, startedAt, completedAt: now(), durationMs: now() - startedAt };
      lastError = null;
      return cached;
    } catch (error) {
      // A failed run must not poison the cache: a stale list of ideas is far
      // more useful than an empty one, so the old result stays readable and the
      // error is reported alongside it.
      lastError = { message: error.message, at: now() };
      throw error;
    } finally {
      inFlight = null;
    }
  }

  return {
    /** The last completed run, or null. Never triggers work. */
    peek() {
      if (!cached) return null;
      return { ...cached, ageMs: now() - cached.completedAt, stale: !fresh() };
    },

    get running() {
      return inFlight !== null;
    },

    get lastError() {
      return lastError;
    },

    /**
     * Fresh result if we have one, otherwise a run — joining one already in
     * progress rather than starting a second.
     */
    async get(options = {}) {
      if (fresh() && !options.force) return this.peek();
      if (!inFlight) inFlight = run(options);
      await inFlight;
      return this.peek();
    },

    /** Start a run without waiting for it. Returns whether it started one. */
    refresh(options = {}) {
      if (inFlight) return false;
      // The rejection is captured on `lastError` inside run(); swallow it here
      // so a background refresh can never become an unhandled rejection.
      inFlight = run(options).catch(() => null);
      return true;
    },
  };
}
