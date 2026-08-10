import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const BOT_ROOT = path.resolve(here, '..');

/**
 * Every knob the bot has, with defaults tuned for Solana memecoins.
 * Override any of these in `config.json` (git-ignored) or with env vars.
 */
export const DEFAULTS = {
  chain: 'solana',

  /**
   * 'paper' simulates every fill. 'live' signs and sends real transactions —
   * and additionally requires the arm phrase and MEMEBOT_LIVE_ARMED=true, so
   * flipping this alone changes nothing.
   */
  mode: 'paper',

  discovery: {
    /** Pull these DexScreener feeds each cycle. */
    sources: ['token-profiles', 'token-boosts', 'top-boosts'],
    /** Extra search terms fed to DexScreener's pair search. */
    searchTerms: [],
    /**
     * Venues to trade. Defaults to the pump.fun family: the bonding curve
     * itself plus PumpSwap, where those tokens land after graduating.
     * Use ['*'] for every venue, or ['launchpads'] for every launchpad.
     * See src/venues/index.js for the full list.
     */
    venues: ['pumpfun', 'pumpswap'],
    /** Hard cap on tokens enriched per cycle, to stay inside API quotas. */
    maxTokensPerCycle: 60,
  },

  safety: {
    minLiquidityUsd: 15_000,
    minPairAgeMinutes: 10,
    maxPairAgeHours: 96,
    minVolume24hUsd: 25_000,
    /** Top-10 non-pool holders may not exceed this share of supply. */
    maxTop10HolderShare: 0.35,
    /** 24h volume / liquidity above this looks like wash trading. */
    maxVolumeToLiquidity: 60,
    /** Market cap / liquidity above this means a thin float propping a big cap. */
    maxMarketCapToLiquidity: 60,
    /** Solana: reject tokens whose mint authority is still live. */
    requireMintAuthorityRevoked: true,
    /** Solana: reject tokens whose freeze authority is still live. */
    requireFreezeAuthorityRevoked: true,

    /**
     * Per-venue relaxations, merged over the values above.
     *
     * A bonding-curve token minutes after launch has a few thousand dollars on
     * the curve and no trading history. Judged by the AMM thresholds it fails
     * every time — which would make a launchpad-focused bot scan nothing. These
     * are looser on purpose, and the risk is meant to be carried by smaller
     * position sizes rather than by pretending the token is safer than it is.
     */
    venueOverrides: {
      curve: {
        minLiquidityUsd: 4_000,
        minPairAgeMinutes: 2,
        maxPairAgeHours: 72,
        minVolume24hUsd: 3_000,
        maxMarketCapToLiquidity: 120,
        maxVolumeToLiquidity: 150,
      },
    },
  },

  momentum: {
    minBuyRatio5m: 0.5,
    /** 5m volume annualised to an hour vs actual 1h volume; >1 means accelerating. */
    minAcceleration: 0.8,
    minTxns5m: 8,
  },

  narrative: {
    enabled: true,
    model: 'claude-opus-5',
    /** Scoring loop, not deep reasoning — keep the effort (and the bill) down. */
    effort: 'low',
    /** Tokens judged per API call. */
    batchSize: 8,
    /** Only spend tokens on candidates that already cleared the mechanical screen. */
    minCompositeToConsult: 0.45,
  },

  scoring: {
    weights: { safety: 0.4, momentum: 0.35, narrative: 0.25 },
    /** Composite score needed before the bot will open a paper position. */
    entryThreshold: 0.62,
    /** A safety score below this vetoes entry no matter how good the rest looks. */
    safetyVeto: 0.5,
  },

  risk: {
    startingCashUsd: 1_000,
    /** Share of the *starting* bankroll committed per position. */
    positionSizePct: 0.05,
    maxOpenPositions: 8,
    /** Never take more than this share of the pool — memecoin exits are thin. */
    maxPoolSharePct: 0.005,
    stopLossPct: 0.3,
    takeProfitPct: 0.8,
    /** Once up this much, trail the peak by `trailingStopPct`. */
    trailActivatePct: 0.4,
    trailingStopPct: 0.25,
    maxHoldHours: 24,
    /**
     * After closing a position, ignore that token for this long. Without it the
     * next cycle re-buys whatever just stopped out — the entry signal is still
     * there, only cheaper — and the bankroll churns away in fees.
     */
    reentryCooldownHours: 12,
    /** Simulated round-trip cost: slippage + priority fees + LP fee. */
    feePct: 0.015,
  },

  watch: {
    intervalSeconds: 180,
  },

  /**
   * Live execution. Every limit here is enforced by TradeGuard, outside the
   * strategy, and none of it applies in paper mode.
   */
  execution: {
    /** Must equal the exact arm phrase (see execute/guard.js) to allow live trades. */
    armPhrase: '',
    /** Path to a Solana keypair file. SOLANA_PRIVATE_KEY takes precedence. */
    keypairPath: '',

    /** Hard caps. These are the numbers that decide the worst case. */
    maxTradeUsd: 25,
    maxDailySpendUsd: 100,
    maxTradesPerDay: 10,
    minSecondsBetweenTrades: 60,
    /** Never spend below this much SOL — it pays for the transactions that exit. */
    minSolReserve: 0.05,

    /** Entry slippage budget. Bonding-curve tokens move fast; 300bps = 3%. */
    maxSlippageBps: 300,
    /** Exits get a wider budget: being unable to sell is worse than a bad price. */
    exitSlippageBps: 900,
    priorityFeeSol: 0.0001,

    /** Creating this file in the data directory halts live trading immediately. */
    killSwitchFile: 'STOP',

    /** Optional mint filters. An allowlist, if non-empty, is exclusive. */
    allowMints: [],
    denyMints: [],

    jupiterBaseUrl: 'https://lite-api.jup.ag/swap/v1',
    pumpPortalBaseUrl: 'https://pumpportal.fun/api',
    commitment: 'confirmed',
    confirmTimeoutMs: 60_000,
    /** Only used if the SOL price cannot be derived from the pair itself. */
    fallbackSolPriceUsd: 0,
  },

  /**
   * Local API the dashboard reads. No authentication — it exposes portfolio
   * state and can trigger a scan, so keep the host on loopback.
   */
  server: {
    port: 7331,
    host: '127.0.0.1',
  },

  solana: {
    rpcUrl: 'https://api.mainnet-beta.solana.com',
  },

  dataDir: 'data',
};

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Deep merge `override` onto `base`, returning a new object. */
export function merge(base, override) {
  if (!isPlainObject(override)) return override === undefined ? base : override;
  const out = { ...base };
  for (const [key, value] of Object.entries(override)) {
    out[key] = isPlainObject(base?.[key]) ? merge(base[key], value) : value;
  }
  return out;
}

