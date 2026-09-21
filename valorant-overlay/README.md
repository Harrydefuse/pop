# VALORANT Rank Overlay

Live rank, RR and session record as an OBS browser source. Updates within a
couple of seconds of a ranked game ending — no manual refresh, no alt-tabbing.

![Overlay preview](docs/preview.png)

## What this is

A small program that runs on your own PC, next to VALORANT. It is not a
website and there is nothing to sign into — no Riot login, no API key, no
account to connect. While VALORANT is running it reads your rank from the Riot
Client that is already signed in on that machine, and serves a small page that
OBS displays.

That page lives at `http://localhost:3040/overlay`. `localhost` means *this
computer*, so the address only works on the PC running the program, and only
while it is running. Nothing is hosted publicly and nothing leaves your machine
except requests to Riot's own servers.

Whichever Riot account is signed into the client is the one shown. To switch
accounts, sign into the other one and the overlay follows.

## Requirements

- Windows, with VALORANT and OBS on the same PC
- Node.js 18 or newer — <https://nodejs.org>, pick the big **LTS** button and
  click through the installer with the defaults

No `npm install` needed. The project has zero dependencies.

## Setup

**1. Get the files onto your PC.** Either download
[the ZIP](https://github.com/Harrydefuse/pop/archive/refs/heads/claude/eloquent-darwin-btgopu.zip)
and extract it somewhere permanent (not your Downloads folder), or clone it:

```bash
git clone -b claude/eloquent-darwin-btgopu https://github.com/Harrydefuse/pop.git
```

The overlay is the `valorant-overlay` folder inside.

**2. Start it.** Double-click **`start.bat`**. A black window opens and stays
open — that is the program running, so leave it be. It will tell you it is
waiting if VALORANT is not open yet.

Prefer a terminal? `node src/index.js` in the same folder does the same thing.

**3. Add it to OBS.**

1. **Sources → + → Browser**, name it `Rank`
2. **URL**: `http://localhost:3040/overlay`
3. **Width** `600`, **Height** `160`
4. Untick *Shutdown source when not visible*
5. **OK**, then drag it where you want it. The background is transparent.

That is the whole setup. From then on: start `start.bat` before you stream,
leave the window open, and the overlay updates itself after every ranked game.

Open <http://localhost:3040/control> in a browser for live status, a button to
reset the session record, and a builder for customised overlay URLs.

### Something wrong? Open the diagnosis page

With the app running, open <http://localhost:3040/debug>. It shows whether the
Riot Client is connected, what rank data Riot returned, and what the overlay
made of it — with a button that copies the whole thing to your clipboard to
paste into a chat or issue. Your player id is removed.

### Something wrong and the app will not start? Run the check

Double-click **`check.bat`**. It reports whether the Riot Client is reachable,
whether it has signed in, and what rank data Riot returns for your account —
enough to tell "still signing in" from "stale lockfile" from "genuinely
unranked". Run it while VALORANT is open, at the play menu.

### Nothing showing up?

Open `http://localhost:3040/overlay` in a normal browser. If the rank appears
there, the program is fine and it is an OBS issue — right-click the source and
*Refresh*. If it does not, check the black window for a message.

### Positioning it without the game running

Double-click **`start-demo.bat`** (or run `node src/index.js --mock`). It
serves fake data and "finishes" a ranked game every few seconds, so you can
size and position the overlay without queuing for a match.

## How the fast updates work

Polling alone is laggy, so the agent uses two signals:

- **Local presence**, read from the Riot Client every 2 seconds. This is free
  and instant, and tells us when you go `INGAME → MENUS`.
- **Rank data**, polled every 30 seconds normally. When presence reports that a
  match just ended, it switches to every 3 seconds until Riot's match ID
  changes — that change *is* the new result landing.

So the overlay updates a beat after the match ends, without hammering Riot's
API while you sit in the lobby.

Win/loss is confirmed against the match detail rather than inferred from the
sign of the RR change, because at low ranks a loss can still net positive RR.
If the match detail is not available yet, the RR sign is used and corrected a
moment later.

## Customising

Add query parameters to the overlay URL, or use the control page to build one.

| Parameter | Values | Default | What it does |
|---|---|---|---|
| `layout` | `bar`, `stack`, `mini` | `bar` | Horizontal, vertical, or compact |
| `bg` | `card`, `none`, `solid` | `card` | `none` gives text only, no panel |
| `align` | `left`, `right` | `left` | Which edge the overlay grows from |
| `scale` | any number | `1` | `1.5` is 50% larger |
| `show` | `rank`, `record`, `delta`, `form` | all | Comma-separated blocks to display |
| `record` | `session`, `act` | `session` | Session record or whole-act record |
| `form` | `0`–`10` | `5` | How many recent results to show as dots |
| `accent` | `rank` or a hex colour | `rank` | Fixed accent instead of the rank colour |
| `hideOffline` | `0`, `1` | `0` | Hide the overlay entirely when VALORANT is closed |

Example — compact, right-aligned, rank and record only:

```
http://localhost:3040/overlay?layout=mini&align=right&show=rank,record
```

Everything else is plain CSS in `public/overlay.css`; edit it and refresh the
browser source.

### The session record

"Session" means ranked games played since the agent started. It survives a
restart, and resets automatically after 6 hours of downtime, so an overnight
gap starts you fresh. Reset it by hand any time from the control page.

## Rank art

Immortal 1-3 and Radiant art ships in `public/ranks`, so those ranks render
correctly with no download and no internet. Any other tier is fetched from
`valorant-api.com` on first run and cached.

Resolution order for each rank, first hit wins:

1. An image in `public/ranks` named after the tier (`27.png` for Radiant)
2. Riot's art, cached locally from a previous run
3. Riot's art, fetched live
4. Drawn artwork built into the overlay — a readable stand-in, not Riot's art

To swap in different art, drop it in `public/ranks` as the tier number and
restart. Trim transparent padding and centre it on a square canvas first, or
that rank will render at a different size from the others. See
`public/ranks/README.md`.

### Immortal and Radiant

Immortal 1, 2 and 3 each run 0-100 RR, so the progress bar behaves as it does
at any other rank. Radiant RR has no ceiling, so the bar is hidden there and
the raw number is shown. When you hold a leaderboard position, it appears next
to your RR as `#142`.

`--mock` starts at Immortal 2 with 60 RR, so promotions into Immortal 3 and
Radiant show up within a few simulated games.

## Configuration

Copy `config.example.json` to `config.json` to override defaults:

| Key | Default | Notes |
|---|---|---|
| `port` | `3040` | Also settable with the `PORT` environment variable |
| `shard` | auto | Force `na`, `eu`, `ap` or `kr` if detection is wrong |
| `idlePollMs` | `30000` | Rank poll rate when nothing is happening |
| `activePollMs` | `3000` | Poll rate in-game and just after a match |
| `sessionIdleResetMs` | `21600000` | Downtime before the session record resets |
| `mockTier` | `25` | Starting tier for `--mock` (24-27 = Immortal 1 - Radiant) |
| `mockRr` | `60` | Starting RR for `--mock` |

## Troubleshooting

**`'node' is not recognized`** — Node.js is not installed, or the install
finished after you opened the window. Install it from <https://nodejs.org> and
try again; if you just installed it, close the window and reopen it first.

**The black window flashes and closes** — that is an error you are not seeing.
Open the folder in a terminal and run `node src/index.js` instead, so the
message stays on screen.

**"VALORANT is not running"** — start the game. The agent picks it up within a
few seconds; you do not need to restart it.

**Connected, but it says Unranked** — run `check.bat`, which prints every act
Riot has on record for you and what your last ranked match says. The black
window also prints the rank it read after it connects. If that line says no ranked rating was found, you have
not finished placements this act. If it names your real rank but OBS does not
show it, the problem is the browser source, not the data.

**Rank is right but RR looks stale** — RR lands when Riot processes the match,
which is occasionally a few seconds behind the end-of-game screen. The agent
keeps polling for three minutes after a match.

**Wrong region or 400 errors** — set `shard` in `config.json`.

**Port 3040 is in use** — set `port` in `config.json`, and update the OBS URL.

**Drawn rank art instead of the real icons** — only affects ranks below
Immortal, which are downloaded rather than bundled. The agent could not reach
`valorant-api.com`; it retries on a later run, or drop the art into
`public/ranks` yourself. See [Rank art](#rank-art).

## How it gets the data

Riot's public API does not expose your own rank without an approved production
key. Instead, the agent uses the local Riot Client API: while VALORANT runs, the
client serves an authenticated HTTPS endpoint on `127.0.0.1`, with credentials
in a lockfile on disk. The agent reads that lockfile, obtains your session
tokens, and queries Riot's player-data endpoints for tier, RR and match history.

This is read-only — nothing is injected into the game and nothing is automated.
It is how rank trackers have worked for years, but the local API is
undocumented and unsupported by Riot, so it can change without warning.

Nothing leaves your machine except requests to Riot's own servers and
`valorant-api.com` for rank art. The server binds to `127.0.0.1`, so the
overlay is not reachable from your network.

## Layout

```
start.bat           double-click to run
start-demo.bat      double-click to run on fake data
check.bat           double-click to diagnose a connection problem
src/
  index.js          entry point: wires the tracker to the server
  config.js         defaults and config.json loading
  http.js           dependency-free request helper
  tracker.js        polling, session record, state shape
  mock.js           fake data source for --mock
  server.js         static files, /events (SSE), /api
  riot/
    localApi.js     lockfile, tokens, presence
    pd.js           rank, competitive updates, match outcomes
    tiers.js        tier names, colours, rank art
public/
  overlay.html/css/js   the overlay itself
  control.html          status, session reset, URL builder
  ranks/                drop your own rank art here to override Riot's
```
