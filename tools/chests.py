"""
The two new shop chests, drawn rather than typed.

The supply crate keeps the hand-drawn treasure chest it has always had. The
other two rungs needed art of their own, and thirty-two rows of characters
typed twice by hand is how you get a chest with one band on the left and two on
the right. So the shapes are described here — an arch, a circle, a ring of
spokes — and the grid falls out of them.

Run:  python3 tools/chests.py          # prints both sprites as JS
"""

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
# Epic. Not a chest at all: a door with a wheel on it. The silhouette is the
# whole point — at 40px on a shelf next to two chests, only a different outline
# reads, and a fourth colour of lid does not.
def vault():
    g = blank()
    rect(g, 2, 3, 29, 29, 'c')           # the frame
    rect(g, 3, 4, 28, 28, 'd')
    rect(g, 4, 5, 27, 27, 'b')           # recess
    disc(g, 16, 16.5, 11.4, 'd')         # the door
    ring(g, 16, 16.5, 10.2, 11.4, 'e')   # its lit edge
    disc(g, 16, 16.5, 9.4, 'f')
    ring(g, 16, 16.5, 8.0, 9.0, 'h')     # the seam the door shuts on
    ring(g, 16, 16.5, 6.2, 7.2, 'e')     # the rim of the wheel
    # four thin spokes from the hub out to the rim
    for y in range(H):
        for x in range(W):
            d2 = (x - 16) ** 2 + (y - 16.5) ** 2
            if d2 > 7.2 * 7.2:
                continue
            if abs(x - 16) <= 0.5 or abs(y - 16.5) <= 0.5:
                g[y][x] = 'e'
    disc(g, 16, 16.5, 2.6, 'h')          # hub
    disc(g, 16, 16.5, 1.5, 'i')
    g[16][15] = 'j'
    # rivets
    for rx, ry in ((5, 6), (26, 6), (5, 26), (26, 26)):
        disc(g, rx, ry, 1.2, 'e')
    g = outline(g, 'a')
    return g


VAULT_PALETTE = {
    'a': '#0a0712',   # outline
    'b': '#150f22',   # recess
    'c': '#241a38',   # frame shadow
    'd': '#3b2b59',   # frame
    'e': '#6a4f9c',   # lit metal
    'f': '#2d2144',   # door face
    'h': '#a855f7',   # the violet in the seams
    'i': '#d8b4fe',   # hub
    'j': '#f3e8ff',   # glint
}


if __name__ == '__main__':
    print(emit('LOOT_CHEST_SPRITE', LOOT_PALETTE, loot_chest()))
    print(emit('VAULT_SPRITE', VAULT_PALETTE, vault()))
