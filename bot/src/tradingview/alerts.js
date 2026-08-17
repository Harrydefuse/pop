/**
 * Inbound TradingView alerts.
 *
 * This is the supported way to connect a bot to TradingView, and the only one:
 * you put a script on your chart, create an alert on it, and TradingView's
 * servers POST a message to a URL you choose when the condition fires. Nothing
 * here drives their interface or scrapes their data.
 *
 * The trust model is worth stating plainly, because it is unusual for this
 * codebase. Every other input the bot reads is something it went and fetched.
 * This one is an unauthenticated stranger POSTing to a port, and the endpoint
 * has to be reachable from the public internet for TradingView to reach it at
 * all. So the parsing here is hostile: a shared secret compared in constant
 * time, a body-size cap, a freshness window, replay rejection, and a strict
 * shape check before any value is believed.
 *
 * TradingView alerts cannot set custom HTTP headers, so the secret has to
 * travel in the body. That makes TLS non-optional in front of this: over plain
 * HTTP the secret is on the wire in clear text on every fire.
 */
import crypto from 'node:crypto';

/** Anything larger is not an alert. TradingView messages are a few hundred bytes. */
export const MAX_BODY_BYTES = 16 * 1024;

/** Events a script may raise. An unknown event is rejected rather than passed through. */
export const EVENTS = new Set(['idea.entry', 'idea.stop', 'idea.target', 'screener.hit', 'custom']);

/**
 * Constant-time secret comparison.
 *
 * Hashed first so both sides are always 32 bytes: `timingSafeEqual` throws on a
 * length mismatch, and catching that throw would itself leak the length.
 */
export function secretMatches(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string' || expected === '') return false;
  const digest = (value) => crypto.createHash('sha256').update(value, 'utf8').digest();
  return crypto.timingSafeEqual(digest(provided), digest(expected));
}

/**
 * Parse a raw alert body.
 *
 * TradingView sends whatever the user typed into the alert message box, with
 * `{{placeholders}}` already substituted, and historically with a `text/plain`
 * content type even when the body is JSON. So the content type is not trusted:
 * the body is parsed as JSON, and a body that is not JSON is a rejection rather
 * than a guess.
 */
export function parseAlert(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') {
    return { ok: false, reason: 'empty body' };
  }
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
    return { ok: false, reason: 'body too large' };
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    // A plain-text alert carries no secret and cannot be authenticated, so it
    // is refused rather than accepted as an anonymous signal.
    return { ok: false, reason: 'body is not JSON — use the message template from `cli.js tradingview`' };
  }

  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, reason: 'body is not a JSON object' };
  }
  return { ok: true, payload };
}

/**
 * Validate a parsed payload into an alert record.
 *
 * `now` and `maxAgeMs` are injected so freshness is testable without waiting.
 */
export function validateAlert(payload, { secret, now = Date.now(), maxAgeMs = 10 * 60_000 } = {}) {
  if (!secretMatches(payload.secret, secret)) {
    // Deliberately vague: a caller who cannot authenticate learns nothing about
    // which field was wrong or whether the endpoint even expects one.
    return { ok: false, status: 401, reason: 'unauthorized' };
  }

  const event = typeof payload.event === 'string' ? payload.event : 'custom';
  if (!EVENTS.has(event)) {
    return { ok: false, status: 400, reason: `unknown event "${event}"` };
  }

  const symbol = typeof payload.symbol === 'string' ? payload.symbol.trim().toUpperCase() : '';
  if (!symbol || symbol.length > 32) {
    return { ok: false, status: 400, reason: 'missing or implausible symbol' };
  }

  // `{{close}}` substitutes as a bare number, but a user editing the template by
  // hand may quote it. Accept both; reject anything that is not a finite number.
  const price = Number(payload.price);
  if (payload.price !== undefined && !Number.isFinite(price)) {
    return { ok: false, status: 400, reason: 'price is not a number' };
  }

  const firedAt = payload.time ? Date.parse(payload.time) : now;
  if (!Number.isFinite(firedAt)) {
    return { ok: false, status: 400, reason: 'time is not a timestamp' };
  }

  // A replayed alert from an hour ago must not be actioned as if it were live.
  // The future side of the window matters too: a payload dated next week would
  // otherwise sit in the dedupe cache forever and suppress the real ones.
  const age = now - firedAt;
  if (age > maxAgeMs) return { ok: false, status: 409, reason: `alert is ${Math.round(age / 60_000)} minutes stale` };
  if (age < -60_000) return { ok: false, status: 409, reason: 'alert is dated in the future' };

  return {
    ok: true,
    alert: {
      event,
      symbol,
      interval: typeof payload.interval === 'string' ? payload.interval.slice(0, 8) : null,
      price: Number.isFinite(price) ? price : null,
      note: typeof payload.note === 'string' ? payload.note.slice(0, 280) : null,
      firedAt: new Date(firedAt).toISOString(),
      receivedAt: new Date(now).toISOString(),
      /** Identity for replay suppression: same event on the same bar is one alert. */
      id: `${event}:${symbol}:${payload.interval ?? ''}:${firedAt}`,
    },
  };
}

/**
 * Remembers alert ids for a window so a retry, a double-fire, or a replayed
 * capture is recorded once. TradingView does retry on a non-2xx response, and
 * "once per bar close" alerts can fire twice across a reconnect.
 */
export function createReplayGuard({ windowMs = 30 * 60_000, now = () => Date.now() } = {}) {
  const seen = new Map();

  return {
    /** True if this id is new. Marks it seen as a side effect. */
    admit(id) {
      const current = now();
      for (const [key, at] of seen) {
        if (current - at > windowMs) seen.delete(key);
      }
      if (seen.has(id)) return false;
      seen.set(id, current);
      return true;
    },
    get size() {
      return seen.size;
    },
  };
}

/**
 * TradingView's published webhook egress addresses.
 *
 * A useful second gate, but not a substitute for the secret: the list changes
 * without notice, and an allowlist alone would let anyone who can spoof or
 * proxy through those ranges post freely. Off by default for that reason —
 * a stale list silently drops real alerts.
 */
export const TRADINGVIEW_IPS = [
  '52.89.214.238',
  '34.212.75.30',
  '54.218.53.128',
  '52.32.178.7',
];

export function sourceAllowed(address, allowlist) {
  if (!allowlist || allowlist.length === 0) return true;
  // Node reports IPv4 peers as ::ffff:a.b.c.d when the socket is dual-stack.
  const normalised = String(address ?? '').replace(/^::ffff:/, '');
  return allowlist.includes(normalised);
}