function coerce(raw) {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  const n = Number(raw);
  return Number.isFinite(n) && raw.trim() !== '' ? n : raw;
}

/**
 * Env overrides use the path to the setting, upper-snake-cased:
 *   MEMEBOT_SAFETY_MIN_LIQUIDITY_USD=25000
 *   MEMEBOT_RISK_POSITION_SIZE_PCT=0.02
 */
function envKeyFor(pathParts) {
  const tail = pathParts
    .map((part) => part.replace(/([a-z0-9])([A-Z])/g, '$1_$2'))
    .join('_')
    .toUpperCase();
  return `MEMEBOT_${tail}`;
}

function applyEnv(node, env, pathParts = []) {
  if (!isPlainObject(node)) return node;
  const out = {};
  for (const [key, value] of Object.entries(node)) {
    const nextPath = [...pathParts, key];
    if (isPlainObject(value)) {
      out[key] = applyEnv(value, env, nextPath);
      continue;
    }
    const raw = env[envKeyFor(nextPath)];
    out[key] = raw === undefined ? value : Array.isArray(value) ? raw.split(',').map((s) => s.trim()).filter(Boolean) : coerce(raw);
  }
  return out;
}

/**
 * Precedence, lowest to highest: DEFAULTS, config.json, env vars, `overrides`.
 */
export function loadConfig(overrides = {}, env = process.env) {
  let config = DEFAULTS;

  const configPath = path.join(BOT_ROOT, 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      config = merge(config, JSON.parse(fs.readFileSync(configPath, 'utf8')));
    } catch (error) {
      throw new Error(`config.json is not valid JSON: ${error.message}`);
    }
  }

  config = applyEnv(config, env);

  // A couple of settings have conventional env names of their own.
  if (env.SOLANA_RPC_URL) config = merge(config, { solana: { rpcUrl: env.SOLANA_RPC_URL } });
  if (!env.ANTHROPIC_API_KEY && !env.ANTHROPIC_AUTH_TOKEN) {
    config = merge(config, { narrative: { enabled: false, disabledReason: 'no ANTHROPIC_API_KEY' } });
  }

  config = merge(config, overrides);
  config.dataDirAbsolute = path.isAbsolute(config.dataDir)
    ? config.dataDir
    : path.join(BOT_ROOT, config.dataDir);
  return config;
}
