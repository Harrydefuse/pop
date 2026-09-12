# LVL100

A fitness RPG for gamers. Verified workouts turn into XP, stats, loot, pets and rank — and your
gaming stays in the picture instead of being the thing you feel guilty about.

This repo is a working front-end prototype: every system below is implemented and playable, with
state persisted to `localStorage`. There is no backend yet.

## The pitch

- **Track progress.** Reps, kilometres, sleep and aim time all become stats you can watch climb.
- **Stay motivated.** Friends, leaderboards, and a streak that notices when you go quiet.
- **1% every day.** In the gym and in your queue.
- **Keep the games.** You do not have to quit gaming to get your life on track. The app pushes for a
  healthy balance of the two, not a detox.

## Systems

### Progression

Levels 1–100 on a `120 · level^1.22` curve. Five trainable stats — **STR, END, AGI, VIT, FOCUS** —
each with its own flatter curve so they visibly move week to week. Every logged activity maps onto
one or two stats, which makes the character sheet a direct read-out of how you actually train.

**Power** is the single headline number (stat levels + gear + pet + streak + stones) and everything
competitive reads from it. Ranks run Bronze → LVL100 off weekly Power, so a returning player climbs
back without regrinding a hundred levels.

### Anti-cheat

Only activities that arrive through a connected health provider (Apple Health, Health Connect,
Strava, Garmin, WHOOP) count at full value and are eligible for ranked boards or the world raid.
Manual entries still build your character at 50% XP — they just never climb. The logging sheet says
this out loud at the point of entry rather than burying it in a settings page.

### Delayed gratification

The **sealed chest** is the core loop. Clearing all three dailies seals a chest one more day, up to
seven. Each day raises the tier — Bronze (40 cores, 1 roll) through Mythic Vault (900 cores, 4
rolls, epic floor). You can open it whenever you like; opening early never wastes anything, it just
forfeits the tiers above. Drop rates are fixed and published (60/25/10/4/1), and sealing raises the
*floor* rarity rather than the odds — patience, not luck.

The **six stones** are the long game: 100,000 kg lifted, 1,000 km covered, 300 verified sessions,
100 friend challenges, a 365-day streak, 200 balanced days. Months, not days. Nothing purchasable.

### Character

- **Classes** — the game you main crossed with the training you do (Duelist, Juggernaut, Ranger,
  Arcanist, Vanguard). The passive is deliberately small so no class is a wrong pick.
- **Pets** — five companions across the rarity ladder. They take 40% of your session XP, can never
  out-level you, and physically grow through five evolution stages at levels 1/25/50/75/100.
- **Equipment** — five slots, five rarities, upgradeable with cores. Rarity multiplies everything,
  so a legendary at level 1 already beats a common at level 5.
- **Achievements** — events, races, PBs.

### Social & events

- Friends and global leaderboards, online-now strip, weekly/monthly/duo challenges.
- **World raid** — one app-wide boss with a shared health bar measured in community kilometres, live
  contribution tracking, personal reward tiers and season-limited community unlocks.
- **Guild** — Discord-style channels (`#general`, `#gym-help`, `#aim-lab`, `#pb-flex`, `#lfg`) where
  stronger players share routines, programmes and aim drills. Verified PBs get a badge.
- **Coaching** — flat $5, lifetime access. Fitness coaches and game coaches sit in the same list on
  purpose: both are trainable skills.

### AXIS

The in-app coach. It is a rules engine over your own save file rather than a chat model — every
answer traces back to a number on your character sheet, which is what makes it advice rather than
generic fitness copy.

## Stack

- [Vite](https://vite.dev/) + [React](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- Hand-authored pixel art: sprites are character grids plus a palette map, rendered to SVG rects
  with run-length merging per row (`src/game/sprites.js`, `src/components/PixelSprite.jsx`)

## Layout

```
src/game/       config (all balance tuning), data (seed content), engine (pure logic),
                store (reducer + persistence), sprites, icons
src/components/ UI kit, sprite renderers, shell chrome, AXIS, onboarding
src/screens/    Home, Train, Arena, Guild, Hero
```

Game logic lives in `engine.js` as pure functions — no React, no storage — so balance is testable in
isolation. `config.js` holds every tunable number.

## Development

```bash
npm install
npm run dev      # start dev server
npm run build    # production build
npm run preview  # preview the production build
npm run lint     # oxlint
```

All motion respects `prefers-reduced-motion`.
