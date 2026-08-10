/**
 * Pump.fun bonding-curve adapter, via PumpPortal's local-transaction endpoint.
 *
 * Pre-graduation pump.fun tokens have no liquidity pool — they trade against
 * the launchpad's bonding curve program, which an AMM aggregator cannot route.
 * This is the adapter that lets the bot act on a token in its first minutes,
 * which is the whole point of watching a launchpad.
 *
 * We deliberately use the **local** endpoint (`/api/trade-local`): it returns
 * an unsigned transaction that we sign and submit ourselves. The alternative
 * hosted-wallet API would mean handing a third party custody of the keys.
 *
 * ⚠️ PumpPortal is an unaffiliated third-party service. Using it means trusting
 * it to build a correct transaction — inspect what you sign, and validate with
 * a tiny trade first. The wire format below follows their documented API but is
 * NOT exercised against the live endpoint in this repo's test environment.
 */
import { withRetry } from '../util.js';
import { log } from '../log.js';

export const DEFAULT_BASE_URL = 'https://pumpportal.fun/api';

/**
 * Which liquidity source to trade against. `auto` lets PumpPortal pick, which
 * matters because a token can graduate between our scan and our trade.
 */
export const POOLS = { AUTO: 'auto', PUMP: 'pump', PUMP_AMM: 'pump-amm', RAYDIUM: 'raydium' };

async function tradeLocal(body, { baseUrl = DEFAULT_BASE_URL, signal } = {}) {
  return withRetry(
    async () => {
      const response = await fetch(`${baseUrl}/trade-local`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`pumpportal ${response.status}: ${text.slice(0, 300)}`);
      }

      // Success is raw transaction bytes, not JSON.
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length === 0) throw new Error('pumpportal returned an empty transaction');
      return buffer;
    },
    { attempts: 3, baseMs: 300, onRetry: (error, attempt) => log.debug(`pumpportal retry ${attempt}: ${error.message}`) },
  );
}

/**
 * Buy `solAmount` SOL worth of a bonding-curve token.
 *
 * `slippage` is a whole-number percent here, not basis points — PumpPortal's
 * API differs from Jupiter's on this, and mixing them up by a factor of 100 is
 * exactly the kind of mistake that empties a wallet.
 */
export async function buildBuy({
  mint,
  solAmount,
  slippagePercent,
  userPublicKey,
  priorityFeeSol = 0.00005,
  pool = POOLS.AUTO,
  baseUrl,
  signal,
}) {
  const raw = await tradeLocal(
    {
      publicKey: userPublicKey,
      action: 'buy',
      mint,
      amount: Number(solAmount),
      denominatedInSol: 'true',
      slippage: Number(slippagePercent),
      priorityFee: Number(priorityFeeSol),
      pool,
    },
    { baseUrl, signal },
  );

  return {
    adapter: 'pumpportal',
    pool,
    transactionBase64: raw.toString('base64'),
    // The curve gives no quote up front; the fill is read from the confirmed
    // transaction rather than predicted.
    expectedOutRaw: null,
    priceImpact: null,
  };
}

/**
 * Sell a bonding-curve position. `amount` accepts a token count or a percentage
 * string such as `'100%'` — the percentage form avoids having to reason about
 * decimals for a full exit.
 */
export async function buildSell({
  mint,
  amount = '100%',
  slippagePercent,
  userPublicKey,
  priorityFeeSol = 0.00005,
  pool = POOLS.AUTO,
  baseUrl,
  signal,
}) {
  const raw = await tradeLocal(
    {
      publicKey: userPublicKey,
      action: 'sell',
      mint,
      amount,
      denominatedInSol: 'false',
      slippage: Number(slippagePercent),
      priorityFee: Number(priorityFeeSol),
      pool,
    },
    { baseUrl, signal },
  );

  return { adapter: 'pumpportal', pool, transactionBase64: raw.toString('base64') };
}

/** Basis points are the internal unit; PumpPortal wants percent. */
export function bpsToPercent(bps) {
  return Number(bps) / 100;
}
