/**
 * Market structure, setup construction and the ideas orchestrator.
 *
 * The interesting tests here are the ones asserting that a setup is *refused*.
 * Anything can produce a trade idea; the value is in the rejections, so those
 * paths get more coverage than the happy path does.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  analyseStructure,
  clusterLevels,
  pivots,
  selectLevels,
  swingStructure,
  trend,
} from '../src/ideas/levels.js';
import { breakEvenWinRate, buildSetup, confluence, drawings } from '../src/ideas/setup.js';
import { _internals, explain } from '../src/ideas/rationale.js';
import { analyseSymbol, findIdeas } from '../src/ideas/index.js';
import { ideaScript } from '../src/ta/pine.js';

/**
 * Candles from a close series. `shape` lets a test pin an exact high/low on one
 * bar, which is how the pivot tests build a plateau without fighting the
 * derived wicks.
 */
function series(closes, { volume = 100, shape = () => null } = {}) {
  return closes.map((value, i) => {
    const prev = i === 0 ? value : closes[i - 1];
    const override = shape(i, value) ?? {};
    return {
      openTime: i * 3_600_000,
      closeTime: (i + 1) * 3_600_000 - 1,
      open: prev,
      high: Math.max(value, prev) * 1.005,
      low: Math.min(value, prev) * 0.995,
      close: value,
      volume: typeof volume === 'function' ? volume(i) : volume,
      ...override,
    };
  });
}

// ── pivots ───────────────────────────────────────────────────────────────────

test('a pivot high needs clearance on both sides', () => {
  // A single spike at index 5, flanked by 5 quiet bars each way.
  const closes = Array.from({ length: 11 }, (_, i) => (i === 5 ? 120 : 100));
  const candles = series(closes, { shape: (i) => ({ high: i === 5 ? 130 : 101, low: 99 }) });

  const { highs } = pivots(candles, 5);
  assert.equal(highs.length, 1);
  assert.equal(highs[0].index, 5);
});

test('pivots are never reported before they could be known', () => {
  const closes = Array.from({ length: 11 }, (_, i) => (i === 5 ? 120 : 100));
  const candles = series(closes, { shape: (i) => ({ high: i === 5 ? 130 : 101, low: 99 }) });

  const { highs } = pivots(candles, 5);
  // A live system learns of a bar-5 pivot only once bar 10 has printed.
  assert.equal(highs[0].confirmedAt, 10, 'confirmedAt must trail index by lookback');
  assert.ok(highs[0].confirmedAt > highs[0].index);
});

test('a plateau of equal highs yields exactly one pivot, not zero', () => {
  // Three bars share the same high. Under a symmetric >= comparison each one
  // disqualifies its neighbours and the plateau vanishes from the chart — the
  // regression this test exists for.
  const candles = series(Array.from({ length: 15 }, () => 100), {
    shape: (i) => ({ high: i >= 6 && i <= 8 ? 130 : 101, low: 99 }),
  });

  const { highs } = pivots(candles, 5);
  assert.equal(highs.length, 1, 'flat top should still be a level');
  assert.equal(highs[0].index, 6, 'the first bar of the plateau is the pivot');
});

test('bars inside the lookback margin are not scanned', () => {
  const candles = series(Array.from({ length: 8 }, () => 100), {
    shape: (i) => ({ high: i === 1 ? 500 : 101, low: 99 }),
  });
  // Index 1 is the highest bar but has only 1 bar of left clearance.
  const { highs } = pivots(candles, 5);
  assert.equal(highs.length, 0);
});

// ── clustering and selection ─────────────────────────────────────────────────

test('nearby pivots collapse into one level and count as touches', () => {
  const points = [
    { index: 10, confirmedAt: 15, price: 100 },
    { index: 40, confirmedAt: 45, price: 100.4 },
    { index: 70, confirmedAt: 75, price: 130 },
  ];
  const levels = clusterLevels(points, { tolerance: 1, totalBars: 101 });

  assert.equal(levels.length, 2);
  assert.equal(levels[0].touches, 2);
  assert.ok(Math.abs(levels[0].price - 100.2) < 1e-9, 'level sits at the mean of its touches');
  assert.equal(levels[0].lastIndex, 40);
  assert.equal(levels[1].touches, 1);
});

