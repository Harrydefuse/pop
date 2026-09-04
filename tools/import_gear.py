"""Transcribe the weapon and armour art in art/ into the game's icon format.

Every piece is drawn on a 2048px canvas at 64 device pixels per art pixel, so
the native grid is exactly 32 x 32 — which is the icon size the game already
uses. No resampling guesswork: each cell takes the dominant colour inside it,
mode rather than mean, so the edges stay hard.

Colours are mapped onto the ARMOUR_PALETTES keys by brightness rather than kept
as literal hex. The art is one common-tier set; binding it to the ramp is what
lets the same drawing come back as leather, iron, bone, verdant and gilded
instead of needing five drawings of every piece.
"""
import sys, pathlib
from collections import Counter

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import png

ART = pathlib.Path(__file__).resolve().parents[1] / 'art'
G = 32

# Slot or weapon kind -> the file it comes from.
PIECES = {
    'helm': 'kit/helmet_common.png',
    'chest': 'kit/chestplate_common.png',
    'legs': 'kit/leggings_common.png',
    'gloves': 'kit/gloves_common.png',
    'boots': 'kit/boots_common.png',
    'shield': 'kit/shield_common.png',
    'sword': 'sword_1_common.png',
    'axe': 'axe_1_common.png',
    'bow': 'bow_1_common.png',
    'dagger': 'dagger_1_common.png',
    'spear': 'spear_1_common.png',
    'staff': 'staff_1_common.png',
}

# Darkest to lightest. 'o' is the outline, 's' the cast shadow, then the metal
# ramp, and 'A' the highlight the rarity colours pick out.
RAMP = ['o', 's', 'd', 'm', 'l', 'A']


def is_bg(p):
    r, g, b = p[0], p[1], p[2]
    if len(p) > 3 and p[3] < 40:
        return True
    return min(r, g, b) > 232 and max(r, g, b) - min(r, g, b) < 16


def lum(c):
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def read(path):
    w, h, px = png.read(str(path))
    ys = [y for y in range(h) if any(not is_bg(p) for p in px[y])]
    xs = [x for x in range(w) if any(not is_bg(px[y][x]) for y in range(h))]
    if not ys:
        raise SystemExit(f'{path}: nothing but background')
    # Sample on the source's own grid, not on the ink box — the art is centred
    # on a square canvas at an exact multiple, and trimming first would shear it.
    cells = []
    for cy in range(G):
        row = []
        for cx in range(G):
            tally, ink = Counter(), 0
            for yy in range(cy * h // G, (cy + 1) * h // G):
                for xx in range(cx * w // G, (cx + 1) * w // G):
                    p = px[yy][xx]
                    if is_bg(p):
                        continue
                    tally[tuple(p[:3])] += 1
                    ink += 1
            area = max(1, (h // G) * (w // G))
            # Plain mode loses anything thinner than half a cell — a bowstring,
            # a spear shaft — because the background around it outvotes it. Any
            # cell with a real amount of ink in it keeps the ink.
            row.append(tally.most_common(1)[0][0] if ink / area >= 0.22 else None)
        cells.append(row)
    return cells


def to_ramp(cells):
    """Bucket every colour in the piece into the six palette slots by brightness,
    so a rarity recolour lands on the shading the artist drew."""
    seen = Counter(c for row in cells for c in row if c)
    if not seen:
        raise SystemExit('empty piece')
    order = sorted(seen, key=lum)
    # Split by weight, not by count, so a colour used once does not claim a
    # whole band of the ramp.
    total = sum(seen[c] for c in order)
    key, running, band = {}, 0, 0
    for c in order:
        key[c] = RAMP[min(band, len(RAMP) - 1)]
        running += seen[c]
        while band < len(RAMP) - 1 and running > total * (band + 1) / len(RAMP):
            band += 1
    return [''.join(key[c] if c else '.' for c in row) for row in cells]


def js(name, rows):
    body = ',\n'.join(f"    '{r}'" for r in rows)
    return f'  {name}: [\n{body},\n  ],\n'


if __name__ == '__main__':
    out = ['// Weapons and armour, transcribed from art/ by tools/import_gear.py.',
           '// 32 x 32 each, on the shared ARMOUR_PALETTES ramp so one drawing serves',
           '// every rarity.',
           'export const GEAR_ART = {']
    for kind, rel in PIECES.items():
        rows = to_ramp(read(ART / rel))
        ink = sum(c != '.' for r in rows for c in r)
        print(f'{kind:8s} {rel:32s} {ink:4d} lit cells')
        out.append(js(kind, rows))
    out.append('}\n')
    dest = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'gear-art.js')
    dest.write_text('\n'.join(out))
    print('wrote', dest)
