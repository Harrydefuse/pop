# Art

Everything here drops straight into the game. There are exactly **two sizes** to
hit, and templates for both in `templates/`.

---

## 1. Equipment icons — **32 x 32**

Export at **8x = 256 x 256**. This is what shows in the gear grid, the item
sheet, the reward popup and the big unbox reveal.

There are **six slots**:

| Slot | What goes in it |
| --- | --- |
| `helm` | helmets, hoods, circlets |
| `chest` | breastplates, robes, tunics |
| `legs` | greaves, tassets, trousers |
| `gloves` | gauntlets, bracers |
| `boots` | boots, sabatons |
| `offhand` | **either** a shield **or** a weapon — the player picks |

Rules:

- One item per file, **centred**, filling most of the frame.
- **Transparent background.** Magenta `#ff00ff` is accepted too if your tool
  makes that easier — both are detected and trimmed.
- **Hard edges only.** No anti-aliasing, no soft shadow, no glow, no drop
  shadow. Every blurred edge pixel becomes another colour in the palette and
  the art goes muddy at small sizes. This is the single most important rule.
- Keep it under about 60 distinct colours.

`templates/icon-blank.png` is an empty 256 x 256 canvas.
`templates/icon-example-chest.png` and `icon-example-founder.png` show the
framing and how much of the frame to fill.

---

## 2. Worn on the body — **88 x 118** (male) · **84 x 130** (female)

Export at **4x = 352 x 472** and **336 x 520**. Templates: `worn-chest.png`,
`worn-helm.png` and the rest, written by `tools/sprite-png.mjs` (below).

**This canvas is exactly double the body's.** Worn armour is drawn at twice the
resolution of the character underneath it and rendered back down over him,
which is why a breastplate can carry rivets the body has no room for. Drawing a
piece at the body's own size is the one mistake that cannot be fixed on import
— it lands at half scale on his waist.

- Paint onto the matching `worn-*.png` template, which has the current piece on
  the full canvas so you can see where it sits.
- **Do not move the body.** Head, shoulders, hands and feet stay where they are.
- Show **only the armour** in the final file — everything else transparent or
  magenta.
- Same hard-edges rule.

### Armour is drawn per LOOK, not per set

There are five sets and only four looks. A set is a palette; the drawing comes
from its profile:

| Set | Profile |
| --- | --- |
| Leather | `rough` |
| Iron | `plate` |
| Bone | `spiked` |
| Verdant | `spiked` |
| Astral (gilded) | `regal` |

So a **new set is free** — it is a colour ramp and nothing else. A **new look**
is six pieces (helm, chest, legs, gloves, boots, shield) times two builds, and
is the expensive thing to ask for.

Worn grids are authored in neutral palette slots — `o` outline, `d` dark, `m`
mid, `l` light, `A` trim, `s` strap — which is what lets one drawing come back
as all five sets.

### Weapons are the exception

A held weapon is drawn on the **body** canvas (44 x 59 / 42 x 65), not the
doubled one. There is no good reason for it; it is just how the two grew up. If
you are drawing a sword, use the body size.

This whole section is optional. Send icons alone and the game shows the item
everywhere except on the character; send the worn version too and it appears on
the hero properly.

---

## What to send for one complete piece

```
chest-icon.png        256 x 256    the item on its own
chest-worn.png        256 x 472    the same item on the body   (optional)
```

Name them by slot so it is obvious which is which. Drop them anywhere in `art/`.

---

## 3. The character

### Option A — send an outline (preferred)

Draw the character as **closed line art** and the game will be painted inside
it. The silhouette then comes from your drawing rather than from anything I
invent, and the armour is measured off that same shape, so it lines up.

- **Any grid size.** The tool detects it from the art, so draw at whatever feels
  right — 48 x 64 is a good target but it is not a hard rule.
- **Every shape must be closed.** A one-pixel gap in a line leaks the fill out
  into the background and the region is lost.
- **Draw a line between anything that should be a different colour.** Hair
  against face, arm against torso, leg against leg. Each closed area becomes a
  region I can paint separately — the more the outline separates, the less is
  guesswork.
- **Pure black lines on transparent** (or white). One pixel thick.
- **Hard edges only.** No anti-aliasing — a soft line has no single edge and the
  fill leaks through it.

Transcribe with `python3 tools/outline_fill.py art/your-outline.png`, which
reports every enclosed region and its position.

### Option B — send finished art at the body size

| Build | Canvas | Export at 8x |
| --- | --- | --- |
| Male | **44 x 59** | 352 x 472 |
| Female | **42 x 65** | 336 x 520 |

Templates: `hero.png` and `hero-female.png` from `tools/sprite-png.mjs`.

Send **two files on the identical canvas**:

```
character.png        the character as he should look by default, clothed
character-bare.png   the same character, same pose, clothes removed
```

