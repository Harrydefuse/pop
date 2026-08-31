"""Draw the worn armour for both builds.

The gear icons are fully rendered — six values, rim light, cast shadow, trim.
The art worn on the character was flat: one mid tone with a dark edge, which is
why a full set looked like a gold jumpsuit next to its own icon. Nobody grinds
for a jumpsuit.

So every piece here is built from separate plates rather than one outline, and
each plate is lit before the next one is stacked on top of it: the top and left
faces of a plate catch the light, the bottom and right fall away, and where a
plate overlaps the one beneath it a hard shadow is laid in first. That is what
makes a cuirass read as a cuirass and a fauld read as bands of steel rather
than as a shape with a line around it.

Both helms are closed over the hair. The body is drawn from a hair-masked grid
whenever a helm is worn — you cannot have a helmet and a hairstyle at once, and
a fringe poking through a steel dome is the single thing that made the whole
set look like dress-up.

Palette keys are the set ramp shared with the icons:
    o outline · s deep shadow · d dark · m mid · l light · A accent
"""

MALE = (32, 59)
FEMALE = (30, 65)


class Piece:
    def __init__(self, size):
        self.w, self.h = size
        self.g = [['.' for _ in range(self.w)] for _ in range(self.h)]

    # -- primitives ---------------------------------------------------------
    def at(self, x, y):
        return self.g[y][x] if 0 <= x < self.w and 0 <= y < self.h else '.'

    def put(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.g[y][x] = c

    def span(self, y, x0, x1, c):
        for x in range(x0, x1 + 1):
            self.put(x, y, c)

    def plate(self, spans, lit='l', body='m', shade='d', seat=True):
        """One piece of steel, lit from the top left and seated on whatever is
        already under it."""
        cells = set()
        for y, x0, x1 in spans:
            for x in range(x0, x1 + 1):
                if 0 <= x < self.w and 0 <= y < self.h:
                    cells.add((x, y))
        if seat:
            # A hard line where this plate sits over the last one. Without it
            # two plates in the same tone read as one slab.
            for (x, y) in sorted(cells):
                if (x, y - 1) not in cells and self.at(x, y - 1) not in ('.', 'o'):
                    self.put(x, y - 1, 's')
        for (x, y) in cells:
            top = (x, y - 1) not in cells
            bottom = (x, y + 1) not in cells
            left = (x - 1, y) not in cells
            right = (x + 1, y) not in cells
            c = body
            if top or left:
                c = lit
            if bottom or right:
                c = shade
            if top and not (bottom or right):
                c = lit
            self.put(x, y, c)

    def trim(self, spans, c='A'):
        for y, x0, x1 in spans:
            self.span(y, x0, x1, c)

    def rivets(self, points, c='l'):
        for x, y in points:
            self.put(x, y, c)

    # -- output -------------------------------------------------------------
    def outline(self, window=None):
        out = [row[:] for row in self.g]
        for y in range(self.h):
            for x in range(self.w):
                if self.g[y][x] != '.':
                    continue
                if window and window[0] <= x <= window[1] and window[2] <= y <= window[3]:
                    continue
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < self.h and 0 <= nx < self.w and self.g[ny][nx] not in ('.', 'o'):
                        out[y][x] = 'o'
                        break
        self.g = out
        return self

    def emit(self, name, fn):
        rows = {y: ''.join(r) for y, r in enumerate(self.g) if ''.join(r).strip('.')}
        body = ', '.join(f"{y}: '{s}'" for y, s in rows.items())
        return f"  {name}: {fn}({{ {body} }}),"


# ===========================================================================
# The male build: 32 x 59. Face at rows 14-25 once the hair is masked off,
# shoulders 28-35, torso 32-45, arms 3-8 and 24-29, legs split at row 47,
# feet 51-58.
# ===========================================================================

def male_helm():
    p = Piece(MALE)
    # Plume, then the dome, then the brow, then the cheeks — in that order so
    # each seats on the one before.
    p.plate([(y, 15, 17) for y in range(3, 8)], lit='A', body='A', shade='d', seat=False)
    dome = [(8, 12, 20), (9, 10, 22), (10, 9, 23), (11, 8, 24), (12, 7, 25)]
    dome += [(y, 7, 25) for y in range(13, 18)]
    p.plate(dome)
    # The crown of the dome takes the accent, which in every set is the
    # brightest value in the ramp. This is what the icons do and what the worn
    # art was missing: steel that gleams rather than steel that is one colour.
    for y, x0, x1 in ((9, 12, 18), (10, 11, 17), (11, 10, 15), (12, 9, 13)):
        p.span(y, x0, x1, 'A')
    p.span(13, 9, 11, 'l')
    p.trim([(17, 7, 25)])
    p.rivets([(9, 14), (23, 14), (9, 12), (23, 12)])
    # Cheek guards down either side of the face. Wide enough to take in the
    # ears: a helmet that leaves them out in the cold reads as a hat.
    p.plate([(y, 4, 10) for y in range(18, 25)] + [(25, 6, 10)])
    p.plate([(y, 22, 28) for y in range(18, 25)] + [(25, 22, 26)])
    # The nasal, and a gorget under the chin.
    p.plate([(y, 15, 17) for y in range(18, 23)])
    p.plate([(25, 10, 22), (26, 11, 21), (27, 12, 20)])
    p.trim([(26, 14, 18)])
    return p.outline((11, 21, 18, 24))


def male_chest():
    p = Piece(MALE)
    # Pauldrons first, off to the sides, so nothing else seats on top of them.
    # Pauldrons: a domed cap over two lames, rolled at the edge. Square blocks
    # on the shoulders are the fastest way to make plate look like a costume.
    for x0, x1 in ((2, 9), (22, 29)):
        p.plate([(27, x0 + 3, x1 - 3), (28, x0 + 1, x1 - 1)] + [(y, x0, x1) for y in range(29, 33)], seat=False)
        p.span(28, x0 + 2, x1 - 2, 'A')
        p.span(29, x0 + 1, x1 - 3, 'A')
        p.plate([(33, x0, x1), (34, x0 + 1, x1 - 1)])
        p.plate([(35, x0 + 1, x1 - 1), (36, x0 + 2, x1 - 2)])
        p.span(33, x0 + 1, x1 - 2, 'A')

    # The gorget rim, then the breastplate under it.
    p.plate([(28, 10, 21), (29, 9, 22)], seat=False)
    p.plate([(y, 8, 23) for y in range(30, 38)], seat=False)
    p.trim([(30, 9, 22)])

    # The keel down the middle, and a pectoral either side of it: lit on the
    # left, in shadow on the right, which is what stops a breastplate reading
    # as a rectangle.
    for y in range(31, 38):
        p.put(15, y, 'l')
        p.put(16, y, 'd')
    for y, x0, x1 in ((32, 10, 14), (33, 9, 14), (34, 10, 14)):
        p.span(y, x0, x1, 'A')
    for y, x0, x1 in ((32, 17, 21), (33, 17, 22), (34, 17, 21)):
        p.span(y, x0, x1, 'm')
    p.span(35, 10, 14, 's')
    p.span(35, 17, 21, 's')
    p.put(8, 33, 'd')
    p.put(23, 33, 'd')

    # Fauld: three bands of steel over the waist, each seated on the last.
    p.plate([(38, 9, 22), (39, 9, 22)])
    p.plate([(40, 9, 22), (41, 9, 22)])
    p.plate([(42, 10, 21), (43, 10, 21)])
    p.trim([(42, 14, 17), (43, 10, 21)])
    return p.outline()


def male_gloves():
    p = Piece(MALE)
    for x0, x1 in ((2, 7), (24, 29)):
        p.plate([(y, x0 + 1, x1 - 1) for y in range(37, 40)])   # the vambrace
        p.plate([(y, x0, x1) for y in range(40, 44)])           # the cuff
        p.plate([(44, x0 + 1, x1 - 1)])                          # the knuckles
        p.trim([(41, x0 + 1, x1 - 1)])
        p.span(40, x0 + 1, x1 - 1, 'A')
    return p.outline()


def male_legs():
    p = Piece(MALE)
    # Cuisses over the hips, then a greave down each leg.
    p.plate([(44, 8, 23), (45, 8, 23)])
    p.plate([(46, 8, 23)])
    for x0, x1 in ((8, 15), (16, 23)):
        p.plate([(y, x0, x1) for y in range(47, 51)])
        p.plate([(y, x0, x1) for y in range(51, 54)])
        p.trim([(51, x0 + 1, x1 - 1)])
    # The knee cops, which is where a leg harness gets its shape.
    p.plate([(49, 9, 14), (50, 10, 13)], lit='A', body='A', shade='m')
    p.plate([(49, 17, 22), (50, 18, 21)], lit='A', body='A', shade='m')
    return p.outline()


def male_boots():
    p = Piece(MALE)
    for x0, x1 in ((8, 14), (17, 23)):
        p.plate([(y, x0, x1) for y in range(53, 56)])
    # Sabatons: the foot spreads forward and comes to a point.
    p.plate([(55, 7, 14), (56, 6, 14), (57, 6, 13)])
    p.plate([(55, 18, 25), (56, 18, 26), (57, 19, 26)])
    p.span(55, 8, 13, 'A')
    p.span(55, 19, 24, 'A')
    p.trim([(53, 9, 13), (53, 18, 22)])
    return p.outline()


def male_shield():
    p = Piece(MALE)
    # A heater shield: square at the top, tapering to a point.
    top = [(y, 0, 8) for y in range(28, 39)]
    taper = [(39, 0, 8), (40, 1, 7), (41, 2, 6), (42, 3, 5), (43, 4, 4)]
    p.plate(top + taper)
    p.trim([(28, 0, 8), (29, 0, 8)])
    # A boss, and a stripe down the face.
    p.plate([(32, 2, 6), (33, 1, 7), (34, 1, 7), (35, 2, 6)], lit='A', body='A', shade='d')
    for y in range(30, 40):
        p.put(4, y, 'l')
    return p.outline()


# ===========================================================================
# The female build: 30 x 65. Narrower and a head taller. Face at rows 15-26
# once the hair is masked, shoulders 28-33, torso 30-43, arms 5-9 and 22-28,
# legs split at row 46, feet 56-64.
# ===========================================================================

def female_helm():
    p = Piece(FEMALE)
    p.plate([(y, 14, 16) for y in range(4, 9)], lit='A', body='A', shade='d', seat=False)
    dome = [(9, 12, 19), (10, 10, 21), (11, 9, 22), (12, 8, 23)]
    dome += [(y, 8, 23) for y in range(13, 19)]
    p.plate(dome)
    for y, x0, x1 in ((10, 11, 17), (11, 10, 16), (12, 9, 14), (13, 9, 12)):
        p.span(y, x0, x1, 'A')
    p.span(14, 9, 11, 'l')
    p.trim([(18, 8, 23)])
    p.rivets([(10, 15), (21, 15), (10, 13), (21, 13)])
    p.plate([(y, 6, 10) for y in range(19, 26)] + [(26, 8, 10)])
    p.plate([(y, 21, 25) for y in range(19, 26)] + [(26, 21, 23)])
    p.plate([(y, 15, 16) for y in range(19, 24)])
    p.plate([(26, 11, 20), (27, 12, 19), (28, 13, 18)])
    p.trim([(27, 14, 17)])
    return p.outline((11, 20, 19, 25))


def female_chest():
    p = Piece(FEMALE)
    for x0, x1 in ((5, 10), (21, 26)):
        p.plate([(27, x0 + 2, x1 - 2), (28, x0 + 1, x1 - 1)] + [(y, x0, x1) for y in range(29, 33)], seat=False)
        p.span(28, x0 + 2, x1 - 2, 'A')
        p.span(29, x0 + 1, x1 - 2, 'A')
        p.plate([(33, x0, x1), (34, x0 + 1, x1 - 1)])
        p.plate([(35, x0 + 1, x1 - 1), (36, x0 + 2, x1 - 2)])
        p.span(33, x0 + 1, x1 - 2, 'A')

    p.plate([(28, 11, 20), (29, 10, 21)], seat=False)
    p.plate([(y, 10, 21) for y in range(30, 34)] + [(y, 11, 20) for y in range(34, 39)], seat=False)
    p.trim([(30, 11, 20)])
    for y in range(31, 39):
        p.put(15, y, 'l')
        p.put(16, y, 'd')
    for y, x0, x1 in ((32, 11, 14), (33, 11, 14), (34, 12, 14)):
        p.span(y, x0, x1, 'A')
    for y, x0, x1 in ((32, 17, 20), (33, 17, 20), (34, 17, 19)):
        p.span(y, x0, x1, 'm')
    p.span(35, 12, 14, 's')
    p.span(35, 17, 19, 's')

    # Vambraces, since her arms are bare between pauldron and gauntlet.
    for x0, x1 in ((6, 9), (22, 25)):
        p.plate([(y, x0, x1) for y in range(37, 42)])
    # Fauld.
    p.plate([(39, 11, 20), (40, 11, 20)])
    p.plate([(41, 11, 20), (42, 11, 20)])
    p.trim([(41, 14, 17), (42, 11, 20)])
    return p.outline()


def female_gloves():
    p = Piece(FEMALE)
    for x0, x1 in ((3, 8), (23, 28)):
        p.plate([(y, x0 + 1, x1 - 1) for y in range(42, 44)])
        p.plate([(y, x0, x1) for y in range(44, 48)])
        p.plate([(48, x0 + 1, x1 - 1)])
        p.trim([(45, x0 + 1, x1 - 1)])
        p.span(44, x0 + 1, x1 - 1, 'A')
    return p.outline()


def female_legs():
    p = Piece(FEMALE)
    p.plate([(43, 9, 22), (44, 9, 22)])
    p.plate([(45, 9, 22)])
    for x0, x1 in ((9, 15), (17, 23)):
        p.plate([(y, x0, x1) for y in range(46, 51)])
        p.plate([(y, x0, x1) for y in range(51, 55)])
        p.trim([(51, x0 + 1, x1 - 1)])
    p.plate([(48, 10, 14), (49, 11, 13)], lit='A', body='A', shade='m')
    p.plate([(48, 18, 22), (49, 19, 21)], lit='A', body='A', shade='m')
    return p.outline()


def female_boots():
    p = Piece(FEMALE)
    for x0, x1 in ((9, 14), (18, 23)):
        p.plate([(y, x0, x1) for y in range(55, 58)])
    p.plate([(58, 8, 14), (59, 8, 14), (60, 7, 14), (61, 7, 14), (62, 7, 15), (63, 7, 14)])
    p.plate([(58, 18, 23), (59, 18, 23), (60, 18, 24), (61, 18, 25), (62, 18, 26), (63, 19, 26)])
    p.span(58, 9, 13, 'A')
    p.span(58, 19, 23, 'A')
    p.trim([(55, 10, 13), (55, 19, 22)])
    return p.outline()


def female_shield():
    p = Piece(FEMALE)
    top = [(y, 0, 7) for y in range(31, 42)]
    taper = [(42, 0, 7), (43, 1, 6), (44, 2, 5), (45, 3, 4)]
    p.plate(top + taper)
    p.trim([(31, 0, 7), (32, 0, 7)])
    p.plate([(35, 2, 5), (36, 1, 6), (37, 1, 6), (38, 2, 5)], lit='A', body='A', shade='d')
    for y in range(33, 43):
        p.put(3, y, 'l')
    return p.outline()


PIECES = ['helm', 'chest', 'legs', 'gloves', 'boots', 'shield']

if __name__ == '__main__':
    print('MALE')
    for n in PIECES:
        print(globals()['male_' + n]().emit(n, 'worn'))
    print('FEMALE')
    for n in PIECES:
        print(globals()['female_' + n]().emit(n, 'wornF'))
