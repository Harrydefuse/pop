/**
 * The subscription, and what it is deliberately not allowed to sell.
 *
 * The Shop screen already carries a promise in plain text: cores are earned by
 * training and nothing else. A subscription that sells coins, loot, XP or a
 * bigger daily chest would break that promise, and it would break the thing
 * that makes the earn model healthy — the reward is for showing up, and if it
 * can be bought then showing up is worth less.
 *
 * So PLUS sells three things that are not power:
 *
 *   * Looks. The whole art pipeline is grids plus a palette map, so a second
 *     palette for every pet and a dye for every armour set costs the game
 *     nothing in balance and is the thing people actually want to show off.
 *   * Memory. The tracker keeps thirteen weeks because that is all the front
 *     page needs; keeping the rest is additive, not a wall built around
 *     something people already had.
 *   * The bill. Somebody has to pay for this, and saying so is a better offer
 *     than pretending a cosmetic is worth a tenner on its own.
 *
 * Nothing free today is moved behind it. Turning an existing design constraint
 * into a paywall — the three pinned efforts, say, which are three because
 * choosing is the point — is the cheap move, and it is how a good app starts
 * feeling like a worse one.
 */

/** What a subscriber gets. Each one is a thing, not a feeling. */
export const PLUS_PERKS = [
  {
    id: 'palettes',
    icon: 'spark',
    name: 'A second palette for every pet',
    note: 'The same creature, recoloured. Your drake, in white and gold.',
  },
  {
    id: 'dyes',
    icon: 'chest',
    name: 'Dye any armour set',
    note: 'Wear the legendary silhouette in whatever colour you want.',
  },
  {
    id: 'history',
    icon: 'timer',
    name: 'Your whole history',
    note: 'Every week you have ever logged, not the last thirteen.',
  },
  {
    id: 'export',
    icon: 'swap',
    name: 'Export everything',
    note: 'One file with every session, split and record in it. It is your data.',
  },
  {
    id: 'mark',
    icon: 'shield',
    name: 'A supporter mark',
    note: 'On your profile card, where people can see it.',
  },
]

/**
 * The line that matters most on the page. Said up front rather than buried,
 * because it is the reason to trust the rest of it.
 */
export const PLUS_PROMISE = 'No coins. No loot. No XP. Nothing that makes training count for more.'

/**
 * Indicative pricing only — nothing here is wired to a payment provider and
 * these numbers are a placeholder for whoever sets them.
 */
export const PLANS = [
  { id: 'monthly', name: 'Monthly', price: '£3.99', per: 'a month', note: 'Cancel whenever.' },
  { id: 'yearly', name: 'Yearly', price: '£29.99', per: 'a year', note: 'Two months off.', best: true },
]
