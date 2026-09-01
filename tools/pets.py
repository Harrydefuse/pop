"""Draw the four headline pets, at four times the pixels they had.

Every pet in the roster used to be the same sixteen-pixel template — one head,
one headband, one pair of eyes on row seven, one mouth on row nine — recoloured
per creature. A storm lion and a puppy came out as the same blob in different
colours, which is a poor reward for a campaign that hands one of these over at
the end of it.

These four are drawn instead: thirty-two square, one silhouette each, with the
features a player needs to name the animal without reading the label — a mane
that radiates, a snout and wings, tusks under a heavy brow, a coiled wyrm with
fire in the cracks. The LVL100 band stays, because it is what marks a creature
as somebody's, but it is a slim brow band now rather than a bar across the face.

Each grid is characters into a palette, the same contract as every other sprite
in the app: '.' is transparent, so the art scales to any size as SVG rects and
never needs a second resolution.
"""

import math

W = H = 32


class Grid:
    """A 32-square canvas. Masses go down as discs and spikes, features go down
    as hand-written blocks placed at an offset — so the counting is only ever
    the width of a snout, never the width of the frame."""

    def __init__(self):
        self.g = [['.'] * W for _ in range(H)]

    def px(self, x, y, key):
        if 0 <= x < W and 0 <= y < H:
            self.g[y][x] = key

    def disc(self, cx, cy, rx, ry, key):
        for y in range(cy - ry, cy + ry + 1):
            t = (y - cy) / ry
            w = rx * math.sqrt(max(0.0, 1 - t * t))
            for x in range(round(cx - w), round(cx + w) + 1):
                self.px(x, y, key)

    def radial(self, cx, cy, rx, ry, ramp):
        """Concentric bands out from a centre — what turns a flat disc into a
        mane rather than a coin."""
        n = len(ramp)
        for y in range(cy - ry - 1, cy + ry + 2):
            for x in range(cx - rx - 1, cx + rx + 2):
                if not (0 <= x < W and 0 <= y < H) or self.g[y][x] == '.':
                    continue
                t = math.hypot((x - cx) / rx, (y - cy) / ry)
                self.g[y][x] = ramp[min(n - 1, int(t * n))]

    def spike(self, cx, cy, dx, dy, length, base, key):
        n = math.hypot(dx, dy) or 1
        dx, dy = dx / n, dy / n
        for j in range(length * 2):
            i = j / 2
            t = i / max(1, length - 1)
            w = max(0 if t > 0.85 else 1, round((base / 2) * (1 - t)))
            x, y = round(cx + dx * i), round(cy + dy * i)
            for ox in range(-w, w + 1):
                for oy in range(-w, w + 1):
                    if abs(ox) + abs(oy) <= w:
                        self.px(x + ox, y + oy, key)

    def outline(self, key):
        solid = [[c != '.' for c in row] for row in self.g]
        for y in range(H):
            for x in range(W):
                if solid[y][x]:
                    continue
                if any(solid[y + dy][x + dx]
                       for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
                       if 0 <= x + dx < W and 0 <= y + dy < H):
                    self.g[y][x] = key

    def blit(self, block, x0, y0):
        width = {len(r) for r in block}
        if len(width) != 1:
            raise SystemExit(f'ragged block at {x0},{y0}: widths {sorted(width)}')
        for dy, row in enumerate(block):
            for dx, c in enumerate(row):
                if c != '.':
                    self.px(x0 + dx, y0 + dy, c)

    def path(self, points, thick, key):
        """A thick line through a set of points — a body that coils rather than
        one that sits in a lump."""
        for i in range(len(points) - 1):
            (x0, y0), (x1, y1) = points[i], points[i + 1]
            steps = max(abs(x1 - x0), abs(y1 - y0)) or 1
            for t in range(steps + 1):
                u = (i + t / steps) / (len(points) - 1)
                r = max(1, round(thick[0] + (thick[1] - thick[0]) * u))
                self.disc(round(x0 + (x1 - x0) * t / steps),
                          round(y0 + (y1 - y0) * t / steps), r, r, key)

    def mirror(self, axis=None):
        """Reflect about the frame's vertical centre. Placing spikes by angle and
        rounding each one independently made a lopsided mane; a half drawn once
        and flipped cannot be lopsided."""
        ax = W - 1 if axis is None else axis
        for y in range(H):
            for x in range(W):
                if self.g[y][x] != '.':
                    self.px(ax - x, y, self.g[y][x])

    def rows(self):
        return [''.join(r) for r in self.g]