Both are needed. Armour layers on top of a body, so there has to be a body
underneath — without one, clothes show through at every edge. The game stores
the character as three layers: body, clothes, armour. Clothes are drawn only
where that slot has no armour, so equipping a breastplate stops the tunic being
drawn.

Rules:

- **The two files must line up exactly.** Same pose, same position, same size.
  Draw the clothed one, then remove the clothes — do not redraw.
- Feet on the bottom of the frame, character centred. The spare width either
  side is headroom for pauldrons and weapons.
- Front on, arms down at the sides, feet apart. It is a paper doll, not a pose.
- **Transparent background.** Magenta `#ff00ff` works too.
- **Hard edges only.** No anti-aliasing, no glow, no drop shadow.

**Changing the body size means redrawing every piece of worn armour**, on both
builds and all four looks. The canvases above are the ones the existing gear is
cut to.

### The female build

She has her own art and her own gear. Her body is **42 x 65** and her worn
armour is **84 x 130** — a different canvas from his in both cases, so a piece
drawn for him does not fit her and vice versa. Every look in the game exists on
both.

Hair length is a male-build control and is hidden when FEMALE is picked, so her
hair is baked into her sprite. Hair colour still recolours from the palette, so
draw it in the base brown (`#6d3c1c`) and its shades.

## 4. Bosses — **48 x 48**

Export at **8x = 384 x 384**. Template: `templates/boss-48x48.png`, with the
current Warden centred inside it for scale. `boss-blank.png` is empty.

Square on purpose. Boss grids used to be 20x16, 28x30, 34x42 and 36x39, which
meant a wide boss towered over a tall one at the same setting. Everything now
fits to a square box, so one canvas keeps them consistent.

- Fill most of the frame. A boss is the biggest thing on screen.
- Transparent background, hard edges, same as everything else.

Replacing one is just the file: name it after the boss (`warden.png`,
`grimtusk.png`) and drop it in `art/`.

---

## 5. Pets — **50 x 44**

Export at **8x = 400 x 352**. Templates: `templates/pet-50x44.png` has FROST on
the canvas for scale, `templates/pet-blank.png` is empty.

Wider than tall, because every pet in the game stands side-on: the animal faces
left, on four legs or two, filling the frame. FROST occupies 47 x 43 of the
50 x 44, which is about as full as one should get.

- Transparent background, hard edges, same as everything else.
- **Sit the animal near the bottom of the frame.** The seven shipped pets leave
  between 0 and 3 blank rows under the feet. More than that and the pet floats
  above the character it is standing next to, which reads as a bug.
- Keep it under about 16 distinct colours. FROST uses nine.

### One pet, four forms

A pet has four growth forms and can carry a different drawing at each. Forms
are bought with treats — one per logged session — not reached by levelling:

| Form | Treats to leave it | Drawn at |
| --- | --- | --- |
| HATCHLING | 5 | 0.90x |
| JUVENILE | 15 | 1.05x |
| PRIME | 50 | 1.18x |
| ASCENDED | — | 1.32x, with a living aura behind it |

Seventy treats is a finished pet. FROST, EMBER and ZEUS have all four; the rest
have one drawing used at every form.

The scale ramp applies on top of whatever art the stage has, so the drawings do
not have to carry the size change themselves — draw the *difference*, not the
growth. A pet with no stage art uses its one drawing at every level, which is
what all seven do today.

**Every stage is optional.** A missing one falls back to the nearest stage below
it, ending at the base drawing, so sending a single ASCENDED frost is a complete
change on its own. Name the files by stage:

```
frost-juvenile.png    400 x 352
frost-adult.png       400 x 352
frost-prime.png       400 x 352
frost-ascended.png    400 x 352
```

**Draw every stage on the same 50 x 44 canvas.** The importer trims whitespace,
so five drawings left to size themselves come back as five different grids and
the animal jumps around the frame between stages. `--canvas` below pins them all
to one canvas, and it places them one of two ways:

- **Exported at exactly 400 x 352** — painted over a template, say — and your
  placement is kept **as drawn**, pixel for pixel. This is the one to aim for:
  you decide where the feet land and where the wings reach.
- **Any other size** and the drawing is trimmed, centred across, and stood on
  the floor of the frame. A safe fallback, not a substitute for drawing on the
  canvas.

The importer prints which of the two it did, so you can check.

A later stage may legitimately need more room than 50 x 44 — a pair of wings, a
bigger silhouette. That is allowed: each stage carries its own width and height,
so pass the bigger canvas for that file and keep the feet on the bottom row.

Transcribe each one with:

```
python3 tools/png2grid.py art/frost-ascended.png --canvas 50x44 --name FROST_ASCENDED
```

