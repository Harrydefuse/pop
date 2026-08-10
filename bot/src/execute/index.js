/**
 * Order execution.
 *
 * Two implementations behind one interface, so the strategy code cannot tell
 * the difference and there is exactly one place where "simulated" becomes
 * "real": which executor `createExecutor` hands back.
 *
 *   PaperExecutor — models the fill. No keys, no network, no risk.
 *   LiveExecutor  — guard → build → sign → send → confirm → read the fill.
 *
 * The guard runs before a transaction is even built, and the spend ledger is
 * only credited after a transaction confirms.
 */
import { venueFor } from '../venues/index.js';
import { log } from '../log.js';
import { num, sleep } from '../util.js';
import { GuardError, TradeGuard } from './guard.js';
import { readBuyFill, readSellFill, solPriceFromPair } from './fills.js';
import * as jupiter from './jupiter.js';
import * as pumpportal from './pumpportal.js';
import { createConnection, loadWallet, solBalance } from './wallet.js';

export { GuardError, TradeGuard } from './guard.js';

class PaperExecutor {
  mode = 'paper';

  constructor(portfolio) {
    this.portfolio = portfolio;
  }

  async buy(token, { sizeUsd, score, reason }) {
    const position = this.portfolio.open(token, { sizeUsd, score, reason });
    return position ? { ok: true, position } : { ok: false, reason: 'could-not-size' };
  }

  async sell(position, { priceUsd, liquidityUsd, reason }) {
    const trade = this.portfolio.close(position.address, { priceUsd, liquidityUsd, reason });
    return trade ? { ok: true, trade } : { ok: false, reason: 'no-position' };
  }

  async status() {
    return { mode: this.mode, armed: false, wallet: null };
  }
}

/**
 * Submit a signed transaction and wait for it to land.
 *
 * Polls the signature status rather than using `confirmTransaction`, because we
 * want a hard deadline: a transaction stuck in the mempool must surface as a
 * timeout we can act on, not an await that never returns.
 */
export async function sendAndConfirm(connection, signedBase64, { timeoutMs = 60_000, commitment = 'confirmed', pollMs = 1500 } = {}) {
  const raw = Buffer.from(signedBase64, 'base64');
  const signature = await connection.sendRawTransaction(raw, { skipPreflight: false, maxRetries: 3 });

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { value } = await connection.getSignatureStatuses([signature]);
    const status = value?.[0];
    if (status?.err) throw new Error(`transaction ${signature} failed on chain: ${JSON.stringify(status.err)}`);
    if (status?.confirmationStatus === commitment || status?.confirmationStatus === 'finalized') {
      return signature;
    }
    await sleep(pollMs);
  }

  // The transaction may still land after this. Surfacing the signature lets the
  // operator check rather than guess.
  throw new Error(`timed out waiting for ${signature} to confirm — check the explorer before retrying`);
}

class LiveExecutor {
  mode = 'live';

  constructor(config, { portfolio, wallet, connection, guard, adapters, env = process.env }) {
    this.config = config;
    this.portfolio = portfolio;
    this.wallet = wallet;
    this.connection = connection;
    this.guard = guard;
    this.adapters = adapters ?? { jupiter, pumpportal };
    // Captured at construction: arming was decided when this executor was
    // built, and re-reading ambient env per order would let an unrelated
    // process change trading behaviour mid-run. The guard still re-checks the
    // kill switch on every order, which is the part that must stay live.
    this.env = env;
  }

