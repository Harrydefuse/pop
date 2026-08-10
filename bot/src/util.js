/** Small helpers shared across the bot. No dependencies. */

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Clamp to [min, max]. */
export function clamp(n, min = 0, max = 1) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/**
 * Map a value onto 0..1 by where it falls between `lo` and `hi`.
 * Values at or below `lo` score 0, at or above `hi` score 1.
 */
export function ramp(value, lo, hi) {
  if (!Number.isFinite(value)) return 0;
  if (hi === lo) return value >= hi ? 1 : 0;
  return clamp((value - lo) / (hi - lo));
}

/** Coerce anything the APIs hand back into a finite number, or `fallback`. */
export function num(value, fallback = 0) {
  const n = typeof value === 'string' ? Number.parseFloat(value) : value;
  return Number.isFinite(n) ? n : fallback;
}

export function pct(n, digits = 1) {
  return `${(num(n) * 100).toFixed(digits)}%`;
}

export function usd(n) {
  const v = num(n);
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${Math.round(v).toLocaleString('en-US')}`;
  if (abs >= 0.01) return `$${v.toFixed(2)}`;
  if (abs === 0) return '$0';
  // Sub-cent token prices need significant figures, not two decimal places.
  return `$${v.toPrecision(3)}`;
}

export function shortAddr(addr, lead = 4, tail = 4) {
  if (typeof addr !== 'string' || addr.length <= lead + tail + 1) return String(addr ?? '');
  return `${addr.slice(0, lead)}…${addr.slice(-tail)}`;
}

export function ageString(ms) {
  if (!Number.isFinite(ms) || ms < 0) return 'unknown';
  const minutes = Math.floor(ms / MINUTE);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h${minutes % 60 ? ` ${minutes % 60}m` : ''}`;
  return `${Math.floor(hours / 24)}d`;
}

/** Split an array into chunks of at most `size`. */
export function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Deduplicate by the value returned from `keyOf`, keeping the first occurrence. */
export function uniqueBy(items, keyOf) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = keyOf(item);
    if (key == null || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/**
 * Token-bucket limiter. Public APIs used here publish per-minute quotas, and
 * tripping them gets the IP throttled for a while, so every call goes through one.
 */
export class RateLimiter {
  constructor(perMinute) {
    this.capacity = perMinute;
    this.tokens = perMinute;
    this.refillPerMs = perMinute / MINUTE;
    this.last = Date.now();
  }

  async take() {
    for (;;) {
      const now = Date.now();
      this.tokens = Math.min(this.capacity, this.tokens + (now - this.last) * this.refillPerMs);
      this.last = now;
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      await sleep(Math.ceil((1 - this.tokens) / this.refillPerMs) + 10);
    }
  }
}

/** Retry with exponential backoff. Retries anything the callback throws. */
export async function withRetry(fn, { attempts = 4, baseMs = 400, onRetry } = {}) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) break;
      const delay = baseMs * 2 ** attempt;
      onRetry?.(error, attempt + 1, delay);
      await sleep(delay);
    }
  }
  throw lastError;
}