If the art came out of a tool with anti-aliasing on, add `--sharpen 12`. It
snaps every colour to the twelve most common and drops the half-transparent
rim, so each edge pixel lands on one side of the line instead of blurring
across it. The importer says so itself when the palette blows past its slots,
which is what an anti-aliased export looks like from in here. Hard edges in
the source are still better — this rescues art that already exists.

That writes `art/frost-ascended.grid.js`. Paste the object into
`src/game/sprites.js` and list it on the pet:

```js
export const FROST = {
  id: 'frost', w: 50, h: 44,
  palette: { ... },
  grid: [ ... ],
  // 0 HATCHLING, 1 JUVENILE, 2 ADULT, 3 PRIME, 4 ASCENDED.
  // null means "keep using the stage below".
  stages: [null, FROST_JUVENILE, null, null, FROST_ASCENDED],
}
```

Nothing else changes — every screen that draws a pet goes through the same
lookup.

---

## 6. Chests and interface icons — **32 x 32**

Same size and rules as equipment. Chests show at up to 92px, so 32 x 32 keeps
them at the same pixel density as the rest of the game.

---

## Getting a template

Any canvas in the game can be exported at its true size, with the current art
on it so you can see the scale and where things sit:

```
node tools/sprite-png.mjs --list                 # every name
node tools/sprite-png.mjs worn-chest art/ --scale 4
node tools/sprite-png.mjs hero-female art/
```

Each writes two files: the exact grid at 1x — draw on this one — and a scaled
copy for looking at. What the game holds is what comes out; nothing is
resampled on the way.

The canvases, all of them:

| What | Male | Female |
| --- | --- | --- |
| Body | 44 x 59 | 42 x 65 |
| Armour worn on the body | 88 x 118 | 84 x 130 |
| Weapon held in the hand | 44 x 59 | 42 x 65 |
| Item icon (inventory, shop) | 32 x 32 | same |
| Pet | 50 x 44 | — |
| Boss | 48 x 48 | — |
| Chest, interface icon | 32 x 32 | — |

---

## Importing

One command handles every case:

```
python3 tools/png2grid.py art/your-file.png --canvas WxH --name SPRITE_NAME
```

Useful flags:

- `--block N` — how many image pixels make one sprite pixel. Art out of a
  generator reads as being on a grid but is a pixel out here and there, so
  detection fails and the whole image tries to become the sprite. A 400 x 352
  drawing of a 50 x 44 sprite is `--block 8`.
- `--sharpen N` — snap to N colours, for anything anti-aliased. Near-identical
  shades are merged before counting, so an outline claims one slot rather than
  seven.
- `--sample mean` — average each cell instead of taking its middle pixel, for
  art whose detail is finer than the cell. Better for filigree, worse for
  one-pixel highlights.
- `--preview out.png` — write what actually came out, so a bad transcription is
  something you see now rather than find in the app later.

Hard edges in the source are always better than any of this.

---

## Naming

Every file here is versioned, so nothing ever has to be deleted to avoid
confusion and the newest art is obvious at a glance:

```
<subject>-<slot>-v<n>.png
```

- Pets use the stage as the slot: `drake-s1-v1.png` through `drake-s4-v3.png`.
  `s1`..`s4` are the four forms; `s4` is the final one.
- **`v<n>` counts redraws of that exact slot, and only ever goes up.** A third
  attempt at drake's final form is `drake-s4-v3.png`, sitting next to `v1` and
  `v2` if they are still around. Never re-use a number, never add words like
  `UPDATED`, `new`, `final` or `attempt 2` — the number already says it.
- Everything else follows the same shape: `hero-male-v1.png`,
  `boss-warden-v1.png`, `weapon-sword-common-v1.png`, `map-icon-v1.png`.

When a new version is imported the older ones become dead weight; delete them
once the new art is in the game and looks right. Git keeps the history either
way, so a deleted file is still recoverable from an earlier commit.

`reference/` holds mood boards, screenshots and downloaded inspiration. Nothing
in there feeds the game, so it is left exactly as it arrived.

---

## Facing

**Pets face left.** They are drawn on the right of the character card with the
hero on their left, so a pet facing right has its back to the player. Every
stage of a pet has to face the same way, or it appears to spin round as it
evolves. Mirroring a finished grid horizontally is a safe fix — it is what
`drake-s4-v3.png` needed.

Front-facing pets (KOOKIE) are fine as they are.

---

## Existing files

- **`hero-male-v1.png`** — the current character, fully clothed. Everything was
  reconstructed from this.
- **`templates/pet-50x44.png`** — the pet canvas, with FROST on it for scale.

The older templates in `templates/` (`worn-body.png` at 32 x 59,
`character-48x64.png`) are from a smaller character and no longer match what
the game holds. Use `tools/sprite-png.mjs` instead — it reads the real art, so
it cannot go stale the way a checked-in PNG does.

Every template has a transparent background and contains nothing but the art,
so it can be painted over directly.