# The LVL100 mark used to be a bar across the forehead. On a sixteen-pixel blob
# that was fine; on a thirty-two-pixel animal it reads as a bandana, and every
# creature came out looking like a person in fancy dress. It sits at the throat
# now, where a collar goes, which is where you would put a name tag anyway.
COLLAR = [
    'oHHHHHHHHHo',
    'oHSHSSHSHHo',
]


def check(name, grid):
    bad = [(i, len(r)) for i, r in enumerate(grid) if len(r) != W]
    if bad or len(grid) != H:
        raise SystemExit(f'{name}: {len(grid)} rows; wrong widths {bad[:6]}')
    return grid


def emit(name, ident, palette, grid):
    rows = ',\n'.join(f"    '{r}'" for r in check(name, grid))
    pal = ', '.join(f"{k}: '{v}'" for k, v in palette.items())
    return f"""export const {name} = {{
  id: '{ident}',
  w: {W},
  h: {H},
  palette: {{ {pal} }},
  grid: [
{rows},
  ],
}}"""


# ------------------------------------------------------- ZEUS · storm lion
# The one the campaign hands over at LVL100, so it gets the loudest silhouette
# in the roster: a mane twice the width of the head, thrown out in spikes, with
# the storm sitting in it.

ZEUS_PAL = dict(
    o='#2a1206', m='#7d4109', n='#bd6d0d', y='#eda227', b='#e0a844', l='#f7d489',
    d='#a9701f', e='#8bf0ff', k='#0d1020', w='#fff6e0', z='#d6f8ff', p='#7c4318',
    H='#191a2e', S='#f2ecff',
)

ZEUS_FACE = [
    '....ooooooo....',
    '..obbbbbbbbbo..',
    '.obbbbbbbbbbbo.',
    '.obbbbbbbbbbbo.',
    '.obbbbbbbbbbbo.',
    '.obblllllllbbo.',
    'obb' + 'ddd' + 'lll' + 'ddd' + 'bbo',
    'obl' + 'ee' + 'lllll' + 'ee' + 'lbo',
    'obl' + 'ke' + 'lllll' + 'ek' + 'lbo',
    'ob' + 'l' * 11 + 'bo',
    '.obdllpppllddo.',
    '.obdllpppllddo.',
    '..obdwkkkwdbo..',
    '...obbbbbbbo...',
    '....ooooooo....',
]


def zeus():
    g = Grid()
    g.disc(15, 26, 8, 5, 'n')                 # chest, so the mane lies over it
    g.disc(15, 27, 6, 4, 'y')
    g.blit(['obwbo.obwbo'], 10, 30)           # forepaws
    g.disc(15, 13, 11, 10, 'n')
    # The mane, thrown out in spikes. Drawn as a half and mirrored: rounding each
    # angle on its own put one more pixel on the left than the right, and at this
    # size a lion with a lopsided mane looks broken rather than windswept.
    for ux, uy in ((0, -1), (0.5, -0.87), (0.87, -0.5), (1, 0), (0.95, 0.31)):
        g.spike(round(15 + ux * 10), round(13 + uy * 9), ux, uy, 5, 4, 'n')
    g.mirror()
    g.radial(15, 13, 11, 10, 'nnyyyynnm')
    g.blit(ZEUS_FACE, 8, 6)
    g.blit(COLLAR, 10, 23)
    for x, y in ((10, 4), (11, 3), (10, 2)):
        g.px(x, y, 'z')                       # the storm, sitting in the mane
        g.px(30 - x, y, 'z')
    g.outline('o')
    return g.rows()


