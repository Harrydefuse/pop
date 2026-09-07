"""
The arms that hang on the title screen's wall.

These are scenery, not gear: nothing in the game equips them, so they live
apart from GEAR_ART and get their own palette with real wood in it. They are
all cut to one 16x32 frame and hang point-down, so a rack can line any set of
them up on a single beam without a per-item nudge.

Run:  python3 tools/wall_arms.py   -> prints the JS block for ArmouryScene.jsx
"""

import math

W, H = 16, 32


def blank():
    return [['.'] * W for _ in range(H)]


def rect(g, x0, y0, x1, y1, ch):
    for y in range(max(0, y0), min(H, y1 + 1)):
        for x in range(max(0, x0), min(W, x1 + 1)):
            g[y][x] = ch


def col(g, x, y0, y1, ch):
    rect(g, x, y0, x, y1, ch)


def row(g, y, x0, x1, ch):
    rect(g, x0, y, x1, y, ch)


def outline(g, ch='o'):
    """Ring every painted cluster in the outline colour. Drawn last, so a shape
    keeps its own edge no matter what order the parts went down in."""
    out = [r[:] for r in g]
    for y in range(H):
        for x in range(W):
            if g[y][x] != '.':
                continue
            near = False
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                yy, xx = y + dy, x + dx
                if 0 <= yy < H and 0 <= xx < W and g[yy][xx] not in ('.', ch):
                    near = True
            if near:
                out[y][x] = ch
    return out


def haft(g, top, bottom):
    """The shaft every pole weapon shares: two columns of timber down the middle."""
    col(g, 7, top, bottom, 'W')
    col(g, 8, top, bottom, 'w')


def blade(g, top, bottom, x0=6, tip=3):
    """A straight steel blade with a lit left bevel, tapering to a point."""
    for y in range(top, bottom + 1 - tip):
        g[y][x0] = 'm'
        g[y][x0 + 1] = 'l'
        g[y][x0 + 2] = 'm'
        g[y][x0 + 3] = 's'
    for i in range(tip):
        y = bottom - tip + 1 + i
        inset = (i + 1) // 2
        for x in range(x0 + inset, x0 + 4 - inset):
            g[y][x] = 'l' if x <= x0 + 1 else 'm'


# --------------------------------------------------------------- the weapons

def sword():
    g = blank()
    rect(g, 6, 1, 9, 3, 'A')          # pommel
    rect(g, 7, 2, 8, 2, 'E')
    rect(g, 7, 4, 8, 8, 'W')          # grip
    rect(g, 3, 9, 12, 10, 'A')        # crossguard
    rect(g, 6, 9, 9, 10, 'E')
    blade(g, 11, 29, 6, 4)
    return g


def dagger():
    g = blank()
    rect(g, 6, 5, 9, 6, 'A')
    rect(g, 7, 7, 8, 10, 'W')
    rect(g, 4, 11, 11, 12, 'A')
    blade(g, 13, 25, 6, 3)
    return g


# How far the cutting edge reaches from the left wall, row by row. Written out
# rather than computed: the shape is a crescent with horns, and a curve that
# gives horns as well as a belly is easier to read as twelve numbers than as an
# exponent someone has to solve in their head.
AXE_EDGE = (0, 2, 4, 4, 2, 0, 0, 2, 4, 4, 2, 0)


def axe():
    g = blank()
    col(g, 10, 1, 30, 'W')
    col(g, 11, 1, 30, 'w')
    # One big bit rather than two. A double head packed into six columns came
    # out as an oval on a stick; a single crescent — horns top and bottom, the
    # edge bowed out between them — is the silhouette that still reads as an
    # axe when the whole weapon is fifty pixels tall.
    for i, reach in enumerate(AXE_EDGE):
        y = 3 + i
        rect(g, reach, y, 9, y, 'm')
        rect(g, reach, y, reach + 1, y, 'l')
        rect(g, 8, y, 9, y, 's')   # the eye, where the head sits on the haft
    rect(g, 9, 2, 12, 3, 'A')      # the langets that bind head to haft
    rect(g, 9, 15, 12, 16, 'A')
    return g


def spear():
    g = blank()
    haft(g, 9, 30)
    rect(g, 6, 8, 9, 9, 'A')          # socket
    # A leaf head: wide at the shoulders, drawn to a point.
    for y in range(1, 8):
        t = (y - 1) / 6
        half = 1 + int(round(2 * (1 - abs(t - 0.35) / 0.65)))
        half = max(1, half)
        for x in range(8 - half, 8 + half):
            g[y][x] = 'l' if x < 8 else 'm'
    g[0][7] = 'l'
    g[0][8] = 'm'
    return g


def mace():
    g = blank()
    haft(g, 11, 29)
    rect(g, 6, 12, 9, 13, 'A')
    rect(g, 4, 4, 11, 10, 'm')        # the head
    rect(g, 5, 3, 10, 11, 'm')
    rect(g, 5, 5, 8, 8, 'l')
    for y in (3, 6, 9):               # flanges
        rect(g, 2, y, 3, y + 1, 's')
        rect(g, 12, y, 13, y + 1, 's')
    rect(g, 6, 1, 9, 2, 'A')          # the spike on top
    return g


def bow():
    g = blank()
    # The stave is walked down the frame and joined to the point before it, so
    # the curve stays one unbroken limb instead of the ladder of loose pixels a
    # per-row plot leaves behind.
    prev = None
    for y in range(1, 31):
        t = (y - 1) / 29
        x = 10 - 6 * (math.sin(math.pi * t) ** 1.15)
        if t < 0.1 or t > 0.9:        # the recurve, where the tips turn back
            x += 1.4
        x = max(1, min(13, int(round(x))))
        if prev is not None and abs(x - prev) > 1:
            for xx in range(min(x, prev), max(x, prev) + 1):
                g[y][xx] = 'W'
                g[y][xx + 1] = 'w'
        g[y][x] = 'W'
        g[y][x + 1] = 'w'
        prev = x
    for y in range(2, 30):            # the string, taut between the two tips
        if g[y][11] == '.':
            g[y][11] = 'l'
    rect(g, 3, 14, 6, 17, 'A')        # the grip, wrapped where the hand sits
    return g


def shield():
    g = blank()
    # A heater: rounded shoulders, straight sides, drawn down to a point.
    for y in range(2, 28):
        if y < 5:
            half = 4 + (y - 2)
        elif y < 15:
            half = 6
        else:
            half = int(round(6 * (1 - (y - 14) / 13.5) ** 0.8))
        if half < 1:
            break
        for x in range(8 - half, 8 + half):
            g[y][x] = 'l' if x < 7 else 'm'
    # One round boss, no device. Anything more detailed than this turned into a
    # smear of gold the moment the shield was drawn small.
    for i, half in enumerate((2, 3, 3, 3, 3, 2)):
        y = 9 + i
        rect(g, 8 - half, y, 7 + half, y, 'A')
    rect(g, 7, 11, 8, 12, 'E')
    return g


ARMS = {
    'sword': sword, 'dagger': dagger, 'axe': axe,
    'spear': spear, 'mace': mace, 'bow': bow, 'shield': shield,
}

if __name__ == '__main__':
    print('const ARMS = {')
    for name, fn in ARMS.items():
        g = outline(fn())
        print(f'  {name}: [')
        for r in g:
            print(f"    '{''.join(r)}',")
        print('  ],')
    print('}')
