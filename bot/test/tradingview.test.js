/**
 * The inbound TradingView webhook.
 *
 * This is the only endpoint in the codebase that a stranger on the internet is
 * meant to reach, so the tests are weighted heavily toward what it *refuses*.
 * Nearly every case here is an attack or a mistake, not a happy path.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  EVENTS,
  MAX_BODY_BYTES,
  createReplayGuard,
  parseAlert,
  secretMatches,
  sourceAllowed,
  validateAlert,
} from '../src/tradingview/alerts.js';
import { createAlertInbox, messageTemplate } from '../src/tradingview/index.js';
import { loadConfig } from '../src/config.js';
import { setLevel } from '../src/log.js';

setLevel('silent');

const SECRET = 'a-long-random-webhook-secret';
const NOW = Date.parse('2026-08-17T12:00:00Z');

function payload(overrides = {}) {
  return {
    secret: SECRET,
    event: 'idea.entry',
    symbol: 'SOLUSDT',
    interval: '4h',
    price: '212.44',
    time: new Date(NOW - 5_000).toISOString(),
    ...overrides,
  };
}

// ── the secret ───────────────────────────────────────────────────────────────

test('secretMatches accepts only an exact match', () => {
  assert.equal(secretMatches(SECRET, SECRET), true);
  assert.equal(secretMatches(`${SECRET}x`, SECRET), false);
  assert.equal(secretMatches(SECRET.slice(0, -1), SECRET), false);
  assert.equal(secretMatches('', SECRET), false);
});

test('an unset expected secret never matches, including against empty input', () => {
  // The failure mode this guards: a bot started without the env var configured
  // treating every anonymous caller as authenticated.
  assert.equal(secretMatches('', ''), false);
  assert.equal(secretMatches('anything', ''), false);
  assert.equal(secretMatches('anything', undefined), false);
  assert.equal(secretMatches(undefined, SECRET), false);
});

test('a non-string secret is rejected rather than coerced', () => {
  // JSON can carry any type here, and `timingSafeEqual` would throw on a
  // non-buffer input — a throw that a caller might turn into a 500 and a hint.
  for (const value of [null, 42, true, {}, ['a']]) {
    assert.equal(secretMatches(value, SECRET), false, `${JSON.stringify(value)} must not match`);
  }
});

// ── parsing ──────────────────────────────────────────────────────────────────

test('a plain-text alert is refused because it cannot be authenticated', () => {
  const result = parseAlert('BUY SOLUSDT');
  assert.equal(result.ok, false);
  assert.match(result.reason, /not JSON/);
});

test('an oversized body is rejected before it is parsed', () => {
  const result = parseAlert('x'.repeat(MAX_BODY_BYTES + 1));
  assert.equal(result.ok, false);
  assert.match(result.reason, /too large/);
});

test('an empty body and a JSON array are both refused', () => {
  assert.equal(parseAlert('').ok, false);
  assert.equal(parseAlert('   ').ok, false);
  assert.equal(parseAlert('[1,2,3]').ok, false);
  assert.equal(parseAlert('null').ok, false);
});

// ── validation ───────────────────────────────────────────────────────────────

test('a valid alert is normalised into a record', () => {
  const result = validateAlert(payload(), { secret: SECRET, now: NOW });

  assert.equal(result.ok, true);
  assert.equal(result.alert.symbol, 'SOLUSDT');
  assert.equal(result.alert.price, 212.44, 'a quoted number is still a number');
  assert.equal(result.alert.event, 'idea.entry');
  assert.equal(result.alert.receivedAt, new Date(NOW).toISOString());
});

test('a wrong secret is a 401 that says nothing else', () => {
  const result = validateAlert(payload({ secret: 'wrong' }), { secret: SECRET, now: NOW });

  assert.equal(result.ok, false);
  assert.equal(result.status, 401);
  // The reason must not reveal which field failed or what was expected.
  assert.equal(result.reason, 'unauthorized');
});

test('the secret is checked before anything else in the payload', () => {
  // Otherwise an unauthenticated caller could map the validator by watching
  // which malformed field it complains about.
  const result = validateAlert({ secret: 'wrong', event: 'nonsense', symbol: '' }, { secret: SECRET, now: NOW });
  assert.equal(result.status, 401);
});

test('an unknown event is rejected rather than passed through', () => {
  const result = validateAlert(payload({ event: 'liquidate.everything' }), { secret: SECRET, now: NOW });
  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
  assert.match(result.reason, /unknown event/);
});

test('every advertised event is actually accepted', () => {
  for (const event of EVENTS) {
    const result = validateAlert(payload({ event }), { secret: SECRET, now: NOW });
    assert.equal(result.ok, true, `${event} should validate`);
  }
});

test('an implausible symbol is refused', () => {
  for (const symbol of ['', '   ', 'A'.repeat(33)]) {
    const result = validateAlert(payload({ symbol }), { secret: SECRET, now: NOW });
    assert.equal(result.ok, false, `${JSON.stringify(symbol)} should be refused`);
  }
  const missing = validateAlert(payload({ symbol: undefined }), { secret: SECRET, now: NOW });
  assert.equal(missing.ok, false);
});

test('a stale alert is refused so a replayed capture cannot be actioned', () => {
  const result = validateAlert(payload({ time: new Date(NOW - 40 * 60_000).toISOString() }), {
    secret: SECRET,
    now: NOW,
    maxAgeMs: 10 * 60_000,
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 409);
  assert.match(result.reason, /stale/);
});

test('an alert dated in the future is refused too', () => {
  // Not symmetry for its own sake: a payload dated next week would otherwise
  // occupy the dedupe cache and suppress the genuine alert when it arrives.
  const result = validateAlert(payload({ time: new Date(NOW + 7 * 86_400_000).toISOString() }), {
    secret: SECRET,
    now: NOW,
  });

  assert.equal(result.ok, false);
  assert.match(result.reason, /future/);
});

test('small clock skew is tolerated', () => {
  const result = validateAlert(payload({ time: new Date(NOW + 20_000).toISOString() }), { secret: SECRET, now: NOW });
  assert.equal(result.ok, true, '20 seconds ahead is a clock, not an attack');
});

test('a non-numeric price and an unparseable time are both refused', () => {
  assert.equal(validateAlert(payload({ price: 'n/a' }), { secret: SECRET, now: NOW }).ok, false);
  assert.equal(validateAlert(payload({ time: 'yesterday' }), { secret: SECRET, now: NOW }).ok, false);
});

test('a missing price is allowed — not every alert carries one', () => {
  const result = validateAlert(payload({ price: undefined }), { secret: SECRET, now: NOW });
  assert.equal(result.ok, true);
  assert.equal(result.alert.price, null);
});

test('free-text fields are truncated rather than trusted', () => {
  const result = validateAlert(payload({ note: 'x'.repeat(5000), interval: 'y'.repeat(50) }), {
    secret: SECRET,
    now: NOW,
  });

  assert.equal(result.alert.note.length, 280);
  assert.equal(result.alert.interval.length, 8);
})

// ── replay ───────────────────────────────────────────────────────────────────

test('the same alert id is admitted once', () => {
  const guard = createReplayGuard({ windowMs: 60_000, now: () => NOW });
  assert.equal(guard.admit('idea.entry:SOLUSDT:4h:1'), true);
  assert.equal(guard.admit('idea.entry:SOLUSDT:4h:1'), false);
  assert.equal(guard.admit('idea.entry:SOLUSDT:4h:2'), true, 'a different bar is a different alert');
});

test('ids expire, so the guard does not grow without bound', () => {
  let clock = NOW;
  const guard = createReplayGuard({ windowMs: 60_000, now: () => clock });

  guard.admit('a');
  assert.equal(guard.size, 1);
  clock += 120_000;
  guard.admit('b');
  assert.equal(guard.size, 1, 'the expired id was swept, not kept');
  assert.equal(guard.admit('a'), true, 'and can be admitted again after the window');
});

// ── source allowlist ─────────────────────────────────────────────────────────

test('an empty allowlist permits any source', () => {
  assert.equal(sourceAllowed('203.0.113.9', []), true);
  assert.equal(sourceAllowed('203.0.113.9', undefined), true);
});

test('a dual-stack peer address still matches its IPv4 entry', () => {
  // Node reports IPv4 peers as ::ffff:a.b.c.d on a dual-stack socket, which
  // would silently fail every allowlist entry if compared literally.
  assert.equal(sourceAllowed('::ffff:52.89.214.238', ['52.89.214.238']), true);
  assert.equal(sourceAllowed('52.89.214.238', ['52.89.214.238']), true);
  assert.equal(sourceAllowed('203.0.113.9', ['52.89.214.238']), false);
});

// ── the inbox ────────────────────────────────────────────────────────────────

function makeInbox(overrides = {}, { now = () => NOW } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memebot-tv-'));
  const config = loadConfig(
    { dataDir: dir, tradingview: { enabled: true, ...overrides } },
    { MEMEBOT_TRADINGVIEW_SECRET: overrides.secret === null ? undefined : SECRET },
  );
  return { inbox: createAlertInbox(config, { now }), dir, config };
}

test('a good alert is recorded, logged to disk and emitted', () => {
  const { inbox, dir } = makeInbox();
  const seen = [];
  inbox.events.on('alert', (alert) => seen.push(alert));

  const result = inbox.receive(JSON.stringify(payload()));

  assert.equal(result.status, 200);
  assert.equal(result.body.accepted, true);
  assert.equal(inbox.recent.length, 1);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].symbol, 'SOLUSDT');

  const written = fs.readFileSync(path.join(dir, 'tradingview.jsonl'), 'utf8').trim();
  assert.equal(JSON.parse(written).symbol, 'SOLUSDT');
});

test('the durable log never contains the shared secret', () => {
  const { inbox, dir } = makeInbox();
  inbox.receive(JSON.stringify(payload({ note: 'ordinary note' })));

  const written = fs.readFileSync(path.join(dir, 'tradingview.jsonl'), 'utf8');
  assert.ok(!written.includes(SECRET), 'the credential must not be persisted with the alert');
});

test('the webhook is closed when disabled and when unconfigured', () => {
  const disabled = makeInbox({ enabled: false }).inbox;
  assert.equal(disabled.receive(JSON.stringify(payload())).status, 404);

  const unconfigured = makeInbox({ secret: null }).inbox;
  const result = unconfigured.receive(JSON.stringify(payload()));
  assert.equal(result.status, 503, 'no secret means closed, never open to everyone');
  assert.equal(unconfigured.recent.length, 0);
});

test('a rejected alert answers 2xx so TradingView does not retry forever', () => {
  const { inbox } = makeInbox();
  // A malformed body will be exactly as malformed on the fifth attempt; the
  // only thing a retry earns is a storm.
  const malformed = inbox.receive('not json at all');
  assert.equal(malformed.status, 200);
  assert.equal(malformed.body.accepted, false);

  // A bad secret is the exception: it shows up in TradingView's delivery log,
  // which is where a misconfigured alert becomes visible to its owner.
  assert.equal(inbox.receive(JSON.stringify(payload({ secret: 'nope' }))).status, 401);
});

test('a duplicate delivery is recorded once', () => {
  const { inbox } = makeInbox();
  const body = JSON.stringify(payload());

  assert.equal(inbox.receive(body).body.accepted, true);
  const second = inbox.receive(body);

  assert.equal(second.body.accepted, false);
  assert.equal(second.body.reason, 'duplicate');
  assert.equal(inbox.recent.length, 1);
  assert.equal(inbox.stats.duplicates, 1);
});

test('a source outside the allowlist is refused before parsing', () => {
  const { inbox } = makeInbox({ allowSourceIps: ['52.89.214.238'] });

  const blocked = inbox.receive(JSON.stringify(payload()), { address: '203.0.113.9' });
  assert.equal(blocked.status, 403);

  const allowed = inbox.receive(JSON.stringify(payload()), { address: '::ffff:52.89.214.238' });
  assert.equal(allowed.body.accepted, true);
});

test('the inbox has no way to place an order', () => {
  // The property that matters most here, asserted structurally: an inbound
  // request from the internet must not be one hop from signing a transaction.
  const { inbox } = makeInbox();
  const surface = Object.keys(inbox);

  assert.deepEqual(surface.sort(), ['events', 'receive', 'recent', 'stats']);
  assert.equal(typeof inbox.execute, 'undefined');
});

test('previous alerts are restored on restart', () => {
  const { inbox, config } = makeInbox();
  inbox.receive(JSON.stringify(payload()));

  const reopened = createAlertInbox(config, { now: () => NOW });
  assert.equal(reopened.recent.length, 1);
  assert.equal(reopened.recent[0].symbol, 'SOLUSDT');
});

// ── the message template ─────────────────────────────────────────────────────

test('the message template is valid JSON with TradingView placeholders intact', () => {
  const parsed = JSON.parse(messageTemplate({ secret: SECRET }));

  assert.equal(parsed.secret, SECRET);
  assert.equal(parsed.symbol, '{{ticker}}');
  assert.equal(parsed.price, '{{close}}', 'quoted, so an empty substitution cannot break the whole body');
  assert.ok(EVENTS.has(parsed.event));
});

test('a template filled in by TradingView validates', () => {
  // Simulate the substitution their servers perform, then run it through the
  // real validator — the template and the parser must agree on every field.
  const substituted = messageTemplate({ secret: SECRET })
    .replace('{{ticker}}', 'BTCUSDT')
    .replace('{{interval}}', '60')
    .replace('{{close}}', '64213.5')
    .replace('{{timenow}}', new Date(NOW).toISOString());

  const parsed = parseAlert(substituted);
  assert.equal(parsed.ok, true);

  const result = validateAlert(parsed.payload, { secret: SECRET, now: NOW });
  assert.equal(result.ok, true, result.reason);
  assert.equal(result.alert.symbol, 'BTCUSDT');
  assert.equal(result.alert.price, 64213.5);
});
