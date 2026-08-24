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

---

## Existing files

- **`hero.png`** — the current character, fully clothed. Everything was
  reconstructed from this.
- **`templates/worn-body.png`** — the current bare body at 32 x 59.
- **`templates/character-48x64.png`** — the roomier canvas, with the current
  character centred inside it for scale.

Every template has a transparent background and contains nothing but the art,
so it can be painted over directly.