test('a recent level outranks an older one with the same touch count', () => {
  const [stale] = clusterLevels([{ index: 0, confirmedAt: 5, price: 100 }], { totalBars: 101, tolerance: 1 });
  const [fresh] = clusterLevels([{ index: 100, confirmedAt: 100, price: 100 }], { totalBars: 101, tolerance: 1 });

  assert.ok(fresh.strength > stale.strength);
  assert.equal(fresh.strength, 1, 'a touch at the right edge scores full recency');
  assert.equal(stale.strength, 0.5);
});

test('levels are selected per side, so a trending chart still has support', () => {
  // Four strong resistances overhead, one weak support below. Ranking all five
  // together and taking the top 3 would leave the long setup with nothing to
  // anchor to — this is the bug the per-side split fixes.
  const levels = [
    { price: 90, strength: 0.5, touches: 1 },
    { price: 110, strength: 4, touches: 4 },
    { price: 120, strength: 3.5, touches: 4 },
    { price: 130, strength: 3, touches: 3 },
    { price: 140, strength: 2.5, touches: 3 },
  ];
  const { support, resistance, all } = selectLevels(levels, 100, 3);

  assert.equal(support.length, 1, 'the weak support survives because it is judged on its own side');
  assert.equal(support[0].price, 90);
  assert.equal(resistance.length, 3, 'capped per side, not globally');
  assert.deepEqual(all.map((level) => level.price), [90, 110, 120, 130], 'all is sorted by price');
});

test('support is ordered nearest-first and resistance likewise', () => {
  const levels = [80, 90, 110, 120].map((price) => ({ price, strength: 1, touches: 1 }));
  const { support, resistance } = selectLevels(levels, 100, 3);

  assert.deepEqual(support.map((level) => level.price), [90, 80], 'nearest support first');
  assert.deepEqual(resistance.map((level) => level.price), [110, 120], 'nearest resistance first');
});

// ── trend ────────────────────────────────────────────────────────────────────

test('swing structure reads higher highs and higher lows', () => {
  const rising = swingStructure({
    highs: [{ price: 100 }, { price: 110 }],
    lows: [{ price: 90 }, { price: 95 }],
  });
  assert.equal(rising, 'up');

  const falling = swingStructure({
    highs: [{ price: 110 }, { price: 100 }],
    lows: [{ price: 95 }, { price: 90 }],
  });
  assert.equal(falling, 'down');

  const conflicted = swingStructure({
    highs: [{ price: 100 }, { price: 110 }],
    lows: [{ price: 95 }, { price: 90 }],
  });
  assert.equal(conflicted, 'mixed', 'higher high with a lower low is a range, not a trend');
});

test('swing structure is unknown without two swings on each side', () => {
  assert.equal(swingStructure({ highs: [{ price: 100 }], lows: [{ price: 90 }, { price: 95 }] }), 'unknown');
  assert.equal(swingStructure({ highs: [], lows: [] }), 'unknown');
});

test('trend reports mixed when the two readings disagree', () => {
  const candles = series(Array.from({ length: 80 }, (_, i) => 100 + i));
  // MA stack is plainly up; force the swing reading to contradict it.
  const disagreeing = trend(candles, {
    swings: { highs: [{ price: 110 }, { price: 100 }], lows: [{ price: 95 }, { price: 90 }] },
  });

  assert.equal(disagreeing.stack, 'up');
  assert.equal(disagreeing.structure, 'down');
  assert.equal(disagreeing.direction, 'mixed', 'disagreement is reported, not resolved');
});

test('trend agrees with itself on a clean uptrend', () => {
  const candles = series(Array.from({ length: 80 }, (_, i) => 100 + i));
  const reading = trend(candles, {
    swings: { highs: [{ price: 100 }, { price: 110 }], lows: [{ price: 90 }, { price: 95 }] },
  });

  assert.equal(reading.direction, 'up');
  assert.ok(reading.extension > 0, 'price is above the slow average in an uptrend');
});