  #limits() {
    return this.config.execution;
  }

  /** Pick the adapter that can actually fill this venue. */
  #adapterFor(token) {
    const venue = venueFor(token.dexId);
    return { venue, adapter: venue.adapter };
  }

  async buy(token, { sizeUsd, score, reason, signal }) {
    const limits = this.#limits();
    const { venue, adapter } = this.#adapterFor(token);

    const solPriceUsd = solPriceFromPair(token) ?? num(limits.fallbackSolPriceUsd);
    if (!(solPriceUsd > 0)) return { ok: false, reason: 'no-sol-price' };

    let balance;
    try {
      balance = await solBalance(this.connection, this.wallet.publicKey);
    } catch (error) {
      return { ok: false, reason: 'rpc-unavailable', detail: error.message };
    }

    try {
      this.guard.check(
        {
          sizeUsd,
          mint: token.address,
          symbol: token.symbol,
          solBalance: balance,
          openPositions: this.portfolio.openPositions.length,
        },
        this.env,
      );
    } catch (error) {
      if (error instanceof GuardError) return { ok: false, reason: error.message, detail: error.detail };
      throw error;
    }

    const solAmount = sizeUsd / solPriceUsd;
    // Never let a rounding or price error spend more SOL than the reserve allows.
    if (balance - solAmount < num(limits.minSolReserve)) {
      return { ok: false, reason: 'sol-reserve-breached', detail: { balance, solAmount } };
    }

    let built;
    try {
      built =
        adapter === 'pumpportal'
          ? await this.adapters.pumpportal.buildBuy({
              mint: token.address,
              solAmount,
              slippagePercent: pumpportal.bpsToPercent(limits.maxSlippageBps),
              userPublicKey: this.wallet.address,
              priorityFeeSol: limits.priorityFeeSol,
              baseUrl: limits.pumpPortalBaseUrl,
              signal,
            })
          : await this.adapters.jupiter.buildBuy({
              mint: token.address,
              solAmount,
              slippageBps: limits.maxSlippageBps,
              userPublicKey: this.wallet.address,
              baseUrl: limits.jupiterBaseUrl,
              priorityFeeLamports: Math.floor(num(limits.priorityFeeSol) * 1_000_000_000),
              signal,
            });
    } catch (error) {
      return { ok: false, reason: 'build-failed', detail: error.message };
    }

    // A quote whose own price impact exceeds our slippage budget is a fill we
    // do not want, however good the score was.
    const impactCap = num(limits.maxSlippageBps) / 10_000;
    if (built.priceImpact !== null && built.priceImpact !== undefined && built.priceImpact > impactCap) {
      return { ok: false, reason: 'price-impact-too-high', detail: { impact: built.priceImpact, cap: impactCap } };
    }

    let signature;
    try {
      signature = await sendAndConfirm(this.connection, this.wallet.signBase64(built.transactionBase64), {
        timeoutMs: limits.confirmTimeoutMs,
        commitment: limits.commitment,
      });
    } catch (error) {
      return { ok: false, reason: 'send-failed', detail: error.message };
    }

    const fill = await this.#readFill(signature, token, solPriceUsd, readBuyFill);
    if (!fill) {
      // The transaction landed but we could not parse it. Halting is the only
      // safe response: we may now hold a token the ledger knows nothing about.
      this.guard.engageKillSwitch(`unreadable buy fill ${signature}`);
      return { ok: false, reason: 'unreadable-fill', detail: { signature } };
    }

    const position = this.portfolio.openWithFill(token, {
      quantity: fill.quantity,
      fillPriceUsd: fill.fillPriceUsd,
      costUsd: fill.costUsd,
      decimals: fill.decimals,
      signature,
      venue: venue.id,
      score,
      reason,
    });

    this.guard.recordSpend({ sizeUsd: fill.costUsd, mint: token.address, symbol: token.symbol, signature });
    log.info(`LIVE buy ${token.symbol} via ${venue.label}: ${signature}`);
    return { ok: true, position, signature, fill };
  }

  async sell(position, { priceUsd, reason, signal, token }) {
    if (!position) return { ok: false, reason: 'no-position' };
    const limits = this.#limits();
    const venue = venueFor(position.venue ?? token?.dexId);
    const solPriceUsd = solPriceFromPair(token ?? {}) ?? num(limits.fallbackSolPriceUsd);

    let built;
    try {
      built =
        venue.adapter === 'pumpportal'
          ? await this.adapters.pumpportal.buildSell({
              mint: position.address,
              amount: '100%',
              slippagePercent: pumpportal.bpsToPercent(limits.exitSlippageBps),
              userPublicKey: this.wallet.address,
              priorityFeeSol: limits.priorityFeeSol,
              baseUrl: limits.pumpPortalBaseUrl,
              signal,
            })
          : await this.adapters.jupiter.buildSell({
              mint: position.address,
              rawAmount: Math.floor(position.quantity * 10 ** num(position.decimals, 6)),
              slippageBps: limits.exitSlippageBps,
              userPublicKey: this.wallet.address,
              baseUrl: limits.jupiterBaseUrl,
              priorityFeeLamports: Math.floor(num(limits.priorityFeeSol) * 1_000_000_000),
              signal,
            });
    } catch (error) {
      return { ok: false, reason: 'build-failed', detail: error.message };
    }

    let signature;
    try {
      signature = await sendAndConfirm(this.connection, this.wallet.signBase64(built.transactionBase64), {
        timeoutMs: limits.confirmTimeoutMs,
        commitment: limits.commitment,
      });
    } catch (error) {
      // An exit that will not go through is the worst failure mode there is —
      // make it loud and stop opening anything new.
      this.guard.engageKillSwitch(`exit failed for ${position.symbol}: ${error.message}`);
      return { ok: false, reason: 'send-failed', detail: error.message };
    }

    const fill = await this.#readFill(signature, { address: position.address }, solPriceUsd, readSellFill);
    const trade = this.portfolio.closeWithFill(position.address, {
      quantity: fill?.quantity ?? position.quantity,
      proceedsUsd: fill?.proceedsUsd ?? position.quantity * num(priceUsd),
      exitPriceUsd: fill?.fillPriceUsd ?? num(priceUsd),
      signature,
      reason,
    });

    log.info(`LIVE sell ${position.symbol}: ${signature}`);
    return { ok: true, trade, signature, fill };
  }

  async #readFill(signature, token, solPriceUsd, reader) {
    try {
      const transaction = await this.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed',
      });
      return reader(transaction, { owner: this.wallet.address, mint: token.address, solPriceUsd });
    } catch (error) {
      log.warn(`could not read fill for ${signature}: ${error.message}`);
      return null;
    }
  }

  async status() {
    let balanceSol = null;
    try {
      balanceSol = await solBalance(this.connection, this.wallet.publicKey);
    } catch {
      balanceSol = null;
    }
    return { mode: this.mode, wallet: this.wallet.address, balanceSol, ...this.guard.status() };
  }
}

