/**
 * DexScreener client. Free, no API key, chain-agnostic.
 *
 * Published quotas (as of writing): 300 req/min for the /latest/dex and
 * /tokens endpoints, 60 req/min for the profile/boost feeds. Both groups get
 * their own limiter so one can't starve the other.
 */
import { RateLimiter, chunk, num, uniqueBy, withRetry } from '../util.js';
import { log } from '../log.js';

const BASE = 'https://api.dexscreener.com';

const limiters = {
  pairs: new RateLimiter(280),
  feeds: new RateLimiter(55),
};

async function get(pathname, { group = 'pairs', signal } = {}) {
  await limiters[group].take();
  return withRetry(
    async () => {
      const response = await fetch(`${BASE}${pathname}`, {
        headers: { accept: 'application/json' },
        signal,
      });
      if (!response.ok) {
        throw new Error(`DexScreener ${pathname} -> ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    { onRetry: (error, attempt, delay) => log.debug(`retry ${attempt} in ${delay}ms:`, error.message) },
  );
}

/** Newly-created token profiles — the closest thing to a new-listing firehose. */
export async function latestTokenProfiles({ signal } = {}) {
  const data = await get('/token-profiles/latest/v1', { group: 'feeds', signal });
  return Array.isArray(data) ? data : [];
}

/** Tokens whose teams just paid for boosts. Noisy, but it is where volume goes. */
export async function latestBoosts({ signal } = {}) {
  const data = await get('/token-boosts/latest/v1', { group: 'feeds', signal });
  return Array.isArray(data) ? data : [];
}

export async function topBoosts({ signal } = {}) {
  const data = await get('/token-boosts/top/v1', { group: 'feeds', signal });
  return Array.isArray(data) ? data : [];
}

/**
 * Pairs for up to 30 token addresses at a time. Returns a flat array of pairs;
 * a token with pools on several DEXes appears more than once.
 */
export async function pairsForTokens(chainId, addresses, { signal } = {}) {
  const out = [];
  for (const batch of chunk(uniqueBy(addresses, (a) => a), 30)) {
    if (batch.length === 0) continue;
    const data = await get(`/tokens/v1/${encodeURIComponent(chainId)}/${batch.join(',')}`, { signal });
    if (Array.isArray(data)) out.push(...data);
    else if (Array.isArray(data?.pairs)) out.push(...data.pairs);
  }
  return out;
}

/** Free-text pair search. Useful for narrative terms ("cat", "AI", a ticker). */
export async function searchPairs(query, { signal } = {}) {
  const data = await get(`/latest/dex/search?q=${encodeURIComponent(query)}`, { signal });
  return Array.isArray(data?.pairs) ? data.pairs : [];
}

/**
 * A token can have several pools. Trade the deepest one — it sets the price
 * everyone else arbitrages to, and it is the only one you can exit through.
 */
export function pickPrimaryPair(pairs) {
  let best = null;
  for (const pair of pairs) {
    if (!pair) continue;
    if (!best || num(pair.liquidity?.usd) > num(best.liquidity?.usd)) best = pair;
  }
  return best;
}

/** Group a flat pair list into one primary pair per base-token address. */
export function groupByBaseToken(pairs) {
  const byToken = new Map();
  for (const pair of pairs) {
    const address = pair?.baseToken?.address;
    if (!address) continue;
    const existing = byToken.get(address);
    if (!existing || num(pair.liquidity?.usd) > num(existing.liquidity?.usd)) {
      byToken.set(address, pair);
    }
  }
  return byToken;
}

/**
 * Normalise a DexScreener pair into the shape the rest of the bot uses, so
 * nothing downstream has to know about the API's field names.
 */
export function normalizePair(pair, now = Date.now()) {
  const txns = pair.txns ?? {};
  const window = (key) => ({
    buys: num(txns[key]?.buys),
    sells: num(txns[key]?.sells),
    volumeUsd: num(pair.volume?.[key]),
    priceChangePct: num(pair.priceChange?.[key]) / 100,
  });

  const createdAt = num(pair.pairCreatedAt, 0);

  return {
    chainId: pair.chainId,
    dexId: pair.dexId,
    pairAddress: pair.pairAddress,
    url: pair.url,
    address: pair.baseToken?.address,
    name: pair.baseToken?.name ?? '',
    symbol: pair.baseToken?.symbol ?? '',
    quoteSymbol: pair.quoteToken?.symbol ?? '',
    priceUsd: num(pair.priceUsd),
    // Price in the quote token (usually SOL) — lets us derive the SOL/USD rate
    // from data we already fetched, instead of another API call.
    priceNative: num(pair.priceNative),
    liquidityUsd: num(pair.liquidity?.usd),
    liquidityBase: num(pair.liquidity?.base),
    fdv: num(pair.fdv),
    marketCap: num(pair.marketCap, num(pair.fdv)),
    createdAt,
    ageMs: createdAt ? now - createdAt : Number.NaN,
    m5: window('m5'),
    h1: window('h1'),
    h6: window('h6'),
    h24: window('h24'),
    info: {
      description: pair.info?.description ?? '',
      imageUrl: pair.info?.imageUrl ?? '',
      websites: (pair.info?.websites ?? []).map((w) => w?.url).filter(Boolean),
      socials: (pair.info?.socials ?? []).map((s) => ({ type: s?.type, url: s?.url })).filter((s) => s.url),
    },
    boosts: num(pair.boosts?.active),
  };
}

/** Current price for a set of tokens, keyed by address. Used to mark positions. */
export async function pricesForTokens(chainId, addresses, { signal } = {}) {
  const pairs = await pairsForTokens(chainId, addresses, { signal });
  const prices = new Map();
  for (const [address, pair] of groupByBaseToken(pairs)) {
    prices.set(address, {
      priceUsd: num(pair.priceUsd),
      priceNative: num(pair.priceNative),
      liquidityUsd: num(pair.liquidity?.usd),
      pair,
    });
  }
  return prices;
}
