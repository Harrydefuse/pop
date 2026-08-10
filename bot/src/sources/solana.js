/**
 * Minimal Solana JSON-RPC client — just enough to answer the two questions
 * that separate a rug from a token: who can still mint or freeze it, and how
 * concentrated the holders are.
 *
 * The public mainnet endpoint is heavily rate-limited. Point SOLANA_RPC_URL at
 * a paid provider (Helius, QuickNode, Triton) before running `watch` for real.
 */
import { RateLimiter, num, withRetry } from '../util.js';
import { log } from '../log.js';

const limiter = new RateLimiter(90);
let requestId = 0;

async function rpc(url, method, params, { signal } = {}) {
  await limiter.take();
  return withRetry(
    async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: (requestId += 1), method, params }),
        signal,
      });
      if (!response.ok) throw new Error(`RPC ${method} -> ${response.status} ${response.statusText}`);
      const body = await response.json();
      if (body.error) throw new Error(`RPC ${method} -> ${body.error.message ?? JSON.stringify(body.error)}`);
      return body.result;
    },
    { attempts: 3, onRetry: (error, attempt) => log.debug(`rpc retry ${attempt}:`, error.message) },
  );
}

/**
 * Mint authority, freeze authority, supply and decimals for an SPL mint.
 * Returns `null` when the account can't be read or parsed, so callers can
 * distinguish "unknown" from "authority present".
 */
export async function getMintInfo(rpcUrl, mint, { signal } = {}) {
  const result = await rpc(rpcUrl, 'getAccountInfo', [mint, { encoding: 'jsonParsed' }], { signal });
  const info = result?.value?.data?.parsed?.info;
  if (!info) return null;
  return {
    mintAuthority: info.mintAuthority ?? null,
    freezeAuthority: info.freezeAuthority ?? null,
    decimals: num(info.decimals),
    supply: num(info.supply) / 10 ** num(info.decimals),
    isInitialized: info.isInitialized !== false,
  };
}

/** Top 20 token accounts by balance, largest first. */
export async function getLargestHolders(rpcUrl, mint, { signal } = {}) {
  const result = await rpc(rpcUrl, 'getTokenLargestAccounts', [mint], { signal });
  const accounts = result?.value ?? [];
  return accounts
    .map((account) => ({ address: account.address, amount: num(account.uiAmount) }))
    .filter((account) => account.amount > 0);
}

/**
 * Share of supply held by the largest wallets, excluding the AMM pool.
 *
 * The pool vault is legitimately one of the biggest holders, so counting it
 * would flag every healthy token. We can't read the vault's address from
 * DexScreener, but we do get the pool's base-token balance — so we drop the
 * holder whose balance matches it (within 5%) and measure the rest against
 * circulating supply.
 */
export function holderConcentration({ holders, supply, poolBaseAmount, topN = 10 }) {
  if (!Array.isArray(holders) || holders.length === 0 || !(supply > 0)) return null;

  const nonPool = [];
  let poolExcluded = false;
  for (const holder of holders) {
    const looksLikePool =
      !poolExcluded &&
      poolBaseAmount > 0 &&
      Math.abs(holder.amount - poolBaseAmount) / poolBaseAmount < 0.05;
    if (looksLikePool) {
      poolExcluded = true;
      continue;
    }
    nonPool.push(holder);
  }

  const circulating = Math.max(supply - (poolExcluded ? poolBaseAmount : 0), 1e-9);
  const top = nonPool.slice(0, topN);
  const held = top.reduce((sum, holder) => sum + holder.amount, 0);

  return {
    topN,
    poolExcluded,
    largestShare: nonPool.length ? nonPool[0].amount / circulating : 0,
    topShare: held / circulating,
    sampledHolders: nonPool.length,
  };
}

/**
 * Everything the safety screen needs about a Solana token, or `{ available:
 * false }` when the RPC can't answer. An unreachable RPC must never read as a
 * clean bill of health.
 */
export async function inspectToken(rpcUrl, { mint, poolBaseAmount = 0, signal } = {}) {
  try {
    const [mintInfo, holders] = await Promise.all([
      getMintInfo(rpcUrl, mint, { signal }),
      getLargestHolders(rpcUrl, mint, { signal }).catch(() => []),
    ]);
    if (!mintInfo) return { available: false, reason: 'mint account not parseable' };
    return {
      available: true,
      ...mintInfo,
      concentration: holderConcentration({
        holders,
        supply: mintInfo.supply,
        poolBaseAmount,
      }),
    };
  } catch (error) {
    log.debug(`solana inspect failed for ${mint}:`, error.message);
    return { available: false, reason: error.message };
  }
}