# ------------------------------------------------------ DRAKE · hearth drake
# Wings are the whole point of a drake, so it gets two of them at full span and
# the head is sized to leave room for them.

DRAKE_PAL = dict(
    o='#17240f', g='#4f7a3c', l='#7fb45c', d='#33532a', y='#efe0a8', r='#f2803a',
    R='#ffc23d', k='#101018', e='#ffcf4d', w='#f4f0e0', H='#191a2e', S='#f2ecff',
)

DRAKE_WING = [
    'ow..........',
    'owdo........',
    'owdldo......',
    'owdlldo.....',
    'owdllldo....',
    'owdlldldo...',
    'owdllldldo..',
    'owdlldldldo.',
    'owdllldldlgo',
    '.owdlldldlgo',
    '..owdlldllgo',
    '...owdlldlgo',
    '....owdldlgo',
    '.....ooogglo',
]

DRAKE_HEAD = [
    '...oooooooo...',
    '..oggggggggo..',
    '.oggggggggggo.',
    '.oggggggggggo.',
    '.oggggggggggo.',
    '.oggggggggggo.',
    'oggllllllllggo',
    'ogekllllllkego',
    'ogkellllllekgo',
    'oggllllllllggo',
    '.oggllllllggo.',
    '..oggllllggo..',
]

DRAKE_SNOUT = [
    'oggllllggo',
    'oglkllklgo',
    'ogllllllgo',
    'ogwwkkwwgo',
    '.ogrRRrgo.',
    '..oooooo..',
]

DRAKE_BODY = [
    'oggllllllggo',
    'ogyyyyyyyygo',
    'ogyrRRRRrygo',
    'ogyyrRRryygo',
    'oggyyrrryggo',
    '.oggyyyyggo.',
    '..oggyyggo..',
    '..ogggggo...',
    '.oggo..oggo.',
    'owwwo..owwwo',
]


def drake():
    g = Grid()
    g.blit(DRAKE_WING, 0, 8)
    g.spike(13, 8, -0.45, -1, 8, 3, 'w')      # horn, swept back
    g.mirror()
    g.blit(DRAKE_BODY, 10, 21)
    g.blit(DRAKE_HEAD, 9, 6)
    g.blit(DRAKE_SNOUT, 11, 17)
    g.blit(COLLAR, 10, 23)
    g.outline('o')
    return g.rows()


# ----------------------------------------------------- EMBER · ash wyrmling
# A wyrm is a body first and a face second: it coils, and the fire shows through
# the cracks where the coil bends.

EMBER_PAL = dict(
    o='#221a1e', a='#4a4048', b='#6b6068', l='#948a92', r='#ff6a2a', R='#ffc23d',
    y='#fff0b8', k='#0d0a10', e='#ffd166', w='#e8e2d8', H='#191a2e', S='#f2ecff',
)

EMBER_HEAD = [
    '..oooooooo..',
    '.oaaaaaaaao.',
    'oaaaaaaaaaao',
    'oaaaaaaaaaao',
    'oaaaaaaaaaao',
    'oallllllllao',
    'oaleelleelao',
    'oalkelleklao',
    'oallllllllao',
    '.oalrRRrlao.',
    '.oalwkkwlao.',
    '..oooooooo..',
]

EMBER_COIL = [(15, 12), (22, 17), (19, 24), (11, 27), (6, 23), (5, 19)]