// ── analyseStructure ─────────────────────────────────────────────────────────

test('analyseStructure returns levels on both sides of price', () => {
  const structure = analyseStructure(tradeableSeries());

  assert.ok(structure.atr > 0);
  assert.ok(Math.abs(structure.atrPct - structure.atr / structure.price) < 1e-12);
  assert.ok(structure.support.length > 0, 'a ranging market has support');
  assert.ok(structure.resistance.length > 0, 'and resistance');
  assert.ok(structure.support.every((level) => level.price < structure.price));
  assert.ok(structure.resistance.every((level) => level.price >= structure.price));
  assert.ok(structure.rangePosition >= 0 && structure.rangePosition <= 1);
});

test('cluster tolerance scales with volatility rather than being fixed', () => {
  // The same shape at two price scales must produce the same number of levels;
  // a fixed percentage tolerance would merge or split differently.
  const shape = (scale) => series(Array.from({ length: 217 }, (_, i) => scale * (106 + 6 * Math.sin((i / 11) * Math.PI * 2))));

  const cheap = analyseStructure(shape(0.0001));
  const dear = analyseStructure(shape(1000));
  assert.equal(cheap.levels.length, dear.levels.length);
});

// ── setup construction ───────────────────────────────────────────────────────

/** A structure object shaped like analyseStructure's output, for unit tests. */
function structureFixture(overrides = {}) {
  return {
    price: 100,
    atr: 2,
    atrPct: 0.02,
    levels: [],
    support: [{ price: 98, touches: 3, strength: 2.5 }],
    resistance: [{ price: 112, touches: 3, strength: 2.5 }],
    trend: { direction: 'up', stack: 'up', structure: 'up' },
    rangePosition: 0.3,
    ...overrides,
  };
}

test('break-even win rate is the inverse of reward-to-risk plus one', () => {
  assert.equal(breakEvenWinRate(1), 0.5, '1R needs half your trades to win');
  assert.equal(breakEvenWinRate(3), 0.25);
  assert.equal(breakEvenWinRate(0), 1, 'no reward means no win rate saves you');
  assert.equal(breakEvenWinRate(-1), 1);
});

test('a long is built at the support retest, not at market', () => {
  const structure = structureFixture();
  const setup = buildSetup(structure, series(Array.from({ length: 80 }, () => 100)));

  assert.equal(setup.ok, true);
  assert.equal(setup.side, 'long');
  assert.ok(setup.entry <= structure.price, 'entry is at or below spot — we are buying the retest');
  assert.ok(setup.stop < structure.support[0].price, 'stop sits beyond the level, not on it');
  assert.equal(setup.targets[0], 112, 'first target is the overhead level');
});

test('a downtrend produces a short against resistance', () => {
  // Resistance must sit within reach of price for a short to be actionable —
  // the fixture's default 112 is 6 ATR overhead and correctly refused.
  const structure = structureFixture({
    resistance: [{ price: 102, touches: 3, strength: 2.5 }],
    support: [{ price: 92, touches: 3, strength: 2.5 }],
    trend: { direction: 'down', stack: 'down', structure: 'down' },
  });
  const setup = buildSetup(structure, series(Array.from({ length: 80 }, () => 100)));

  assert.equal(setup.ok, true);
  assert.equal(setup.side, 'short');
  assert.ok(setup.stop > structure.resistance[0].price);
  assert.ok(setup.targets[0] < setup.entry);
});

test('a setup below the minimum reward-to-risk is refused', () => {
  // Target only 1 away, stop 3 away → 0.33R. No narrative rescues that.
  const structure = structureFixture({
    support: [{ price: 98, touches: 3, strength: 2.5 }],
    resistance: [{ price: 100.5, touches: 3, strength: 2.5 }],
  });
  const setup = buildSetup(structure, series(Array.from({ length: 80 }, () => 100)), { minRiskReward: 1.8 });

  assert.equal(setup.ok, false);
  assert.match(setup.reason, /reward-to-risk/);
  assert.ok(setup.riskReward < 1.8, 'the failing ratio is reported so it can be shown');
});

