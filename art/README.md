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
- **Magenta `#ff00ff` is the background.** Transparent works too.
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

## Character

- **`hero.png`** — the character as drawn, fully clothed. The source everything
  was reconstructed from.
- **`templates/worn-body.png`** — the bare body. Armour is drawn onto this.

The character is stored as three layers: the body, its clothes, and armour.
Clothes are only drawn where that slot has no armour, so equipping a breastplate
stops the tunic being drawn and nothing pokes out underneath.

To replace the body, paint over `templates/worn-body.png` at 256 x 472 and keep
the pose and position identical.
