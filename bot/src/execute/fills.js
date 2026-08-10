/**
 * Reading what actually happened on chain.
 *
 * A quote is a prediction; a confirmed transaction is a fact. After a swap
 * lands we read the balance deltas out of the transaction meta and record
 * those, so the portfolio reflects the real fill — including the slippage and
 * fees we actually paid, not the ones we hoped for.
 */
import { num } from '../util.js';

const LAMPORTS_PER_SOL = 1_000_000_000;

/** Net SOL change for `owner`, in SOL, fees included. */
export function solDelta(transaction, owner) {
  const keys =
    transaction?.transaction?.message?.staticAccountKeys?.map((key) => key.toBase58?.() ?? String(key)) ??
    transaction?.transaction?.message?.accountKeys?.map((key) => key.toBase58?.() ?? String(key)) ??
    [];
  const index = keys.indexOf(owner);
  if (index < 0) return null;

  const pre = transaction.meta?.preBalances?.[index];
  const post = transaction.meta?.postBalances?.[index];
  if (pre === undefined || post === undefined) return null;
  return (post - pre) / LAMPORTS_PER_SOL;
}

/** Net change in `mint` held by `owner`, in UI units. */
export function tokenDelta(transaction, owner, mint) {
  const pick = (entries) =>
    (entries ?? []).find((entry) => entry.owner === owner && entry.mint === mint)?.uiTokenAmount;

  const pre = pick(transaction.meta?.preTokenBalances);
  const post = pick(transaction.meta?.postTokenBalances);

  const before = num(pre?.uiAmount, 0);
  const after = num(post?.uiAmount, 0);
  if (pre === undefined && post === undefined) return null;

  return {
    delta: after - before,
    decimals: num(post?.decimals ?? pre?.decimals, 0),
  };
}

/**
 * Turn a confirmed buy into the numbers the portfolio needs.
 * Returns null when the transaction meta is missing or unreadable, so the
 * caller can fall back to the quoted figures rather than record a bogus fill.
 */
export function readBuyFill(transaction, { owner, mint, solPriceUsd }) {
  if (!transaction?.meta || transaction.meta.err) return null;

  const token = tokenDelta(transaction, owner, mint);
  const sol = solDelta(transaction, owner);
  if (!token || token.delta <= 0 || sol === null) return null;

  const solSpent = Math.abs(sol);
  const feeSol = num(transaction.meta.fee) / LAMPORTS_PER_SOL;

  return {
    quantity: token.delta,
    decimals: token.decimals,
    solSpent,
    costUsd: solSpent * num(solPriceUsd),
    feeSol,
    // The only entry price that matters: what we paid, per token, after
    // slippage and fees.
    fillPriceUsd: (solSpent * num(solPriceUsd)) / token.delta,
  };
}

/** The same, for an exit. */
export function readSellFill(transaction, { owner, mint, solPriceUsd }) {
  if (!transaction?.meta || transaction.meta.err) return null;

  const token = tokenDelta(transaction, owner, mint);
  const sol = solDelta(transaction, owner);
  if (!token || token.delta >= 0 || sol === null) return null;

  const sold = Math.abs(token.delta);
  const solReceived = sol; // already net of fees
  return {
    quantity: sold,
    solReceived,
    proceedsUsd: solReceived * num(solPriceUsd),
    feeSol: num(transaction.meta.fee) / LAMPORTS_PER_SOL,
    fillPriceUsd: (solReceived * num(solPriceUsd)) / sold,
  };
}

/**
 * SOL/USD implied by a pair we already fetched. DexScreener gives both the USD
 * price and the price in the quote token, so for a SOL-quoted pair the rate
 * falls out of the two — no extra request, no extra failure mode.
 */
export function solPriceFromPair(token) {
  const quote = String(token?.quoteSymbol ?? '').toUpperCase();
  if (quote !== 'SOL' && quote !== 'WSOL') return null;
  const priceUsd = num(token.priceUsd);
  const priceNative = num(token.priceNative);
  if (!(priceUsd > 0) || !(priceNative > 0)) return null;
  return priceUsd / priceNative;
}