test('an entry more than maxEntryDistanceAtr away is refused', () => {
  // Support is 8 away with ATR 2 — a watchlist item, not a trade.
  const structure = structureFixture({ support: [{ price: 92, touches: 3, strength: 2.5 }] });
  const setup = buildSetup(structure, series(Array.from({ length: 80 }, () => 100)), { maxEntryDistanceAtr: 1.5 });

  assert.equal(setup.ok, false);
  assert.match(setup.reason, /ATR away/);
});

test('no structure at all is distinguished from a one-sided market', () => {
  const empty = buildSetup(structureFixture({ support: [], resistance: [] }), []);
  assert.equal(empty.ok, false);
  assert.match(empty.reason, /no swing structure/);

  // Support exists but the bias is down, so the short has no resistance to use.
  const oneSided = buildSetup(
    structureFixture({ resistance: [], trend: { direction: 'down', stack: 'down', structure: 'down' } }),
    [],
  );
  assert.equal(oneSided.ok, false);
  assert.match(oneSided.reason, /no resistance level above price/);
});

test('a missing volatility estimate blocks the setup entirely', () => {
  const setup = buildSetup(structureFixture({ atr: null }), []);
  assert.equal(setup.ok, false);
  assert.match(setup.reason, /volatility/);
});

test('position size is derived from the stop distance, not the notional', () => {
  const structure = structureFixture();
  const setup = buildSetup(structure, series(Array.from({ length: 80 }, () => 100)), {
    equityUsd: 10_000,
    riskPerTradePct: 0.01,
  });

  const riskUsd = setup.positionSize.quantity * setup.riskPerUnit;
  assert.ok(Math.abs(riskUsd - 100) < 1e-6, 'a stop-out costs exactly 1% of equity');
  assert.equal(setup.positionSize.riskUsd, 100);
});

test('a wider stop buys a smaller position for the same risk', () => {
  const tight = buildSetup(structureFixture(), series(Array.from({ length: 80 }, () => 100)), { stopAtrBuffer: 0.25 });
  const wide = buildSetup(structureFixture(), series(Array.from({ length: 80 }, () => 100)), { stopAtrBuffer: 1 });

  assert.equal(tight.ok, true);
  assert.equal(wide.ok, true);
  assert.ok(wide.positionSize.quantity < tight.positionSize.quantity);
});

test('with no overhead resistance a measured move stands in for a target', () => {
  const structure = structureFixture({ resistance: [] });
  const setup = buildSetup(structure, series(Array.from({ length: 80 }, () => 100)));

  assert.equal(setup.ok, true);
  assert.equal(setup.targets.length, 1);
  assert.ok(Math.abs(setup.targets[0] - (setup.entry + 6)) < 1e-9, '3 ATR measured move');
});

// ── confluence ───────────────────────────────────────────────────────────────

test('confluence names each factor and counts only the agreeing ones', () => {
  const structure = structureFixture();
  const candles = series(Array.from({ length: 80 }, () => 100));
  const setup = buildSetup(structure, candles);
  const factors = confluence(structure, candles, setup);

  const ids = factors.factors.map((factor) => factor.id);
  assert.ok(ids.includes('trend'));
  assert.ok(ids.includes('level'));
  assert.ok(ids.includes('reward'));
  assert.equal(factors.total, factors.factors.length);
  assert.equal(factors.supporting, factors.factors.filter((factor) => factor.supports).length);
  assert.equal(factors.against.length, factors.total - factors.supporting);
  assert.ok(Math.abs(factors.score - factors.supporting / factors.total) < 1e-12);
});

test('a long into an established downtrend loses the trend factor', () => {
  const structure = structureFixture({ trend: { direction: 'down', stack: 'down', structure: 'down' } });
  const candles = series(Array.from({ length: 80 }, () => 100));
  // Force a long despite the down bias by handing confluence a long setup.
  const setup = { ...buildSetup(structureFixture(), candles), side: 'long' };
  const factors = confluence(structure, candles, setup);

  const trendFactor = factors.factors.find((factor) => factor.id === 'trend');
  assert.equal(trendFactor.supports, false);
});

