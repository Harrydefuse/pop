# memebot

An AI-assisted memecoin scanner and trading agent for Solana, focused on
launchpads — it trades pump.fun bonding curves directly, not just the AMM pairs
they graduate into.

It watches new launches, throws out the ones that look like rugs, scores what's
left on momentum, asks Claude whether the narrative is real, then sizes, opens
and closes positions against live prices.

> **Paper trading is the default and the fallback.** Live execution is fully
> wired, but it stays off unless five separate conditions are all satisfied, and
> a misconfigured bot degrades to paper rather than trading unguarded. Read
> [Live trading](#live-trading) before arming anything.

## Quick start

```bash
cd bot
npm install

# Optional but recommended — enables narrative scoring.
export ANTHROPIC_API_KEY=sk-ant-...

# Optional — the public RPC is heavily rate-limited.
export SOLANA_RPC_URL=https://your-provider/...

npm run scan                          # one cycle, ranked table, no trades
node src/cli.js analyze <token-addr>  # every check and signal for one token
npm run watch                         # run continuously, paper-trade the signals
npm run report                        # portfolio and closed-trade statistics
npm run serve                         # run the loop + the API the dashboard reads
node src/cli.js status                # execution mode, arming state, today's spend
```

Without `ANTHROPIC_API_KEY` the bot still runs end to end; narrative scores fall
back to a neutral 0.5 and the mechanical screens do all the work.

## How a cycle works

```
discover ──▶ enrich ──▶ safety screen ──▶ momentum ──▶ narrative ──▶ decide ──▶ paper trade
 (feeds)     (market)     (rug checks)     (flow)      (Claude)      (weights)   (sized, logged)
```

Ordering is cost-driven. The cheap filters run first and discard most
candidates; the on-chain RPC calls run only on survivors; Claude is consulted
last, and only on tokens that are already plausibly tradeable. In testing that
is roughly 1 in 10 of what discovery returns.

### 1. Discovery

DexScreener's token-profile and boost feeds, plus any search terms you add to
`discovery.searchTerms`. Free, no API key.

**Venues are a hard filter, not a score.** `discovery.venues` defaults to
`['pumpfun', 'pumpswap']` — the bonding curve and the AMM those tokens graduate
to. A token the bot cannot execute on is never analysed, because paying to score
something unbuyable is waste. Widen with `['*']` for every venue or
`['launchpads']` for every launchpad; the registry is `src/venues/index.js`.

A token's venue also decides which safety thresholds apply. A bonding-curve
token minutes after launch has a few thousand dollars on the curve and no
trading history — judged by the AMM thresholds it fails every time, which would
make a launchpad-focused bot scan nothing. `safety.venueOverrides.curve` relaxes
depth and age for those and **only** those; the mint- and freeze-authority
checks are never relaxed. The extra risk is meant to be carried by smaller
position sizes, not by pretending the token is safer than it is.

### 2. Safety screen — the only stage that can veto

Most memecoins fail here, which is the point. Weighted checks, some of them
fatal:

| Check | Fatal | Why |
| --- | --- | --- |
| Liquidity ≥ threshold | ✅ | You cannot exit a pool that isn't there |
| Mint authority revoked | ✅ | A live mint authority can print supply into your bid |
| Freeze authority revoked | ✅ | A live freeze authority can stop you selling |
| Sells observed at volume | ✅ | Buys with zero sells is the honeypot signature |
| Top-10 holder share | | Insider-concentrated supply is an exit waiting to happen |
| Market cap / liquidity | | A big cap on a thin float can't be sold at the quoted price |
| Volume / liquidity | | Extreme turnover with a flat price is wash trading |
| Pair age window | | Too new to have a chart, too old to be an early entry |
| Website or socials | | Weak signal, cheap to check |

Holder concentration excludes the AMM pool: the pool vault is legitimately one
of the largest holders, so counting it would flag every healthy token.

If the RPC is unreachable the on-chain checks score as *missed*, not as passed —
an outage must never read as a clean bill of health.

### 3. Momentum

Volume acceleration on two timescales, buy/sell imbalance at 5m and 1h, trade
count, price trend and pool turnover. A vertical print scores *lower*, not
higher — buying +300% in an hour is buying someone else's exit. All three gates
(buy ratio, acceleration, participation) must hold before momentum counts as
confirmed.

### 4. Narrative — the AI part

Claude reads the name, ticker, description and links, and scores one axis: how
plausibly this attracts organic attention. It flags impersonation, copycats,
AI-boilerplate slop, and guaranteed-return language.

Claude never sees price data and never decides whether to trade — it scores one
input that is then weighted alongside the others. A confident-but-wrong model
judgement can't override the risk rules, and a `suspicious` verdict can only
ever *reject*, never approve.

Requests use structured outputs, so a malformed response is impossible rather
than merely unlikely, and the system prompt carries a cache breakpoint since it
is identical on every cycle.

### 5. Decision and sizing

`composite = 0.40 × safety + 0.35 × momentum + 0.25 × narrative`

- **enter** — composite ≥ threshold *and* momentum confirmed
- **watch** — score qualifies but momentum hasn't confirmed
- **skip** — below threshold
- **reject** — a fatal safety check failed, safety is below the veto line, or
  the narrative was flagged suspicious

Position size is the smallest of: your configured share of bankroll, available
cash, and a hard cap on pool share (default 0.5%) so the exit stays possible.

### 6. Exits

Checked worst-case first on every cycle: stop loss → trailing stop (after the
position has run far enough to arm it) → take profit → max hold time. A closed
token then enters a re-entry cooldown; without it the next cycle simply re-buys
whatever just stopped out, because the entry signal is still there and now
cheaper.

Simulated fills are worse than the quoted price: a constant-product slippage
term scaled by position size against pool depth, plus LP and priority fees. A
backtest that fills at mid will flatter any strategy.

## The dashboard

The bot can drive a live web control panel — equity curve, open positions with
stop/target tracks, and a feed of every decision with the reasoning behind it.

A browser can't read the bot's JSON files, so `serve` runs the normal cycle loop
*and* exposes a small local API for the UI to read:

```bash
# terminal 1 — the bot and its API
cd bot && node src/cli.js serve

# terminal 2 — the web app
cd .. && npm install && npm run dev
# open http://localhost:5173/dashboard.html
```

The dashboard lives in the repo's Vite app as a **separate page**
(`dashboard.html`), not a route on the Relay landing page — the two share the
design tokens and nothing else. In dev, Vite proxies `/api` to the bot, so the
page is same-origin and the event stream needs no CORS.

| Route | Purpose |
| --- | --- |
| `GET /api/state` | Everything the page paints on load |
| `GET /api/stream` | Server-sent events: stage changes, decisions, fills |
| `GET /api/equity` | Equity samples, one per cycle |
| `GET /api/decisions` | Recent scored tokens |
| `GET /api/positions` · `/api/trades` · `/api/signals` | Open, closed, and raw signal log |
| `POST /api/scan` | Run a cycle now (the "scan now" button) |

Updates are pushed over SSE; if the stream drops the page falls back to polling
and keeps retrying, so a restarted bot reconnects on its own.

`serve --no-loop` serves stored state without scanning — useful for reading back
a previous run's history.

> **Bind it to loopback.** The API has no authentication and can trigger a scan.
> `server.host` defaults to `127.0.0.1`; putting it on a public interface would
> expose your portfolio state and a trigger endpoint to anyone who finds it.

## Configuration

Defaults live in `src/config.js`. Override them three ways, lowest precedence
first:

1. `config.json` in `bot/` (git-ignored — copy `config.example.json`)
2. Environment variables: `MEMEBOT_` + the setting path, upper-snake-cased
3. Command-line flags

```bash
MEMEBOT_SAFETY_MIN_LIQUIDITY_USD=50000 npm run scan
MEMEBOT_RISK_POSITION_SIZE_PCT=0.02 npm run watch
MEMEBOT_DISCOVERY_SEARCH_TERMS=cat,ai,election npm run scan
```

`node src/cli.js config` prints the fully resolved configuration.

The knobs worth tuning first: `safety.minLiquidityUsd`, `scoring.entryThreshold`,
`risk.positionSizePct`, and `risk.stopLossPct`.

## Data

Everything is written to `bot/data/` (git-ignored):

| File | Contents |
| --- | --- |
| `portfolio.json` | Cash, open positions, cooldowns, closed trades |
| `signals.jsonl` | Every scored token, one JSON object per line |
| `trades.jsonl` | Append-only open/close log |

`signals.jsonl` is the useful one: it's a labelled dataset of what the bot saw
and what it decided, which is what you need to tune the weights against
outcomes rather than intuition.

## Tests

```bash
npm test
```

40 tests. The unit tests cover the scoring maths, safety heuristics and
portfolio accounting; `test/engine.test.js` runs the whole pipeline —
discovery through to a persisted paper trade — against stubbed HTTP and a
stubbed Claude client, so no network or API key is needed.

## Live trading

The bot can sign and send real swaps. It routes by venue: **pump.fun bonding
curves go through PumpPortal's local-transaction endpoint**, everything with a
real pool goes through **Jupiter**. Either way the transaction is built by the
venue's API, signed *in this process*, and submitted by us — the private key
never leaves the machine and is never sent to any API.

### Arming it

Live mode requires **all five** of these. Miss any one and the bot runs as paper
instead — it does not crash, and it does not trade unguarded:

1. `"mode": "live"` in `config.json`
2. `execution.armPhrase` set to exactly `i-understand-this-spends-real-money`
3. `MEMEBOT_LIVE_ARMED=true` in the environment
4. a key, via `SOLANA_PRIVATE_KEY` or `execution.keypairPath`
5. no kill-switch file present

Three independent switches, deliberately: a stray config edit, a copied file, or
a shell history replay cannot arm this on its own.

```bash
node src/cli.js status     # what mode you are actually in, and what's blocking live
node src/cli.js stop       # engage the kill switch — halts live trading now
node src/cli.js resume     # release it
```

`status` is the honest answer: it resolves the executor exactly as a real cycle
would, so what it prints is what will happen.

### The guard

Every limit is enforced in `src/execute/guard.js`, **outside the strategy**, and
every order passes through it before a transaction is built. That separation is
the point — a bug in the scoring code, a bad model response, or a hostile token
can make the strategy want something stupid, and none of them can move these
numbers.

| Limit | Default | Enforces |
| --- | --- | --- |
| `maxTradeUsd` | $25 | Worst case for a single bad entry |
| `maxDailySpendUsd` | $100 | Worst case for a bad day. Tracked on disk, so a crash loop can't reset it |
| `maxTradesPerDay` | 10 | Caps churn independently of spend |
| `minSecondsBetweenTrades` | 60 | Stops a runaway loop |
| `minSolReserve` | 0.05 SOL | Fees are paid in SOL — spend it all and you can't afford the transaction that *sells* |
| `maxSlippageBps` | 300 | A quote whose own price impact exceeds this is never signed |
| `exitSlippageBps` | 900 | Exits get a wider budget: a bad fill beats not being able to sell |
| `allowMints` / `denyMints` | — | An allowlist, if non-empty, is exclusive |

Spend is only recorded **after** a transaction confirms. A failed build or a
failed send costs nothing against the daily budget.

### What happens when things go wrong

- **The quote is worse than the budget** → not signed, order refused.
- **The transaction fails on chain** → reported as a failed order. No position is
  recorded, no spend counted.
- **The buy lands but the fill can't be parsed** → the kill switch engages. We
  may now hold a token the ledger doesn't know about, and guessing would be worse
  than stopping.
- **An exit fails** → the kill switch engages and the position *stays on the
  books*. Silently dropping a position we couldn't sell would be the worst
  outcome available.

Positions are recorded from the confirmed transaction's balance deltas, not from
the quote — so the ledger holds the price you actually paid, including slippage
and fees.

### Before you arm it

- **Validate the wire formats first.** The Jupiter and PumpPortal request shapes
  follow their documented APIs but have **not** been exercised against the live
  endpoints from this repo. Run one trade at a couple of dollars and check the
  signature on a block explorer before raising any limit.
- **PumpPortal is an unaffiliated third party.** Using it means trusting it to
  build a correct transaction. The local endpoint means it never holds your keys,
  but it does choose what you sign.
- **Use a dedicated wallet** funded only with what you can lose. `chmod 600` the
  keypair file — the loader refuses a group- or world-readable one.
- **Paper first.** If the strategy isn't profitable in simulation, where fills are
  modelled optimistically and there is no MEV, it will not be profitable live.

Memecoin trading loses money for most participants most of the time. The screens
here are heuristics over public data, not a contract audit — they cannot catch a
novel exploit or a team that simply sells.
