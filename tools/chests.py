"""
The two new shop chests, drawn rather than typed.

The supply crate keeps the hand-drawn treasure chest it has always had. The
other two rungs needed art of their own, and thirty-two rows of characters
typed twice by hand is how you get a chest with one band on the left and two on
the right. So the shapes are described here — an arch, a circle, a ring of
spokes — and the grid falls out of them.

Run:  python3 tools/chests.py          # prints both sprites as JS
"""

import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import png


def _rgba(hexcode):
    if not hexcode:
        return (0, 0, 0, 0)
    n = int(hexcode.lstrip('#'), 16)
    return ((n >> 16) & 255, (n >> 8) & 255, n & 255, 255)


W = H = 32


def blank():
    return [['.'] * W for _ in range(H)]


def rect(g, x0, y0, x1, y1, ch):
    for y in range(max(0, y0), min(H, y1 + 1)):
        for x in range(max(0, x0), min(W, x1 + 1)):
            g[y][x] = ch


def disc(g, cx, cy, r, ch):
    for y in range(H):
        for x in range(W):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                g[y][x] = ch


def ring(g, cx, cy, r0, r1, ch):
    for y in range(H):
        for x in range(W):
            d = (x - cx) ** 2 + (y - cy) ** 2
            if r0 * r0 <= d <= r1 * r1:
                g[y][x] = ch


def arch(g, x0, x1, ybase, rise, ch):
    """A half-ellipse lid sitting on ybase."""
    cx = (x0 + x1) / 2
    rx = (x1 - x0) / 2
    for y in range(H):
        for x in range(W):
            if y > ybase:
                continue
            dy = (ybase - y) / rise
            dx = (x - cx) / rx
            if dx * dx + dy * dy <= 1:
                g[y][x] = ch


def outline(g, ch):
    """One pixel of dark around every filled run, drawn outside the shape."""
    out = [row[:] for row in g]
    for y in range(H):
        for x in range(W):
            if g[y][x] != '.':
                continue
            near = False
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < H and 0 <= xx < W and g[yy][xx] not in ('.', ch):
                        near = True
            if near:
                out[y][x] = ch
    return out


def diamond(g, cx, cy, r, ch):
    for y in range(H):
        for x in range(W):
            if abs(x - cx) + abs(y - cy) <= r:
                g[y][x] = ch


def lit(g, gold, light):
    """Put the light on the top edge of every run of gold, the way the drawing
    does — a band that is one flat colour reads as a sticker, not as metal."""
    for x in range(W):
        for y in range(H):
            if g[y][x] == gold and (y == 0 or g[y - 1][x] != gold):
                g[y][x] = light


def emit(name, palette, g):
    rows = ''.join("    '%s',\n" % ''.join(r) for r in g)
    pal = ''.join("    %s: '%s',\n" % (k, v) for k, v in palette.items())
    return (
        "export const %s = {\n  w: %d,\n  h: %d,\n  palette: {\n%s  },\n  grid: [\n%s  ],\n}\n"
        % (name, W, H, pal, rows)
    )


# ------------------------------------------------------------------ loot chest
# Rare. A banded steel strongbox with an arched lid and a blue stone in the
# lock, so it reads as a step up from the wooden crate without being the same
# chest in another colour.
#
# Built off a silhouette rather than stacked shapes: fill the outline once,
# then light the top two pixels of every column. That is what puts the shine
# along the crown of the lid instead of flooding the whole thing pale, and it
# is why the iron straps stop at the wood instead of floating above it.
def crown(g, ch, light, mid):
    """Light the top of every column, so the shine follows the curve of a lid."""
    for x in range(W):
        top = next((y for y in range(H) if g[y][x] != '.'), None)
        if top is None:
            continue
        for i, c in enumerate((light, light, mid, mid)):
            y = top + i
            if y < H and g[y][x] == ch:
                g[y][x] = c


def loot_chest():
    g = blank()
    # the silhouette, in one tone, then lit from above
    arch(g, 3, 28, 16, 7, 'd')
    rect(g, 3, 16, 28, 27, 'd')
    crown(g, 'd', 'f', 'e')
    rect(g, 2, 27, 29, 29, 'c')          # plinth, in shadow
    rect(g, 3, 16, 28, 17, 'c')          # the seam where lid meets body
    rect(g, 3, 18, 28, 18, 'e')          # and the light that catches under it
    # iron straps, clipped to the chest so they stop where it does
    for x0 in (6, 22):
        for y in range(H):
            for x in range(x0, x0 + 3):
                if g[y][x] != '.':
                    g[y][x] = 'b' if x > x0 else 'c'
    # lock plate and stone
    rect(g, 13, 13, 18, 24, 'b')
    rect(g, 14, 14, 17, 23, 'd')
    disc(g, 15.5, 18, 2.6, 'h')
    disc(g, 15.5, 18, 1.6, 'i')
    g[17][15] = 'j'
    rect(g, 15, 21, 16, 23, 'c')         # keyhole
    g = outline(g, 'a')
    return g


