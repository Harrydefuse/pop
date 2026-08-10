/**
 * Venue registry.
 *
 * A Solana memecoin lives in one of two worlds, and they trade differently:
 *
 *  - **Bonding curve** (pump.fun and other launchpads). There is no pool and no
 *    counterparty — you trade against a formula held by the launchpad program.
 *    Price is a pure function of how much has been bought. These tokens
 *    "graduate" to an AMM once the curve fills.
 *  - **AMM** (PumpSwap, Raydium, Orca, Meteora). A real liquidity pool with LPs
 *    on the other side, routable by an aggregator.
 *
 * Everything downstream — which safety thresholds apply, which executor can
 * fill an order — keys off this distinction, so it lives in one place.
 *
 * `dexId` values are DexScreener's. Anything not listed resolves to an
 * `unknown` venue, which a configured allowlist will exclude.
 */

export const CURVE = 'curve';
export const AMM = 'amm';

/** @type {Record<string, {label: string, kind: string, adapter: string, graduatesTo?: string, launchpad?: boolean}>} */
export const VENUES = {
  pumpfun: {
    label: 'Pump.fun',
    kind: CURVE,
    adapter: 'pumpportal',
    graduatesTo: 'pumpswap',
    launchpad: true,
  },
  pumpswap: { label: 'PumpSwap', kind: AMM, adapter: 'jupiter', launchpad: true },
  launchlab: {
    label: 'Raydium LaunchLab',
    kind: CURVE,
    adapter: 'jupiter',
    graduatesTo: 'raydium',
    launchpad: true,
  },
  moonshot: { label: 'Moonshot', kind: CURVE, adapter: 'jupiter', graduatesTo: 'raydium', launchpad: true },
  believe: { label: 'Believe', kind: AMM, adapter: 'jupiter', launchpad: true },
  boop: { label: 'Boop', kind: AMM, adapter: 'jupiter', launchpad: true },
  heaven: { label: 'Heaven', kind: AMM, adapter: 'jupiter', launchpad: true },
  raydium: { label: 'Raydium', kind: AMM, adapter: 'jupiter' },
  orca: { label: 'Orca', kind: AMM, adapter: 'jupiter' },
  meteora: { label: 'Meteora', kind: AMM, adapter: 'jupiter' },
  fluxbeam: { label: 'FluxBeam', kind: AMM, adapter: 'jupiter' },
  lifinity: { label: 'Lifinity', kind: AMM, adapter: 'jupiter' },
  phoenix: { label: 'Phoenix', kind: AMM, adapter: 'jupiter' },
};

const UNKNOWN = { label: 'Unknown venue', kind: AMM, adapter: 'jupiter', unknown: true };

/** Resolve a DexScreener `dexId` to its venue descriptor. Never throws. */
export function venueFor(dexId) {
  const id = String(dexId ?? '').toLowerCase();
  const venue = VENUES[id];
  return venue ? { id, ...venue } : { id: id || 'unknown', ...UNKNOWN };
}

export function isLaunchpad(dexId) {
  return Boolean(venueFor(dexId).launchpad);
}

export function isBondingCurve(dexId) {
  return venueFor(dexId).kind === CURVE;
}

/** Human-readable list, for CLI help and config errors. */
export function venueIds() {
  return Object.keys(VENUES);
}

/**
 * Does this token's venue pass the configured allowlist?
 * An empty or absent list means "any venue".
 */
export function venueAllowed(dexId, allowed) {
  if (!Array.isArray(allowed) || allowed.length === 0) return true;
  const venue = venueFor(dexId);
  if (allowed.includes('*')) return true;
  if (allowed.includes('launchpads')) return Boolean(venue.launchpad);
  return allowed.includes(venue.id);
}

/**
 * Safety thresholds for one token, with venue-specific overrides folded in.
 *
 * A fresh bonding-curve token has a few thousand dollars on the curve and is
 * minutes old — judged by the AMM thresholds it would be rejected every time,
 * which would make a launchpad-focused bot scan nothing.
 */
export function safetyFor(dexId, safety) {
  const venue = venueFor(dexId);
  const override = safety.venueOverrides?.[venue.id] ?? (venue.kind === CURVE ? safety.venueOverrides?.curve : null);
  return override ? { ...safety, ...override } : safety;
}