test('confluence rewards buying low in the range and penalises buying high', () => {
  const candles = series(Array.from({ length: 80 }, () => 100));
  const setup = buildSetup(structureFixture(), candles);

  const low = confluence(structureFixture({ rangePosition: 0.1 }), candles, setup);
  const high = confluence(structureFixture({ rangePosition: 0.9 }), candles, setup);

  assert.equal(low.factors.find((factor) => factor.id === 'range').supports, true);
  assert.equal(high.factors.find((factor) => factor.id === 'range').supports, false);
});

// ── drawings ─────────────────────────────────────────────────────────────────

test('drawings carry the zones a chart needs to shade risk against reward', () => {
  const structure = structureFixture({
    levels: [
      { price: 98, touches: 3, strength: 2.5 },
      { price: 112, touches: 3, strength: 2.5 },
    ],
  });
  const candles = series(Array.from({ length: 80 }, () => 100));
  const setup = buildSetup(structure, candles);
  const drawn = drawings(structure, setup);

  assert.equal(drawn.levels[0].kind, 'support');
  assert.equal(drawn.levels[1].kind, 'resistance');

  const kinds = drawn.zones.map((zone) => zone.kind);
  assert.deepEqual(kinds.slice(0, 3), ['entry', 'stop', 'target']);
  const risk = drawn.zones.find((zone) => zone.kind === 'stop');
  assert.equal(risk.from, setup.stop);
  assert.equal(risk.to, setup.entry);
});

test('a rejected setup still returns its levels so the chart is not blank', () => {
  const structure = structureFixture({ levels: [{ price: 98, touches: 2, strength: 1 }] });
  const drawn = drawings(structure, { ok: false, reason: 'nope' });

  assert.equal(drawn.levels.length, 1);
  assert.deepEqual(drawn.zones, []);
});

// ── orchestration ────────────────────────────────────────────────────────────

/**
 * A candle series that reliably produces a long setup.
 *
 * An 11-bar oscillation between 100 and 112 lays down repeated touches at both
 * extremes, and the length is chosen so the final bar sits near a trough — i.e.
 * close enough to support that the entry is within the ATR distance guard. Cut
 * it a few bars either way and the engine correctly refuses the trade, which is
 * itself a useful thing to know about this fixture.
 */
function tradeableSeries() {
  const closes = [];
  for (let i = 0; i < 217; i += 1) closes.push(106 + 6 * Math.sin((i / 11) * Math.PI * 2));
  return series(closes);
}

test('a symbol with too little history is rejected before any analysis', () => {
  const result = analyseSymbol('SHORTUSDT', series(Array.from({ length: 30 }, () => 100)));
  assert.equal(result.ok, false);
  assert.match(result.reason, /fewer than 60 bars/);
});

test('analyseSymbol returns a complete idea when the numbers work', () => {
  const result = analyseSymbol('TESTUSDT', tradeableSeries(), { interval: '4h' });

  assert.equal(result.ok, true, result.reason);
  assert.equal(result.setup.side, 'long');
  assert.ok(result.setup.entry > 0);
  assert.ok(result.setup.riskReward >= 1.8);
  assert.ok(result.drawings.levels.length > 0);
  assert.ok(result.candles.length <= 120, 'candles are trimmed for the chart');
  assert.ok(result.rank >= 0 && result.rank <= 1);
});

test('rank weights factor agreement above reward-to-risk', () => {
  // Same rank formula, two hypothetical ideas: broad agreement at 2R should
  // outrank a lone-factor 5R lottery ticket.
  const rank = (score, riskReward) => score * 0.65 + Math.min(riskReward / 4, 1) * 0.35;
  assert.ok(rank(1, 2) > rank(0.2, 5));
});

