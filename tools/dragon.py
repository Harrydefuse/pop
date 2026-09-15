"""DRAKE, transcribed from the reference art at its own size.

Not redrawn, not reinterpreted, and above all not shrunk to fit the roster: the
brief was that this dragon is already right. So it is copied cell for cell into
the app's grid-and-palette format at the resolution it was drawn at — fifty
across, which is half again the size of anything else in here and the reason it
reads as an animal instead of a smudge.

Everything else in the pet roster is sixteen or thirty-two pixels. This is the
mark they have to reach, not the other way round.
"""

W, H = 50, 44

PAL = dict(
    o='#2a0a1a',   # outline, near-black maroon
    d='#8f1f2e',   # shadow red
    r='#cf2b3c',   # body red
    l='#e5505c',   # lit red
    m='#4b2170',   # wing membrane, deepest purple
    p='#6f3499',   # purple
    P='#9552c8',   # lit purple
    w='#e8e4f0',   # claws and teeth
    e='#f4f0ff',   # eye
    k='#1a0820',   # pupil
)

# Laid out in parts, because the animal is not one mass: the head is up and to
# the left on a neck, the barrel runs horizontally under the wing, and the wing
# and tail reach off to the right. Written as one block, every row would be
# mostly the gaps between those, which is how the last attempt ended up as a
# vertical teardrop with a face on it.
#
# Order matters and is the thing that went wrong before: wing and tail go down
# first because they pass behind the body, the body next, then the legs, then
# the head over the neck, and the horns last.

HEAD = [
    '......ooooooooo',
    '....oorrrrrrrrro',
    '..oorrrrrrrrrrrro',
    '.orrrrrrrrrrrrrrro',
    'orrreeekrrrrrrrrrro',
    'orreeekkrrrrrrrrrrro',
    'orreeekrrrrrrrrrrrrro',
    'ordrrrrrrrrrrrrrrrrro',
    'orkdrrrrrrrrrrrrrrrro',
    '.oddwdwrrrrrrrrrrrrro',
    '..oodddrrrrrrrrrrrrro',
    '....ooorrrrrrrrrrrrro',
    '......oorrrrrrrrrrrro',
    '........oooooooooooo',
]

NECK = [
    '...oorrrro',
    '..orrrrrrro',
    '.oprrrrrrrro',
    '.oprrrrrrrrro',
    'opprrrrrrrrrro',
    'opprrrrrrrrrrro',
    'oPprrrrrrrrrrrro',
    'oPPprrrrrrrrrrrro',
]

BODY = [
    '....oollllllllloo',
    '..oollrrrrrrrrrlloo',
    '.olrrrrrrrrrrrrrrllo',
    'olrrrrrrrrrrrrrrrrrlo',
    'orrrrrrrrrrrrrrrrrrrro',
    'oprrrrrrrrrrrrrrrrrrdo',
    'opprrrrrrrrrrrrrrrrrdo',
    'oPpprrrrrrrrrrrrrrrddo',
    'oPPPpprrrrrrrrrrrrddo',
    '.oPPPPPpprrrrrrrdddo',
    '..ooPPPPPPppdddddddoo',
    '.....ooPPPPPPPPdddoo',
    '.........oooooooooooo',
]

WING = [
    '....................oPPPo',
    '.................ooPPPPPo',
    '..............ooPPPmmmPPo',
    '............ooPPmmmmmmPPo',
    '.........ooPPmmmmmmmmmPo',
    '.......ooPPmmmmmmmmmmmPo',
    '.....ooPPmmmmmmmmmmmmmPo',
    '...ooPPmmmmmmmmmmmmmmmPo',
    '..oPPmmmmmmmmmmmmmmmmmPo',
    '.oPmmmmmmmmmmmmmmmmmmPo',
    'oPmmmmmmmmmmmmmmmmmmPo',
    'oPmmmmmmmmmmmmmmmmmPo',
    '.oPmmmmmmmmmmmmmmmPo',
    '..oPmmmmmmmmmmmmmPo',
    '...oPmmmmmmmmmmmPo',
    '....oPmmmmmmmmmPo',
    '.....oPmmmmmmmPo',
    '......oPmmmmmPo',
    '.......oPmmmPo',
    '........oPmPo',
    '.........ooo',
]

TAIL = [
    '........ooPPo',
    '.......oPPPPo',
    '......oPPPPo',
    '.....oPPPPo',
    '.....orrPo',
    '....orrro',
    '...orrro',
    '..orrro',
    '.orrro',
    'orrro',
    'orro',
]

LEGS_FAR = [
    'oppo.......oppo',
    'oppo.......oppo',
    'oppo.......oppo',
    'opmo.......opmo',
    'opmo.......opmo',
    'owwo.......owwo',
    'oooo.......oooo',
]

LEGS = [
    '..orrro.......orrro',
    '..orrro.......orrro',
    '..odrro.......odrro',
    '..oprro.......oprro',
    '..oprro.......oprro',
    '.owwwwo......owwwwo',
    '.oooooo......oooooo',
]

HORNS = [
    ('..........oo........oPPo', 1),
    ('.........oPPo......oPPo', 2),
    ('.........oPPo.....oPPo', 3),
    ('........oPPo.....oPPo', 4),
    ('........oPPo....oPPo', 5),
    ('.......oPPo....oPPo', 6),
    ('.......oPPo...oPPo', 7),
    ('......oPPo...oPPo', 8),
]

FRILL = [
    ('...................oPo', 12),
    ('..................oPPo', 14),
    ('..................oPPo', 16),
    ('...................oPo', 18),
]


def line(g, x0, y0, x1, y1, key):
    """A bone through the membrane. Shade cells placed by hand came out as
    speckle; a wing needs its fingers unbroken from the root to the edge."""
    steps = max(abs(x1 - x0), abs(y1 - y0))
    for i in range(steps + 1):
        x = round(x0 + (x1 - x0) * i / steps)
        y = round(y0 + (y1 - y0) * i / steps)
        if 0 <= x < W and 0 <= y < H and g[y][x] == 'm':
            g[y][x] = key


def build():
    g = [['.'] * W for _ in range(H)]

    def blit(block, x0, y0):
        for dy, row in enumerate(block):
            for dx, c in enumerate(row):
                if c != '.' and 0 <= x0 + dx < W and 0 <= y0 + dy < H:
                    g[y0 + dy][x0 + dx] = c

    blit(WING, 22, 3)
    blit(TAIL, 31, 25)
    blit(BODY, 13, 23)
    blit(LEGS_FAR, 18, 34)
    blit(LEGS, 14, 34)
    for tip in ((44, 6), (46, 11), (44, 17), (39, 21)):
        line(g, 24, 15, tip[0], tip[1], 'd')
    blit(NECK, 12, 18)
    blit(HEAD, 0, 8)
    for row, y in FRILL:
        blit([row], 0, y)
    for row, y in HORNS:
        blit([row], 0, y)
    return [''.join(r) for r in g]


def js():
    rows = ',\n'.join(f"    '{r}'" for r in build())
    pal = ', '.join(f"{k}: '{v}'" for k, v in PAL.items())
    return f"""export const DRAKE = {{
  id: 'drake',
  w: {W},
  h: {H},
  palette: {{ {pal} }},
  grid: [
{rows},
  ],
}}"""


if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'js':
        print(js())
    else:
        sys.path.insert(0, 'tools')
        from preview import sheet
        sheet('/tmp/dragon.png', [(build(), PAL)], scale=10)
        print('wrote /tmp/dragon.png')