def ember():
    g = Grid()
    g.path(EMBER_COIL, (5, 2), 'b')
    g.path([(x - 1, y - 1) for x, y in EMBER_COIL], (3, 1), 'l')   # lit along the top
    g.spike(11, 5, -0.6, -1, 6, 2, 'w')       # horns
    g.spike(20, 5, 0.6, -1, 6, 2, 'w')
    # Fire through the cracks, on the inside of every bend — where a coil that
    # tight would actually split.
    for i, (x, y) in enumerate(((22, 15), (23, 20), (17, 25), (10, 26), (6, 21))):
        for dx, dy, k in ((0, 0, 'R'), (1, 1, 'r'), (-1, 1, 'r'), (0, -1, 'y' if i % 2 else 'r')):
            g.px(x + dx, y + dy, k)
    g.blit(EMBER_HEAD, 9, 3)
    g.blit(COLLAR, 9, 14)
    g.outline('o')
    return g.rows()


# -------------------------------------------------------- TUSKLING · ogre cub
# Grimtusk's cub, so it wears the world raid's greens and amber eyes. Read it by
# the tusks: everything else on the head is sized to leave them room.

TUSK_PAL = dict(
    o='#1c2a12', g='#5f8a3a', l='#83b154', d='#3d5c26', t='#f4eed4', e='#fbbf24',
    k='#101018', w='#ffffff', h='#3a2a16', H='#191a2e', S='#f2ecff',
)

# Long uniform runs are spelled as products rather than as walls of letters —
# a head twenty pixels wide is easier to keep honest that way, and the rows that
# carry shape (brow, eyes, tusks, mouth) are still written out in full.
TUSK_HEAD = [
    '......oooooooo......',
    '....oggggggggggo....',
    '..o' + 'g' * 14 + 'o..',
    '.o' + 'g' * 16 + 'o.',
    'o' + 'g' * 18 + 'o',
    'og' + 'g' * 16 + 'go',
    'og' + 'g' * 16 + 'go',
    'o' + 'g' * 18 + 'o',
    'ogg' + 'l' * 14 + 'ggo',
    'ogll' + 'eek' + 'l' * 6 + 'kee' + 'llgo',
    'ogll' + 'kee' + 'l' * 6 + 'eek' + 'llgo',
    'ogg' + 'l' * 14 + 'ggo',
    'ogg' + 'l' * 6 + 'dd' + 'l' * 6 + 'ggo',
    'ogglt' + 'lll' + 'kkkk' + 'lll' + 'tlggo',
    'ogglt' + 'lll' + 'wwww' + 'lll' + 'tlggo',
    '.oggl' + 't' + 'l' * 8 + 't' + 'lggo.',
    '..ogg' + 'l' * 10 + 'ggo..',
    '...o' + 'g' * 12 + 'o...',
    '......oooooooo......',
]


def tuskling():
    g = Grid()
    g.disc(15, 28, 6, 4, 'g')                 # chest
    g.disc(15, 29, 4, 2, 'l')
    g.disc(5, 27, 3, 3, 'g')                  # arm, with daylight either side of it
    g.spike(6, 13, -1, -0.3, 6, 4, 'd')       # ear
    g.spike(9, 5, -0.5, -1, 4, 3, 'h')        # hair
    g.spike(13, 3, -0.15, -1, 4, 3, 'h')
    g.mirror()
    g.blit(TUSK_HEAD, 6, 2)
    g.spike(11, 18, -0.5, -1, 6, 2, 't')      # tusks, up past the lip
    g.spike(20, 18, 0.5, -1, 6, 2, 't')
    g.blit(COLLAR, 10, 23)
    g.blit(['oglllgo..oglllgo'], 8, 30)       # fists
    g.outline('o')
    return g.rows()


PETS = (
    ('ZEUS', 'zeus', ZEUS_PAL, zeus),
    ('DRAKE', 'drake', DRAKE_PAL, drake),
    ('EMBER', 'ember', EMBER_PAL, ember),
    ('TUSKLING', 'tuskling', TUSK_PAL, tuskling),
)


if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'js':
        print('\n\n'.join(emit(n, i, p, f()) for n, i, p, f in PETS))
    else:
        for n, _, _, f in PETS:
            print(f'=== {n} ===')
            print('\n'.join(check(n, f())))
