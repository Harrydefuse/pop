# memebot

An AI-assisted memecoin scanner and **paper-trading** agent for Solana.

It watches new pools, throws out the ones that look like rugs, scores what's
left on momentum, asks Claude whether the narrative is real, and — in
simulation — sizes, opens and closes positions against live prices.

> **It does not trade real money.** Nothing in this repo handles a private key,
> signs a transaction, or connects to a wallet. That is a deliberate design
> decision, not an unfinished feature. See [Going live](#going-live).

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

## Going live

This bot does not execute real trades, and adding that is not a small change.
Before wiring in a signer, understand what you'd be taking on:

- **Key custody.** An unattended process holding a hot key is a standing target.
  At minimum: a dedicated wallet funded only with what you can lose, keys in a
  signer process separate from the strategy code, and a hard per-day spend cap
  enforced outside the trading logic.
- **Execution reality.** Real fills face MEV sandwiching, failed transactions
  that still cost fees, and priority-fee auctions. Solana route quotes (Jupiter)
  will tell you the real expected slippage before you commit — the simulation
  here is an approximation.
- **The screens are heuristics, not an audit.** They catch common failure
  shapes. They cannot catch a novel exploit, a team that simply sells, or a
  freshly-deployed contract with unusual logic.
- **Validate on paper first.** Run `watch` for a few weeks, then read
  `signals.jsonl` and `report`. If the strategy isn't profitable in simulation —
  where fills are modelled optimistically and there's no MEV — it will not be
  profitable live.

Memecoin trading loses money for most participants most of the time. Treat
anything this produces as research, not advice.