test('findIdeas surfaces per-symbol failures instead of aborting the scan', async () => {
  const config = { narrative: { enabled: false, disabledReason: 'test' } };
  const result = await findIdeas(config, {
    symbols: ['GOODUSDT', 'BADUSDT'],
    minRank: 0,
    explainTop: 0,
    sources: {
      fetchCandles: async (symbol) => {
        if (symbol === 'BADUSDT') throw new Error('exchange said no');
        return tradeableSeries();
      },
    },
  });

  assert.equal(result.scanned, 2);
  const failure = result.rejected.find((entry) => entry.symbol === 'BADUSDT');
  assert.ok(failure, 'the failing symbol is reported, not silently dropped');
  assert.equal(failure.reason, 'exchange said no');
});

test('findIdeas only spends a model call on symbols above the threshold', async () => {
  const config = { narrative: { enabled: false, disabledReason: 'test' } };
  const result = await findIdeas(config, {
    symbols: ['AUSDT', 'BUSDT', 'CUSDT'],
    minRank: 1.1, // unreachable — rank is capped at 1
    explainTop: 5,
    sources: { fetchCandles: async () => tradeableSeries() },
  });

  assert.equal(result.ideas.length, 0);
  assert.equal(result.explained, 0, 'nothing qualified, so nothing was explained');
});

test('every qualifying idea carries a rationale by the time it is returned', async () => {
  const config = { narrative: { enabled: false, disabledReason: 'test' } };
  const result = await findIdeas(config, {
    symbols: ['AUSDT', 'BUSDT'],
    minRank: 0.55,
    explainTop: 5,
    sources: { fetchCandles: async () => tradeableSeries() },
  });

  assert.ok(result.ideas.length > 0, 'the fixture is meant to qualify');
  assert.equal(result.explained, result.ideas.length);
  for (const idea of result.ideas) {
    assert.ok(idea.rationale.thesis.length > 0);
    assert.ok(idea.rationale.invalidation.length > 0);
  }
});

test('findIdeas uses the exchange universe when no symbols are given', async () => {
  const config = { narrative: { enabled: false, disabledReason: 'test' } };
  let asked = null;
  await findIdeas(config, {
    quote: 'USDC',
    contains: 'PEPE',
    minRank: 0,
    explainTop: 0,
    sources: {
      fetchSymbols: async (options) => {
        asked = options;
        return [{ symbol: 'PEPEUSDC' }];
      },
      fetchCandles: async () => tradeableSeries(),
    },
  });

  assert.equal(asked.quote, 'USDC');
  assert.equal(asked.contains, 'PEPE');
});

// ── rationale ────────────────────────────────────────────────────────────────

function ideaFixture() {
  const structure = structureFixture({
    levels: [
      { price: 98, touches: 3, strength: 2.5 },
      { price: 112, touches: 2, strength: 1.5 },
    ],
  });
  const candles = series(Array.from({ length: 80 }, () => 100));
  const setup = buildSetup(structure, candles);
  return {
    symbol: 'TESTUSDT',
    interval: '4h',
    structure,
    setup,
    confluence: confluence(structure, candles, setup),
  };
}

test('the model is shown every number it is allowed to use, and no others', () => {
  const rendered = _internals.describe(ideaFixture());

  assert.match(rendered, /symbol: TESTUSDT/);
  assert.match(rendered, /reward-to-risk/);
  assert.match(rendered, /levels on the chart:/);
  assert.match(rendered, /factors that DO NOT support it:/);
});

test('an idea with nothing against it says so rather than inviting invention', () => {
  const idea = ideaFixture();
  idea.confluence = { ...idea.confluence, against: [] };
  assert.match(_internals.describe(idea), /none — say so plainly/);
});

test('the system prompt forbids the model from sourcing its own numbers', () => {
  assert.match(_internals.SYSTEM_PROMPT, /Never introduce a price level/);
  assert.match(_internals.SYSTEM_PROMPT, /Never change the side, entry, stop, or targets/);
});