LOOT_PALETTE = {
    'a': '#0c1018',   # outline
    'b': '#1b2431',   # strap iron
    'c': '#26303f',   # shadow
    'd': '#3d4c63',   # steel
    'e': '#5d7091',   # steel lit
    'f': '#93a6c6',   # crown highlight
    'h': '#0b4f74',   # stone, deep
    'i': '#1e9ad0',   # stone
    'j': '#9fe8ff',   # stone glint
}


# ----------------------------------------------------------------------- vault
# Epic. Purple and gold: a banded chest with a stone set in the lock plate and
# a smaller stone in each foot, transcribed by eye from a drawing of it.
#
# This replaces a vault door drawn here before. The door read well as "not a
# chest", which turned out to be the problem — the shelf is a ladder of chests
# and the top of it should be the best chest, not a different object.
def panel(g, x0, y0, x1, y1, ink, fill, shade, light):
    """A purple panel let into the gold, with its own black reveal.

    The reveal is the whole trick. Gold bands that merely touch purple read as
    one flat sticker; a pixel of black between them is what makes the gold sit
    proud of the panel, and it is what the drawing does everywhere."""
    rect(g, x0, y0, x1, y1, ink)
    rect(g, x0 + 1, y0 + 1, x1 - 1, y1 - 1, fill)
    rect(g, x0 + 1, y1 - 1, x1 - 1, y1 - 1, shade)
    rect(g, x0 + 1, y0 + 1, x1 - 1, y0 + 1, light)


def vault():
    g = blank()
    # The body is gold all the way through, and the purple is let into it.
    # Built the other way round — purple box, gold straps laid on — the straps
    # float and the corners never meet.
    rect(g, 3, 4, 28, 26, 'g')

    # four panels: two on the lid, two on the body
    for (x0, x1) in ((6, 13), (18, 25)):
        panel(g, x0, 6, x1, 13, 'k', 'r', 'p', 's')
        panel(g, x0, 17, x1, 24, 'k', 'p', 'q', 'r')

    # the lock plate, and the stone set in it
    rect(g, 13, 16, 18, 23, 'k')
    rect(g, 14, 16, 17, 22, 'g')
    diamond(g, 15.5, 14.5, 6, 'k')
    diamond(g, 15.5, 14.5, 5, 'g')
    diamond(g, 15.5, 14.5, 3.2, 'k')
    diamond(g, 15.5, 14.5, 2.4, 's')
    diamond(g, 15, 14, 1, 't')
    disc(g, 15.5, 19, 1.4, 'k')          # keyhole
    rect(g, 15, 20, 16, 22, 'k')

    # feet, each with a stone of its own, and daylight between them
    rect(g, 9, 27, 22, 29, '.')
    for x0 in (3, 23):
        rect(g, x0, 26, x0 + 5, 29, 'g')
        rect(g, x0 + 1, 27, x0 + 4, 28, 'k')
        rect(g, x0 + 2, 27, x0 + 3, 28, 's')

    # Light on the top edge of every gold run and shadow under it, so the
    # frame has a thickness instead of being one flat colour of yellow.
    #
    # Read off a snapshot, not off the grid being written: shading in place
    # makes the second row see the lit first row as "not gold", light itself,
    # and the highlight runs away down the whole column.
    was = [row[:] for row in g]
    for x in range(W):
        for y in range(H):
            if was[y][x] != 'g':
                continue
            if y == 0 or was[y - 1][x] != 'g':
                g[y][x] = 'h'
            elif y == H - 1 or was[y + 1][x] != 'g':
                g[y][x] = 'd'
    # and a few glints where a painter would put them
    for gx, gy in ((5, 4), (11, 4), (20, 4), (26, 4), (8, 15), (21, 15), (4, 9), (27, 20)):
        if g[gy][gx] in ('g', 'h', 'd'):
            g[gy][gx] = 'w'
            if g[gy][gx + 1] in ('g', 'h', 'd'):
                g[gy][gx + 1] = 'w'

    g = outline(g, 'k')
    return g


VAULT_PALETTE = {
    'k': '#140a24',   # outline, and the keyhole
    'q': '#39117d',   # purple, in shadow
    'p': '#4c1aa3',   # purple
    'r': '#6d28d9',   # purple, lit
    's': '#a855f7',   # the stones
    't': '#f3e8ff',   # their glint
    'd': '#b8760f',   # gold, in shadow
    'g': '#f0a827',   # gold
    'h': '#ffd45e',   # gold, lit
    'w': '#fff6d8',   # the glints on it
}


if __name__ == '__main__':
    if '--png' in sys.argv:
        out = sys.argv[sys.argv.index('--png') + 1]
        for name, pal, grid in (('loot', LOOT_PALETTE, loot_chest()), ('vault', VAULT_PALETTE, vault())):
            px = [[_rgba(pal.get(c)) for c in row] for row in grid]
            png.write('%s/%s.png' % (out, name), px, scale=12, alpha=True)
        raise SystemExit(0)
    print(emit('LOOT_CHEST_SPRITE', LOOT_PALETTE, loot_chest()))
    print(emit('VAULT_SPRITE', VAULT_PALETTE, vault()))
