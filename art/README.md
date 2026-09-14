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

## 2. Worn on the body — **32 x 59**

Export at **8x = 256 x 472**. This is the same piece drawn **on the character**,
so it lines up when equipped.

- Paint directly onto `templates/worn-body.png`, which is the bare character.
- **Do not move the body.** Head, shoulders, hands and feet must stay exactly
  where they are.
- Show **only the armour** in the final file — delete the body before exporting,
  leaving magenta or transparent everywhere the armour is not.
- Same hard-edges rule.

This one is optional. Send icons alone and the game will still show the item
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

### Option B — send finished art at **48 x 64**

Export at **8x = 384 x 512**. Template: `templates/character-48x64.png`.

Send **two files on this identical canvas**:

```
character.png        the character as he should look by default, clothed
character-bare.png   the same character, same pose, clothes removed
```

Both are needed. Armour is layered on top of a body, so there has to be a body
underneath — without it, clothes show through at every edge. The game stores
the character as three layers: body, clothes, armour. Clothes are drawn only
where that slot has no armour, so equipping a breastplate simply stops the
tunic being drawn.

Rules:

- **The two files must line up exactly.** Same pose, same position, same size.
  Draw the clothed one, then remove the clothes for the second — do not redraw.
- **The body should be about 32 wide and 56-60 tall**, standing on the bottom
  bottom of the frame, with the character centred. The extra width either side
  is deliberate headroom for pauldrons, weapons and capes, which currently get
  clipped.
- Front on, arms down at the sides, feet apart. It is a paper doll, not a pose.
- **Transparent background.** Magenta `#ff00ff` is accepted too if your tool
  makes that easier — both are detected and trimmed.
- **Hard edges only.** No anti-aliasing, no glow, no drop shadow.

The old canvas was 32 x 59 (`templates/worn-body.png`). That still works if you
would rather not change size — say which you are drawing on and worn armour
will be regenerated to match. 48 x 64 is the better canvas if you are starting
fresh.

### The female build

Signing up offers MALE and FEMALE. The male build is the character already in
the game. The female build has no art of its own yet, so she currently borrows
the long-haired male grids — the option is wired all the way through and saved
with the character, but she is not her until these arrive:

```
female.png        her as she should look by default, clothed
female-bare.png   the same pose, clothes removed
```

**Draw her at 32 x 59** — the same canvas as `templates/worn-body.png`, exported
at **8x = 256 x 472**. This matters more than it sounds: every piece of worn
armour in the game is drawn on that exact frame, so at 32 x 59 her gear works
the day she lands. At 48 x 64 every gear overlay has to be redrawn for her.

Everything else is the same as Option B above: identical canvas for both files,
front on, arms down, feet apart, transparent background, hard edges only. Give
her whatever hairstyle she should have — hair length is a male-build control and
is hidden when FEMALE is picked, so her hair is baked into her sprite. Hair
colour still recolours from the palette, so draw her hair in the base brown
(`#6d3c1c`) and its shades.

Once both files are in `art/`, the only code change is one row of the
`HERO_BODIES` table in `src/game/sprites.js`.

---

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

### One pet, five stages

A pet has five growth stages, and it can carry a different drawing at each:

| Stage | Level | Drawn at |
| --- | --- | --- |
| HATCHLING | 1–24 | 0.90x |
| JUVENILE | 25–49 | 1.02x |
| ADULT | 50–74 | 1.10x |
| PRIME | 75–99 | 1.20x |
| ASCENDED | 100 | 1.32x, with an aura behind it |

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

## Importing

One command handles every case:

```
python3 tools/import_art.py art/your-file.png [width] [height] --name SPRITE_NAME
```

It detects whether the source is a clean pixel export or a soft render. Clean
art is transcribed byte-for-byte. A soft render — anti-aliased edges, a glow,
thousands of colours — is quantised and resampled, which is lossy, so hard
edges are always worth it.

---

## Existing files

- **`hero.png`** — the current character, fully clothed. Everything was
  reconstructed from this.
- **`templates/worn-body.png`** — the current bare body at 32 x 59.
- **`templates/character-48x64.png`** — the roomier canvas, with the current
  character centred inside it for scale.
- **`templates/pet-50x44.png`** — the pet canvas, with FROST on it for scale.

Every template has a transparent background and contains nothing but the art,
so it can be painted over directly.
