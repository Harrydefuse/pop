/**
 * Jupiter swap adapter — the AMM half of execution.
 *
 * Covers anything with a real pool: PumpSwap (where pump.fun tokens land after
 * graduation), Raydium, Orca, Meteora. Jupiter routes across all of them, so
 * one adapter serves every AMM venue.
 *
 * Flow: quote → swap transaction (base64, unsigned) → we sign locally → we
 * send. The private key never leaves this process.
 *
 * ⚠️ The request/response shapes below follow Jupiter's documented swap API but
 * have NOT been exercised against the live endpoint in this repo's test
 * environment. Validate with a tiny trade before trusting real size.
 */
import { withRetry } from '../util.js';
import { log } from '../log.js';

export const WSOL_MINT = 'So11111111111111111111111111111111111111112';
const LAMPORTS_PER_SOL = 1_000_000_000;

async function callJupiter(url, { method = 'GET', body, signal } = {}) {
  return withRetry(
    async () => {
      const response = await fetch(url, {
        method,
        headers: body ? { 'content-type': 'application/json', accept: 'application/json' } : { accept: 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal,
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`jupiter ${method} ${new URL(url).pathname} -> ${response.status}: ${text.slice(0, 300)}`);
      }
      try {
        return JSON.parse(text);
      } catch {
        throw new Error(`jupiter returned non-JSON: ${text.slice(0, 200)}`);
      }
    },
    { attempts: 3, baseMs: 300, onRetry: (error, attempt) => log.debug(`jupiter retry ${attempt}: ${error.message}`) },
  );
}

/**
 * Price a swap. `amount` is in the input mint's smallest unit (lamports for
 * SOL). Returns Jupiter's quote object unchanged — the swap call needs it
 * verbatim, so do not reshape it.
 */
export async function quote({ inputMint, outputMint, amount, slippageBps, baseUrl, signal }) {
  const url = new URL(`${baseUrl}/quote`);
  url.searchParams.set('inputMint', inputMint);
  url.searchParams.set('outputMint', outputMint);
  url.searchParams.set('amount', String(Math.floor(amount)));
  url.searchParams.set('slippageBps', String(slippageBps));
  // Direct routes fill more reliably on thin memecoin pools than multi-hop ones.
  url.searchParams.set('restrictIntermediateTokens', 'true');

  const result = await callJupiter(url.toString(), { signal });
  if (!result?.outAmount) throw new Error(`no route for ${outputMint}`);
  return result;
}

/** Turn a quote into an unsigned, base64-encoded transaction. */
export async function swapTransaction({ quoteResponse, userPublicKey, baseUrl, priorityFeeLamports, signal }) {
  const result = await callJupiter(`${baseUrl}/swap`, {
    method: 'POST',
    signal,
    body: {
      quoteResponse,
      userPublicKey,
      // Memecoin pools are SOL-quoted; let Jupiter handle the wrap/unwrap.
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: priorityFeeLamports
        ? { priorityLevelWithMaxLamports: { maxLamports: priorityFeeLamports, priorityLevel: 'high' } }
        : 'auto',
    },
  });
  if (!result?.swapTransaction) throw new Error('jupiter returned no swapTransaction');
  return result.swapTransaction;
}

/** Slippage actually implied by a quote, as a fraction. Used for sanity checks. */
export function quotedPriceImpact(quoteResponse) {
  return Math.abs(Number(quoteResponse?.priceImpactPct ?? 0));
}

export function solToLamports(sol) {
  return Math.floor(Number(sol) * LAMPORTS_PER_SOL);
}

export function lamportsToSol(lamports) {
  return Number(lamports) / LAMPORTS_PER_SOL;
}

/**
 * Build a buy: spend `solAmount` SOL on `mint`.
 * Returns the unsigned transaction plus the numbers the caller needs to decide
 * whether to sign it.
 */
export async function buildBuy({ mint, solAmount, slippageBps, userPublicKey, baseUrl, priorityFeeLamports, signal }) {
  const quoteResponse = await quote({
    inputMint: WSOL_MINT,
    outputMint: mint,
    amount: solToLamports(solAmount),
    slippageBps,
    baseUrl,
    signal,
  });

  return {
    adapter: 'jupiter',
    quoteResponse,
    priceImpact: quotedPriceImpact(quoteResponse),
    expectedOutRaw: quoteResponse.outAmount,
    transactionBase64: await swapTransaction({
      quoteResponse,
      userPublicKey,
      baseUrl,
      priorityFeeLamports,
      signal,
    }),
  };
}

/** Build a sell: swap `rawAmount` of `mint` back to SOL. */
export async function buildSell({ mint, rawAmount, slippageBps, userPublicKey, baseUrl, priorityFeeLamports, signal }) {
  const quoteResponse = await quote({
    inputMint: mint,
    outputMint: WSOL_MINT,
    amount: rawAmount,
    slippageBps,
    baseUrl,
    signal,
  });

  return {
    adapter: 'jupiter',
    quoteResponse,
    priceImpact: quotedPriceImpact(quoteResponse),
    expectedOutSol: lamportsToSol(quoteResponse.outAmount),
    transactionBase64: await swapTransaction({
      quoteResponse,
      userPublicKey,
      baseUrl,
      priorityFeeLamports,
      signal,
    }),
  };
}
