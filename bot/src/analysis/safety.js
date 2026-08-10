/**
 * Rug/honeypot screen. This runs before anything else and is the only part of
 * the pipeline that can veto a trade outright — most memecoins fail here, and
 * that is the point.
 *
 * These are heuristics over public data, not a contract audit. They catch the
 * common failure shapes (live mint authority, insider-concentrated supply,
 * paper-thin liquidity, wash volume). They cannot catch a novel exploit or a
 * team that simply decides to sell.
 */
import { HOUR, MINUTE, clamp, num, ramp } from '../util.js';

/**
 * @param {object} token   normalised pair from dexscreener.normalizePair
 * @param {object} chainInfo  result of solana.inspectToken (may be unavailable)
 * @param {object} settings   config.safety
 */
export function assessSafety(token, chainInfo, settings) {
  const checks = [];
  const add = (id, label, pass, weight, detail, { fatal = false } = {}) =>
    checks.push({ id, label, pass, weight, detail, fatal });

  // --- Liquidity -----------------------------------------------------------
  const liquidity = num(token.liquidityUsd);
  add(
    'liquidity',
    `Liquidity ≥ $${settings.minLiquidityUsd.toLocaleString()}`,
    liquidity >= settings.minLiquidityUsd,
    2,
    `$${Math.round(liquidity).toLocaleString()}`,
    { fatal: true },
  );

  // --- Age -----------------------------------------------------------------
  const ageMs = token.ageMs;
  const ageKnown = Number.isFinite(ageMs);
  const oldEnough = ageKnown && ageMs >= settings.minPairAgeMinutes * MINUTE;
  const notStale = ageKnown && ageMs <= settings.maxPairAgeHours * HOUR;
  add(
    'age',
    `Pair age ${settings.minPairAgeMinutes}m–${settings.maxPairAgeHours}h`,
    oldEnough && notStale,
    1,
    ageKnown ? `${Math.round(ageMs / MINUTE)}m old` : 'unknown',
  );

  // --- Traded volume -------------------------------------------------------
  const volume24h = num(token.h24.volumeUsd);
  add(
    'volume',
    `24h volume ≥ $${settings.minVolume24hUsd.toLocaleString()}`,
    volume24h >= settings.minVolume24hUsd,
    1.5,
    `$${Math.round(volume24h).toLocaleString()}`,
  );

  // --- Wash-trading proxy --------------------------------------------------
  // Real interest turns the pool over a few times a day. Fifty times a day with
  // a flat price is a bot cycling its own liquidity to look alive.
  const volToLiq = liquidity > 0 ? volume24h / liquidity : Number.POSITIVE_INFINITY;
  add(
    'wash',
    `Volume/liquidity ≤ ${settings.maxVolumeToLiquidity}x`,
    volToLiq <= settings.maxVolumeToLiquidity,
    1,
    Number.isFinite(volToLiq) ? `${volToLiq.toFixed(1)}x` : 'no liquidity',
  );

  // --- Float quality -------------------------------------------------------
  // A $10m cap sitting on $20k of liquidity cannot be exited at anything near
  // the quoted price.
  const marketCap = num(token.marketCap);
  const capToLiq = liquidity > 0 ? marketCap / liquidity : Number.POSITIVE_INFINITY;
  add(
    'float',
    `Market cap/liquidity ≤ ${settings.maxMarketCapToLiquidity}x`,
    capToLiq <= settings.maxMarketCapToLiquidity,
    1.5,
    Number.isFinite(capToLiq) ? `${capToLiq.toFixed(1)}x` : 'no liquidity',
  );

  // --- On-chain authorities ------------------------------------------------
  if (chainInfo?.available) {
    const mintRevoked = chainInfo.mintAuthority === null;
    add(
      'mint-authority',
      'Mint authority revoked',
      mintRevoked,
      3,
      mintRevoked ? 'revoked' : `held by ${chainInfo.mintAuthority}`,
      { fatal: settings.requireMintAuthorityRevoked },
    );

    const freezeRevoked = chainInfo.freezeAuthority === null;
    add(
      'freeze-authority',
      'Freeze authority revoked',
      freezeRevoked,
      3,
      freezeRevoked ? 'revoked' : `held by ${chainInfo.freezeAuthority}`,
      { fatal: settings.requireFreezeAuthorityRevoked },
    );

    const conc = chainInfo.concentration;
    if (conc) {
      add(
        'concentration',
        `Top-${conc.topN} holders ≤ ${Math.round(settings.maxTop10HolderShare * 100)}% of supply`,
        conc.topShare <= settings.maxTop10HolderShare,
        2.5,
        `${(conc.topShare * 100).toFixed(1)}%${conc.poolExcluded ? '' : ' (pool not identified)'}`,
      );
    } else {
      add('concentration', 'Holder concentration', false, 1, 'could not read holders');
    }
  } else {
    // Unknown is not the same as safe: score it as a miss, but do not treat an
    // RPC outage as proof of a rug.
    add(
      'chain-data',
      'On-chain checks available',
      false,
      2,
      chainInfo?.reason ?? 'not checked',
    );
  }

  // --- Presence ------------------------------------------------------------
  const hasSocials = token.info.socials.length > 0 || token.info.websites.length > 0;
  add('presence', 'Has website or socials', hasSocials, 0.5, hasSocials ? 'yes' : 'none listed');

  // --- Two-sided market ----------------------------------------------------
  const h1Trades = token.h1.buys + token.h1.sells;
  const sellsPresent = h1Trades === 0 || token.h1.sells > 0;
  add(
    'sellable',
    'Sells observed in last hour',
    sellsPresent,
    2,
    h1Trades === 0 ? 'no trades' : `${token.h1.sells} sells / ${token.h1.buys} buys`,
    { fatal: h1Trades >= 20 && token.h1.sells === 0 },
  );

  const hardFails = checks.filter((check) => check.fatal && !check.pass);
  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
  const earned = checks.reduce((sum, check) => sum + (check.pass ? check.weight : 0), 0);

  return {
    score: hardFails.length > 0 ? 0 : clamp(totalWeight > 0 ? earned / totalWeight : 0),
    passed: hardFails.length === 0,
    checks,
    hardFails: hardFails.map((check) => `${check.label} (${check.detail})`),
    /** Confidence in the screen itself — low when on-chain data was missing. */
    confidence: chainInfo?.available ? 1 : 0.6,
    liquidityUsd: liquidity,
  };
}

/** Standalone: how tradeable is this position size given the pool depth? */
export function exitability(positionUsd, liquidityUsd) {
  if (!(liquidityUsd > 0)) return 0;
  return clamp(1 - ramp(positionUsd / liquidityUsd, 0.002, 0.05));
}
