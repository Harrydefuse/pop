"""Transcribe the female character from art/ into the game's sprite format.

Her art is a screenshot of a transparent-background view, so the checkerboard
is baked in as light grey and has to be treated as background. What comes out
the other side is a clean 30 x 65 grid — her own frame, not the male's 32 x 59.
Squashing her into his made her stubby, which is not the art that was sent.

Colours are mapped onto the hero palette KEYS rather than kept as literal hex,
which is what lets skin and hair colour still be chosen at sign-up, and what
splits her into three layers for free: whatever is tunic is her shirt, whatever
is trousers is her legs, and the bare body is the same grid with both recoloured
to skin.
"""
import sys, pathlib
from collections import Counter

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import png

SRC = pathlib.Path(__file__).resolve().parents[1] / 'art/female avatar.png'
GW, GH = 30, 65

# The hero palette, by key. Each source colour is snapped to the nearest of
# these, so her shading survives and the ramps stay recolourable.
REF = {
    'o': (0x0a, 0x06, 0x04),   # outline
    's': (0xf0, 0xb8, 0x7b), 'S': (0xc9, 0x98, 0x66), 'd': (0xb4, 0x86, 0x59), 'D': (0x82, 0x60, 0x3f),
    'h': (0x6d, 0x3c, 0x1c), 'H': (0x4d, 0x2a, 0x14), 'j': (0x66, 0x38, 0x1a), 'J': (0x56, 0x30, 0x16),
    'a': (0xac, 0x8d, 0x5c), 'A': (0x7d, 0x66, 0x43), 'b': (0x67, 0x54, 0x37), 'B': (0x4f, 0x41, 0x2a),
    't': (0x52, 0x2f, 0x17), 'T': (0x37, 0x1f, 0x10), 'u': (0x4a, 0x2a, 0x15), 'U': (0x41, 0x25, 0x13),
}
SKIN, HAIR, TUNIC, TROUSER = 'sSdD', 'hHjJ', 'aAbB', 'tTuU'
# Bare body: her clothes come off onto the skin ramp, lightest to darkest.
TO_SKIN = dict(zip(TUNIC + TROUSER, SKIN + SKIN))


def is_bg(p):
    r, g, b = p[0], p[1], p[2]
    return min(r, g, b) > 232 and max(r, g, b) - min(r, g, b) < 14


# Her hair brown and her trouser brown are almost the same colour, so nearest
# match alone put half her ponytail in the leg layer. Which ramp a brown belongs
# to is decided by where it is: above the waist it is hair, below it is cloth.
WAIST = 34


def nearest(c, y):
    pool = [k for k in REF if k not in ('tTuU' if y < WAIST else 'hHjJ')]
    return min(pool, key=lambda k: sum((c[i] - REF[k][i]) ** 2 for i in range(3)))


def read_grid():
    w, h, px = png.read(str(SRC))
    ys = [y for y in range(h) if any(not is_bg(p) for p in px[y])]
    xs = [x for x in range(w) if any(not is_bg(px[y][x]) for y in range(h))]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    W, H = x1 - x0 + 1, y1 - y0 + 1

    rows = []
    for cy in range(GH):
        row = ''
        for cx in range(GW):
            # Mode, not mean: the source is a soft render and averaging would
            # turn every hard edge into mud.
            tally = Counter()
            for yy in range(int(y0 + cy * H / GH), int(y0 + (cy + 1) * H / GH)):
                for xx in range(int(x0 + cx * W / GW), int(x0 + (cx + 1) * W / GW)):
                    p = px[yy][xx]
                    tally['.' if is_bg(p) else nearest(p, cy)] += 1
            row += tally.most_common(1)[0][0] if tally else '.'
        rows.append(row)
    return rows


def only(rows, keep):
    """One clothing layer on its own, everything else knocked out."""
    return [''.join(c if c in keep else '.' for c in r) for r in rows]


def bare(rows):
    return [''.join(TO_SKIN.get(c, c) for c in r) for r in rows]


def js(name, rows):
    body = ',\n'.join(f"  '{r}'" for r in rows)
    return f'const {name} = [\n{body},\n]\n'


if __name__ == '__main__':
    g = read_grid()
    print(f'{GW}x{GH}', Counter(''.join(g)).most_common())
    out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'female-grids.js')
    out.write_text(
        js('HERO_F', g) + '\n' + js('HERO_BASE_F', bare(g)) + '\n'
        + js('HERO_F_SHIRT', only(g, TUNIC)) + '\n' + js('HERO_F_LEGS', only(g, TROUSER))
    )
    print('wrote', out)