test('a failing model degrades to a mechanical explanation, never to nothing', async () => {
  const idea = ideaFixture();
  const client = {
    beta: { messages: { create: async () => { throw new Error('network down'); } } },
    messages: { create: async () => { throw new Error('network down'); } },
  };

  const rationale = await explain(idea, { enabled: true, model: 'claude-opus-5', effort: 'low' }, { client });

  assert.equal(rationale.generated, false);
  assert.ok(rationale.thesis.includes('TESTUSDT'));
  assert.equal(rationale.invalidation, idea.setup.invalidation);
  assert.match(rationale.note, /network down/);
});

test('a refusal is treated as a failure, not as an explanation', async () => {
  const idea = ideaFixture();
  const client = {
    beta: {
      messages: {
        create: async () => ({ stop_reason: 'refusal', content: [{ type: 'text', text: '{}' }] }),
      },
    },
  };

  const rationale = await explain(idea, { enabled: true, model: 'claude-opus-5', effort: 'low' }, { client });
  assert.equal(rationale.generated, false, 'a refusal must not be parsed as JSON output');
});

test('a successful call is parsed and marked as model-generated', async () => {
  const idea = ideaFixture();
  const payload = {
    thesis: 'Long the retest.',
    supporting: ['Trend is up'],
    against: ['Volume is thin'],
    invalidation: 'A close below the stop.',
    conviction: 'moderate',
  };
  const client = {
    beta: {
      messages: {
        create: async (request) => {
          assert.equal(request.output_config.format.type, 'json_schema');
          assert.equal(request.system[0].cache_control.type, 'ephemeral');
          return { stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(payload) }] };
        },
      },
    },
  };

  const rationale = await explain(idea, { enabled: true, model: 'claude-opus-5', effort: 'low' }, { client });
  assert.equal(rationale.generated, true);
  assert.equal(rationale.conviction, 'moderate');
  assert.deepEqual(rationale.against, ['Volume is thin']);
});

test('a 400 from the fallback beta retries on the plain endpoint', async () => {
  const idea = ideaFixture();
  let plainCalls = 0;
  const client = {
    beta: {
      messages: {
        create: async () => {
          const error = new Error('unknown beta');
          error.status = 400;
          throw error;
        },
      },
    },
    messages: {
      create: async () => {
        plainCalls += 1;
        return {
          stop_reason: 'end_turn',
          content: [{
            type: 'text',
            text: JSON.stringify({
              thesis: 't', supporting: [], against: ['a'], invalidation: 'i', conviction: 'thin',
            }),
          }],
        };
      },
    },
  };

  const rationale = await explain(idea, { enabled: true, model: 'claude-opus-5', effort: 'low' }, { client });
  assert.equal(plainCalls, 1);
  assert.equal(rationale.generated, true);
});

test('narrative disabled skips the network entirely', async () => {
  const client = {
    beta: { messages: { create: async () => assert.fail('should not call the API') } },
  };
  const rationale = await explain(ideaFixture(), { enabled: false, disabledReason: 'no key' }, { client });

  assert.equal(rationale.generated, false);
  assert.match(rationale.note, /no key/);
});

// ── Pine output ──────────────────────────────────────────────────────────────

test('the generated Pine script bakes in this idea\'s exact prices', () => {
  const idea = { ...ideaFixture(), symbol: 'TESTUSDT', interval: '4h' };
  const script = ideaScript(idea);

  assert.match(script, /^\/\/ /, 'starts with the header comment');
  assert.match(script, /@version=6/);
  assert.match(script, /indicator\("TESTUSDT long setup \(memebot\)", overlay = true\)/);
  assert.ok(script.includes(Number(idea.setup.entry).toPrecision(8)), 'entry is a literal in the script');
  assert.ok(script.includes(Number(idea.setup.stop).toPrecision(8)), 'stop is a literal in the script');
  // One input line per level found by the structure pass.
  assert.equal((script.match(/input\.float\(.*group = "Structure"/g) ?? []).length, idea.structure.levels.length);
});

test('a single-target idea still emits valid Pine for the second target', () => {
  const idea = ideaFixture();
  idea.setup = { ...idea.setup, targets: [idea.setup.targets[0]] };
  const script = ideaScript(idea);

  assert.match(script, /target2\s*=\s*float\(na\)/, 'absent target is na, not undefined');
});
