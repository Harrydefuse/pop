# Drop character art here

Put the PNG in this folder and I will transcribe it into the game's sprite
format exactly — same pixels, same colours, no resampling.

- **`art/hero.png`** — the default player character.

## What the export needs

- **PNG.** 8-bit, RGB or RGBA. Palette PNGs are fine too.
- **Transparent or plain white background.** Either is detected and trimmed.
- **Whole pixels.** Export at 1x, or at any clean integer zoom (4x, 8x, 11x…).
  The native pixel size is detected from the art itself, so an upscaled export
  transcribes back to its true grid.
- **No anti-aliasing, no soft shadows, no drop shadow.** Every blended edge
  pixel becomes its own palette entry, which bloats the sprite and blurs it at
  small sizes. Hard edges only.

## What the size can be

Anything. There is no fixed dimension to hit — the transcriber reads whatever
grid the art is on and the app derives its aspect from the sprite. Practical
notes:

- Keep it **under ~68 distinct colours** (one palette character each).
- Taller than ~64px starts to lose detail where the hero renders small
  (a 28px thumbnail on the TODAY strip).
- If the silhouette moves much from the current one, the five worn-gear
  overlays (head, hands, feet, wrist, charm) need redrawing to match — they
  are painted onto the same frame as the body.

Transcribe with `python3 tools/png2grid.py art/hero.png`.