/**
 * Build the executor for the configured mode.
 *
 * Live mode is refused unless a wallet is loadable and the guard reports armed,
 * and the refusal falls back to paper rather than throwing — a misconfigured
 * bot should keep running harmlessly, not crash or trade unguarded.
 */
export function createExecutor(config, { portfolio, wallet, connection, guard, adapters, env = process.env } = {}) {
  if (config.mode !== 'live') return new PaperExecutor(portfolio);

  const tradeGuard = guard ?? new TradeGuard(config);
  const { armed, reasons } = tradeGuard.armedStatus(env);
  if (!armed) {
    log.warn(`live mode requested but not armed — running as paper. Blocked by: ${reasons.join('; ')}`);
    return new PaperExecutor(portfolio);
  }

  const signer = wallet ?? loadWallet(config, env);
  if (!signer) {
    log.warn('live mode requested but no wallet configured — running as paper');
    return new PaperExecutor(portfolio);
  }

  log.warn(`LIVE TRADING ARMED — wallet ${signer.address}, max ${config.execution.maxTradeUsd} per trade, ${config.execution.maxDailySpendUsd} per day`);
  return new LiveExecutor(config, {
    portfolio,
    wallet: signer,
    connection: connection ?? createConnection(config),
    guard: tradeGuard,
    adapters,
    env,
  });
}

export { PaperExecutor, LiveExecutor };
