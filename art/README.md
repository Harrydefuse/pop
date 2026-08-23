# Character art

## Files

- **`hero.png`** — the character as drawn, fully clothed. The source everything
  else was reconstructed from.
- **`base-template.png`** — the **base body**: the same character with the tunic
  and trousers stripped off. This is what armour is drawn onto.

## Why there is a base body

Armour is layered onto the character, so there has to be a body underneath. If
armour is painted over a clothed sprite, the clothes show through at every edge
— a sleeve poking out from under a pauldron, a hem under a cuirass. So the
character is stored as three things:

1. **the body** (skin, face, hair)
2. **clothes** (tunic, trousers) — drawn only where that slot has no armour
3. **armour** — drawn per slot, over the body

Put a breastplate on and the tunic is simply not drawn. Nothing to poke out.

## Replacing the base body

`base-template.png` is currently derived from `hero.png` automatically, which
means the torso still has the tunic's slightly baggy outline. A hand-drawn body
would be better. To replace it:

- **Match the canvas exactly: 256 x 472**, which is a **32 x 59** grid at 8x
  zoom. Every layer lives on this canvas.
- **Do not move the character.** Head, shoulders, hands and feet must stay
  exactly where they are, or armour drawn for the old body will not line up.
  Easiest way: open `base-template.png` and paint over it.
- Keep the **same pose** — front on, arms down at the sides, feet apart.
- **Magenta `#ff00ff` is the background** in the template. Anything that colour
  is treated as empty. Transparent works too.
- **Hard edges only.** No anti-aliasing, no soft shadow, no glow.

Sizes other than 32 x 59 are possible but not free: every armour piece and the
worn-gear layers are positioned against this exact grid, so changing it means
redrawing all of them. If there is a good reason to change it, say so before
drawing rather than after.

## Adding armour art

Armour does not need to come from you — it is generated in-game from six
silhouettes recoloured per set. If you want to draw a piece by hand it goes on
the same 32 x 59 canvas, aligned to the body, with only that piece visible.
