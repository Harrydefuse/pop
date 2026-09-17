# Game logos

Drop one image per game here, named for the id the app knows it by, then run:

    python3 tools/import_logos.py

That writes `src/game/logoArt.js`, which the app reads. Nothing is fetched at
runtime — the logos are inlined, so a profile looks the same offline.

| File | Game |
| --- | --- |
| `valorant.png` | Valorant |
| `cs.png` | CS2 |
| `apex.png` | Apex Legends |
| `fortnite.png` | Fortnite |
| `cod.png` | Call of Duty |
| `overwatch.png` | Overwatch |
| `rainbow.png` | Rainbow Six |
| `marvelrivals.png` | Marvel Rivals |
| `lol.png` | League of Legends |
| `dota.png` | Dota 2 |
| `rocket.png` | Rocket League |
| `fifa.png` | EA FC / FIFA |
| `nba2k.png` | NBA 2K |
| `minecraft.png` | Minecraft |
| `roblox.png` | Roblox |
| `gta.png` | GTA |
| `fighting.png` | Fighting games |
| `mmo.png` | An MMO / RPG |
| `shooter.png` | Another shooter |
| `other.png` | Something else |

Add them one at a time if you like. Anything missing falls back to the mark the
app already has, so the profile is never half-broken.

## What to supply

- **Square-ish, and as large as you have.** It gets trimmed to the mark and
  scaled to 96 x 96, so 200px or more is plenty and 2000px is not a problem.
- **Transparent background is best.** A white background works — the importer
  detects a uniform border colour and knocks it out.
- **The mark, not the wordmark.** These draw at 34px on the profile, where
  "ROCKET LEAGUE" in text is an illegible smudge but the shield reads fine.
- Padding does not matter. Every logo is trimmed to its own edges and recentred
  so the row lines up.

### Enclosed backgrounds

Some marks have white *inside* them that should also be see-through — the
Overwatch ring is the example. The importer keeps enclosed areas by default,
because most logos need that. Name the ones that do not:

    python3 tools/import_logos.py --clear overwatch,rainbow

Supplying a proper transparent PNG avoids the question entirely.
