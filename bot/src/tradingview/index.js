/**
 * The inbox for TradingView alerts.
 *
 * Receives, authenticates and records. It does **not** trade.
 *
 * That separation is deliberate and it is the most important line in this
 * directory. An inbound HTTP request from the public internet must not be one
 * hop away from signing a transaction. Alerts land here, get written to the log
 * and pushed to the dashboard, and stop. Anything that acts on them has to
 * reach in and ask — through the same arming, caps and kill switch every other
 * order goes through.
 */
import { EventEmitter } from 'node:events';

import { appendJsonl, readJsonl } from '../store.js';
import { log } from '../log.js';
import { createReplayGuard, parseAlert, sourceAllowed, validateAlert } from './alerts.js';

const RECENT_LIMIT = 100;

export function createAlertInbox(config, { now = () => Date.now() } = {}) {
  const settings = config.tradingview ?? {};
  const events = new EventEmitter();
  const guard = createReplayGuard({ windowMs: (settings.dedupeMinutes ?? 30) * 60_000, now });

  /** Newest first, for the dashboard. The log on disk is the durable record. */
  const recent = readJsonl(config.dataDirAbsolute, 'tradingview.jsonl', { limit: RECENT_LIMIT }).reverse();
  const counts = { accepted: 0, rejected: 0, duplicates: 0 };

  return {
    events,
    get recent() {
      return recent;
    },
    get stats() {
      return { ...counts, enabled: Boolean(settings.enabled), configured: Boolean(settings.secret) };
    },

    /**
     * Handle one raw request body.
     *
     * Returns a status and a body for the caller to send. TradingView retries
     * on any non-2xx, so a *rejected* alert still answers 2xx where retrying
     * cannot help — a bad secret or a malformed body will be exactly as bad on
     * the fifth attempt, and a retry storm is the only thing gained.
     */
    receive(rawBody, { address } = {}) {
      if (!settings.enabled) {
        return { status: 404, body: { error: 'tradingview webhook is disabled' } };
      }
      if (!settings.secret) {
        // Never open unauthenticated: without a secret every caller is anonymous.
        log.warn('tradingview alert refused — MEMEBOT_TRADINGVIEW_SECRET is not set');
        return { status: 503, body: { error: 'webhook is not configured' } };
      }
      if (!sourceAllowed(address, settings.allowSourceIps)) {
        counts.rejected += 1;
        return { status: 403, body: { error: 'source not allowed' } };
      }

      const parsed = parseAlert(rawBody);
      if (!parsed.ok) {
        counts.rejected += 1;
        return { status: 200, body: { accepted: false, reason: parsed.reason } };
      }

      const validated = validateAlert(parsed.payload, {
        secret: settings.secret,
        now: now(),
        maxAgeMs: (settings.maxAgeMinutes ?? 10) * 60_000,
      });
      if (!validated.ok) {
        counts.rejected += 1;
        // 401 is the one rejection worth answering honestly, so a misconfigured
        // alert is visible in TradingView's own delivery log.
        const status = validated.status === 401 ? 401 : 200;
        return { status, body: { accepted: false, reason: validated.reason } };
      }

      const { alert } = validated;
      if (!guard.admit(alert.id)) {
        counts.duplicates += 1;
        return { status: 200, body: { accepted: false, reason: 'duplicate' } };
      }

      counts.accepted += 1;
      recent.unshift(alert);
      recent.length = Math.min(recent.length, RECENT_LIMIT);
      appendJsonl(config.dataDirAbsolute, 'tradingview.jsonl', alert);
      // Note what arrived, never the payload: the body carries the shared secret.
      log.info(`tradingview alert: ${alert.event} ${alert.symbol}${alert.price ? ` @ ${alert.price}` : ''}`);
      events.emit('alert', alert);

      return { status: 200, body: { accepted: true, id: alert.id } };
    },
  };
}

/**
 * The JSON to paste into TradingView's alert message box.
 *
 * `{{...}}` placeholders are substituted by TradingView when the alert fires;
 * everything else is literal. The secret is included because alerts cannot send
 * custom headers, which is also why this string must never be pasted anywhere
 * public — it is a credential.
 *
 * `price` is quoted even though `{{close}}` substitutes as a bare number: if the
 * placeholder ever renders empty, an unquoted value produces a body that is not
 * valid JSON at all, and the whole alert is lost rather than one field.
 */
export function messageTemplate({ event = 'idea.entry', secret = 'YOUR_SECRET_HERE', note = '' } = {}) {
  return JSON.stringify(
    {
      secret,
      event,
      symbol: '{{ticker}}',
      interval: '{{interval}}',
      price: '{{close}}',
      time: '{{timenow}}',
      ...(note ? { note } : {}),
    },
    null,
    2,
  );
}
