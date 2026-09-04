"""Draw the worn armour for both builds, at four levels of ambition.

The problem this replaces: five sets shared one silhouette and differed only by
palette, so leather and legendary were the same knight in two colours — a whole
campaign of grinding with nothing to see at the end of it.

Now the shape escalates, and shape is what reads first at this size:

    rough   leather   a stitched cap and a laced jerkin. A face, visible.
    plate   iron      a full harness: combed helm, layered pauldrons, a
                      ridged cuirass over articulated lames.
    spiked  bone      that harness grown horns — off the helm, off the
            verdant   shoulders, off the knuckles and the knees.
    regal   gilded    a crowned, sealed helm with light where the eyes were,
                      pauldrons that throw four blades past the silhouette,
                      and a core burning through the breastplate.

Only the last tier takes the face away. That is the point of it: at the end of
the road the character stops being a person in armour and becomes the armour.

Every piece is a MASK first — a set of cells, built from arcs, tapers and
triangles rather than rectangles, so the outline curves and the spikes come to
a point. The mask is then lit automatically: the top and left faces catch the
light, the bottom and right fall away, and each piece lays its own outline down
outside itself, so a pauldron stacked on a cuirass reads as two objects rather
than one blob. Palette keys are the set ramp the icons already use:

    o outline · s deep shadow · d dark · m mid · l light · A trim · E emissive
"""

import math

# Every piece is drawn at twice the frame's logical resolution.
#
# The anchors below, and every number in the piece functions, stay in the
# character's own coordinates — the ones that line up with the hero art. The
# primitives rasterise into a grid twice that size, sampling curves at the finer
# pitch as they go. So an arc is computed at double the resolution rather than
# doubled after the fact: a pauldron's edge comes out as a curve instead of four
# steps, a spike comes to an actual point, and trim can be a line rather than a
# bar. Straight edges simply double and lose nothing.
S = 2

# --------------------------------------------------------------------- frames

# Where the body is on each build. Both frames carry six blank columns either
# side: the character never fills them, the armour does. A spike with nowhere to
# go is a bump, and the whole difference between the first set and the last one
# is how far past the silhouette the last one reaches.
MALE = dict(
    w=44, h=59, cx=22,
    dome_top=6, brow=17, dome_hw=11,
    face_rows=(18, 24), eye_rows=(19, 21),
    eyes=((16, 19), (25, 28)), cheek=((11, 15), (29, 33)),
    neck_rows=(25, 27), neck=(18, 26),
    shoulder_row=29, sh_l=(5, 15), sh_r=(29, 39),
    torso_rows=(29, 40), torso=(13, 31), waist=(15, 29),
    fauld_rows=(41, 44), fauld=(14, 30),
    arm_l=(8, 14), arm_r=(30, 36), arm_rows=(39, 45),
    leg_rows=(46, 52), leg_l=(13, 21), leg_r=(23, 31), knee=49,
    boot_rows=(54, 58), boot_l=(12, 21), boot_r=(23, 32),
)

FEMALE = dict(
    w=42, h=65, cx=20,
    dome_top=5, brow=17, dome_hw=10,
    face_rows=(18, 24), eye_rows=(19, 22),
    eyes=((15, 18), (23, 26)), cheek=((9, 13), (27, 31)),
    neck_rows=(25, 27), neck=(16, 24),
    shoulder_row=29, sh_l=(4, 14), sh_r=(26, 36),
    torso_rows=(29, 41), torso=(11, 30), waist=(13, 28),
    fauld_rows=(42, 46), fauld=(12, 29),
    arm_l=(7, 14), arm_r=(26, 33), arm_rows=(39, 48),
    leg_rows=(48, 55), leg_l=(12, 19), leg_r=(21, 29), knee=52,
    boot_rows=(57, 64), boot_l=(11, 19), boot_r=(21, 29),
)

# ------------------------------------------------------------------- profiles

PROFILES = ('rough', 'plate', 'spiked', 'regal')

SET_PROFILE = {
    'leather': 'rough',
    'iron': 'plate',
    'bone': 'spiked',
    'verdant': 'spiked',
    'gilded': 'regal',
}


# ---------------------------------------------------------------------- canvas

class Layer:
    """One object: a mask of cells that gets lit as a single solid."""

    def __init__(self, frame):
        self.f = frame
        self.cells = set()

    # -- primitives ---------------------------------------------------------
    # All of these take logical coordinates and fill scaled cells. Anything with
    # a curve iterates over the scaled rows so the curve is sampled at the finer
    # pitch; anything straight just covers the S cells it maps onto.

    def srow(self, sy, x0, x1):
        """One scaled row, from float logical x to float logical x."""
        if sy < 0 or sy >= self.f['h'] * S:
            return
        a = max(0, round(x0 * S))
        b = min(self.f['w'] * S - 1, round(x1 * S) + S - 1)
        for sx in range(a, b + 1):
            self.cells.add((sx, sy))

    def srows(self, y0, y1):
        """The scaled rows covering logical rows y0..y1, and their logical y."""
        for sy in range(round(y0 * S), round(y1 * S) + S):
            yield sy, sy / S

    def span(self, y, x0, x1):
        for sy, _ in self.srows(y, y):
            self.srow(sy, x0, x1)

    def rect(self, y0, y1, x0, x1):
        for sy, _ in self.srows(y0, y1):
            self.srow(sy, x0, x1)

    def taper(self, y0, y1, top, bottom):
        """A trapezoid: (l, r) at the top easing to (l, r) at the bottom."""
        rows = max(1, y1 - y0)
        for sy, y in self.srows(y0, y1):
            t = min(1.0, max(0.0, (y - y0) / rows))
            self.srow(sy, top[0] + (bottom[0] - top[0]) * t, top[1] + (bottom[1] - top[1]) * t)

    def dome(self, y_top, y_bottom, cx, hw, flat=1.05):
        """An arc — the top of a helm, the cap of a pauldron."""
        h = max(1, y_bottom - y_top)
        for sy, y in self.srows(y_top, y_bottom):
            t = (y_bottom - y) / (h * flat)
            w = max(0.5, hw * math.sqrt(max(0.0, 1 - t * t)))
            self.srow(sy, cx - w, cx + w)

    def bowl(self, y_top, y_bottom, cx, hw, flat=1.05):
        """The same arc upside down — the skirt of a pauldron, a shield foot."""
        h = max(1, y_bottom - y_top)
        for sy, y in self.srows(y_top, y_bottom):
            t = (y - y_top) / (h * flat)
            w = max(0.5, hw * math.sqrt(max(0.0, 1 - t * t)))
            self.srow(sy, cx - w, cx + w)

    def lens(self, y_top, y_bottom, cx, hw, fat=0.55):
        """Narrow, wide, narrow — a shoulder cap seen from the front."""
        n = y_bottom - y_top + 1
        for sy, y in self.srows(y_top, y_bottom):
            i = y - y_top
            w = max(0.5, hw * math.sin(math.pi * (i + 0.6) / (n + 0.2)) ** fat)
            self.srow(sy, cx - w, cx + w)

    def spike(self, x, y, length, dx=0.0, base=3, up=True):
        """A blade from a base of `base` cells narrowing to a point."""
        step = -1 if up else 1
        for j in range(length * S):
            i = j / S
            t = i / max(1, length - 1)
            w = max(0.0 if t > 0.86 else 0.4, (base / 2) * (1 - t))
            cx = x + dx * i
            self.srow(round((y + step * i) * S), cx - w, cx + w)

    def diamond(self, cx, cy, rx, ry):
        for sy, y in self.srows(cy - ry, cy + ry):
            w = rx * (1 - abs(y - cy) / (ry + 0.4))
            if w > 0:
                self.srow(sy, cx - w, cx + w)

    def blob(self, cx, cy, rx, ry):
        for sy, y in self.srows(cy - ry, cy + ry):
            t = (y - cy) / max(1, ry)
            w = rx * math.sqrt(max(0.0, 1 - t * t))
            if w > 0:
                self.srow(sy, cx - w, cx + w)

    def cut(self, y0, y1, x0, x1):
        for sy in range(round(y0 * S), round(y1 * S) + S):
            for sx in range(round(x0 * S), round(x1 * S) + S):
                self.cells.discard((sx, sy))

    def mirror(self):
        """Reflect everything about the frame centre — draw one side, get two."""
        cx2 = self.f['cx'] * 2 * S + S - 1
        for (x, y) in list(self.cells):
            self.cells.add((cx2 - x, y))


class Piece:
    """A stack of lit layers plus the decoration painted over the top."""

    def __init__(self, frame):
        self.f = frame
        self.px = {}
        self.reach = set()

    def layer(self):
        return Layer(self.f)

    def draw(self, layer, shade=True, outline=True):
        """Light one solid and lay it into the piece, outline and all."""
        m = layer.cells
        if not m:
            return
        if outline:
            for (x, y) in m:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, 1), (1, -1), (-1, -1)):
                    n = (x + dx, y + dy)
                    if n not in m and 0 <= n[0] < self.f['w'] * S and 0 <= n[1] < self.f['h'] * S:
                        self.px[n] = 'o'
        for (x, y) in m:
            self.px[(x, y)] = self.tone(m, x, y) if shade else 'm'
        self.reach |= m

    def tone(self, m, x, y):
        """Light from the top left. Distance to each edge decides the tone, so a
        thin lame ramps light-to-dark and a thick plate keeps a mid interior."""
        def run(dx, dy):
            n = 0
            while n < 3 * S and (x + dx * (n + 1), y + dy * (n + 1)) in m:
                n += 1
            return n
        dn, rt, up, lf = run(0, 1), run(1, 0), run(0, -1), run(-1, 0)
        if dn == 0:
            return 's'
        if dn == 1 or rt == 0:
            return 'd'
        if up == 0 or lf == 0:
            return 'l'
        return 'm'

    # -- decoration ---------------------------------------------------------

    def paint(self, cells, key, only_on=True):
        """Logical cells in, scaled cells out — one logical pixel of trim is S
        across, which keeps a gold line reading as a line at the new pitch."""
        for (x, y) in cells:
            for sy in range(round(y * S), round(y * S) + S):
                for sx in range(round(x * S), round(x * S) + S):
                    if not (0 <= sx < self.f['w'] * S and 0 <= sy < self.f['h'] * S):
                        continue
                    if only_on and (sx, sy) not in self.reach:
                        continue
                    self.px[(sx, sy)] = key

    def line(self, y, x0, x1, key, only_on=True):
        self.paint([(x, y) for x in range(x0, x1 + 1)], key, only_on)

    def col(self, x, y0, y1, key, only_on=True):
        self.paint([(x, y) for y in range(y0, y1 + 1)], key, only_on)

    def box(self, y0, y1, x0, x1, key, only_on=True):
        self.paint([(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)], key, only_on)

    def stud(self, x, y, key='A'):
        self.paint([(x, y)], key)

    def gem(self, cx, cy, rx, ry, core):
        """Facet a boss from the middle out — the auto-lighting rounds a diamond
        into an egg, and an egg on a breastplate reads as a belly."""
        for y in range(cy - ry, cy + ry + 1):
            for x in range(cx - rx, cx + rx + 1):
                if (x, y) not in self.reach:
                    continue
                t = abs(x - cx) / rx + abs(y - cy) / ry
                self.px[(x, y)] = core if t < 0.4 else 'l' if t < 0.75 else 'm' if t < 1.05 else 'd'

    def sparkle(self, spots):
        for (x, y) in spots:
            if 0 <= x < self.f['w'] and 0 <= y < self.f['h'] and (x, y) not in self.reach:
                self.px[(x, y)] = 'E'

    # -- output -------------------------------------------------------------

    def emit(self):
        rows = {}
        for y in range(self.f['h'] * S):
            line = ''.join(self.px.get((x, y), '.') for x in range(self.f['w'] * S))
            if line.strip('.'):
                rows[y] = line
        return rows


# ----------------------------------------------------------------- the pieces
# Each of these draws one slot at one tier. The geometry is shared and the
# profile decides how far it goes, so iron and gilded are recognisably the same
# harness — one of them has just been to the end of the game.
#
# Two rules keep these readable at 44 pixels: a piece is ONE solid wherever it
# can be (articulation is a seam painted into it, not a second outlined object,
# or the whole figure turns into stripes), and trim is spent on three or four
# edges rather than every edge it could reach.


def helm(f, pr):
    p = Piece(f)
    cx, hw, brow = f['cx'], f['dome_hw'], f['brow']
    (ec0, ec1), (ec2, ec3) = f['cheek']
    fr0, fr1 = f['face_rows']
    g1 = f['neck_rows'][1]
    nl, nr = f['neck']

    if pr == 'rough':
        cap = p.layer()
        cap.dome(brow - 11, brow - 2, cx, hw - 1, flat=1.25)
        cap.rect(brow - 1, brow, cx - hw, cx + hw)
        p.draw(cap)
        p.line(brow - 1, cx - hw + 1, cx + hw - 1, 's')
        for i in range(4):
            p.line(brow - 8 + i, cx - 7 + i, cx - 4 + i, 'l')
        for x in range(cx - hw + 2, cx + hw - 1, 4):
            p.stud(x, brow, 'd')
        return p.emit()

    # A real harness: domed skull, comb, brow band, gorget closing the neck.
    skull = p.layer()
    skull.dome(brow - 11, brow - 2, cx, hw - 1)
    skull.rect(brow - 1, brow, cx - hw, cx + hw)
    if pr == 'regal':
        skull.taper(brow + 1, fr1 + 1, (ec0 - 1, ec3 + 1), (ec0 + 6, ec3 - 6))
    else:
        skull.taper(brow + 1, fr1 + 1, (ec0 - 1, ec3 + 1), (ec0 + 3, ec3 - 3))
        skull.cut(fr0, fr0 + 3, ec1 + 1, ec2 - 1)      # a slot, not an open face
        skull.rect(brow, fr1, cx - 1, cx + 1)          # nasal splitting the slot
    skull.taper(fr1 + 1, g1, (nl - 1, nr + 1), (nl + 2, nr - 2))
    p.draw(skull)

    comb = p.layer()
    if pr == 'regal':
        comb.spike(cx, brow - 8, 9, 0, base=5)
        comb.spike(cx - 5, brow - 8, 6, -0.25, base=4)
        comb.spike(cx + 5, brow - 8, 6, 0.25, base=4)
        comb.spike(cx - 9, brow - 6, 5, -0.55, base=4)
        comb.spike(cx + 9, brow - 6, 5, 0.55, base=4)
        comb.spike(cx - hw, brow - 4, 11, -0.95, base=6)
        comb.spike(cx + hw, brow - 4, 11, 0.95, base=6)
    elif pr == 'spiked':
        comb.taper(brow - 14, brow - 9, (cx - 1, cx + 1), (cx - 3, cx + 3))
        comb.spike(cx - hw + 1, brow - 6, 10, -0.9, base=6)
        comb.spike(cx + hw - 1, brow - 6, 10, 0.9, base=6)
    else:
        comb.taper(brow - 13, brow - 9, (cx - 1, cx + 1), (cx - 3, cx + 3))
    p.draw(comb)

    # Shading the skull by hand — the auto-lighting rounds a dome, but a helm
    # wants one bright temple and a shadow under the brow to read as metal.
    for i in range(4):                                 # raked highlight
        p.line(brow - 9 + i, cx - 9 + i, cx - 6 + i, 'l')
    p.line(brow - 1, cx - hw + 1, cx + hw - 1, 's')
    p.line(brow, cx - hw + 1, cx + hw - 1, 'A')
    p.line(fr1 + 1, nl, nr, 'A')
    p.line(g1, nl + 1, nr - 1, 's')

    if pr == 'regal':
        p.col(cx, brow + 1, fr1, 'l')
        p.col(cx + 1, brow + 1, fr1, 'd')
        for (a, b) in f['eyes']:
            p.line(f['eye_rows'][0] - 1, a - 1, b + 1, 's')
            p.box(f['eye_rows'][0], f['eye_rows'][1], a, b, 'E')
            p.line(f['eye_rows'][1] + 1, a - 1, b + 1, 's')
        for i in range(4):
            p.paint([(ec0 + 4 + i, fr1 - i), (ec3 - 4 - i, fr1 - i)], 'd')
            p.paint([(ec0 + 5 + i, fr1 - i), (ec3 - 5 - i, fr1 - i)], 's')
        p.stud(cx, brow - 2, 'E')
        p.stud(cx - 4, brow, 'E')
        p.stud(cx + 4, brow, 'E')
        p.sparkle([(cx - hw - 6, brow - 12), (cx + hw + 5, brow - 8), (cx - hw - 4, brow + 4)])
    else:
        p.col(cx, brow + 1, fr1, 'l')
        p.col(cx + 1, brow + 1, fr1, 'd')
        p.line(fr0 + 4, ec0 + 3, ec3 - 3, 'd')       # the mouth of the bevor
        p.line(fr0 + 5, ec0 + 4, ec3 - 4, 'l')
        if pr == 'spiked':
            p.stud(cx, brow - 2, 'A')
    return p.emit()


def _pauldron(p, f, pr, side):
    """One shoulder: a single domed solid, seamed into lames, then whatever the
    tier hangs off its outer edge."""
    lo, hi = f['sh_l'] if side < 0 else f['sh_r']
    cx = (lo + hi) // 2
    top = f['shoulder_row']
    hw = (hi - lo) // 2
    if pr == 'rough':
        pad = p.layer()
        pad.lens(top, top + 8, cx, hw, fat=0.8)
        p.draw(pad)
        p.line(top + 4, cx - hw + 2, cx + hw - 2, 's')
        return

    reach = hw
    # A cap, not a disc. A lens closes into a circle, and at the finer pitch the
    # outline round the inner edge turned both shoulders into wheels bolted to
    # the side of the chest. Domed on top, straight down the sides, and reaching
    # far enough inboard that it reads as sitting on the cuirass.
    cap = p.layer()
    cap.dome(top, top + 3, cx, reach, flat=1.5)
    cap.taper(top + 3, top + 9, (cx - reach, cx + reach), (cx - reach + 1, cx + reach - 1))
    p.draw(cap)
    p.line(top + 1, cx - reach + 2, cx + reach - 2, 'A')
    for y in (top + 3, top + 6):
        p.line(y, cx - reach + 2, cx + reach - 2, 's')
        p.line(y + 1, cx - reach + 2, cx + reach - 2, 'l')

    # A fan, raked back and up. The tips are angled to land just inside the
    # frame on both builds — a blade that runs off the edge reads as a mistake.
    if pr == 'spiked':
        blades = ((top + 1, 9, 0.32, 3), (top + 3, 10, 0.52, 3), (top + 5, 8, 0.68, 3))
    elif pr == 'regal':
        blades = ((top, 11, 0.30, 3), (top + 3, 13, 0.48, 3), (top + 6, 11, 0.64, 3), (top + 9, 8, 0.78, 3))
    else:
        return
    edge = p.layer()
    for (y, length, rake, base) in blades:
        edge.spike(cx + side * (reach - 1), y, length, side * rake, base=base)
    p.draw(edge)


def chest(f, pr):
    p = Piece(f)
    cx = f['cx']
    t0, t1 = f['torso_rows']
    tl, tr = f['torso']
    wl, wr = f['waist']
    f0, f1 = f['fauld_rows']
    fl, fr = f['fauld']

    # Cuirass and fauld are one object — a skirt that floats off the breastplate
    # is what made the last pass read as a stack of boxes.
    body = p.layer()
    body.taper(t0, t1, (tl + 1, tr - 1), (wl, wr))
    body.taper(f0, f1, (wl, wr), (fl, fr))
    if pr == 'rough':
        body.rect(t0, t0 + 1, cx - 6, cx + 6)
    else:
        body.rect(t0, t0 + 1, tl + 2, tr - 2)
        for i in range(3):                                # a collar for the gorget
            body.cut(t0, t0 + i, cx - 4 + i * 2, cx + 4 - i * 2)
    p.draw(body)

    if pr == 'rough':
        p.line(t0 + 1, tl + 2, tr - 2, 's')
        for y in range(t0 + 4, t1 - 2, 3):                # front lacing
            p.col(cx, y, y + 1, 's')
            p.stud(cx - 3, y, 'd')
            p.stud(cx + 3, y, 'd')
        p.line(t1 - 1, wl, wr, 's')                       # belt
        p.line(t1, wl, wr, 'd')
        p.box(t1 - 1, t1, cx - 1, cx + 1, 'l')
        p.line(f0 + 2, fl + 1, fr - 1, 's')
    else:
        p.col(cx, t0 + 4, t1 - 1, 'l')                    # centre ridge
        p.col(cx + 1, t0 + 4, t1 - 1, 'd')
        for i in range(4):                                # trim down the V
            p.paint([(cx - 5 + i, t0 + i), (cx + 5 - i, t0 + i)], 'A')
        p.line(t1, wl + 1, wr - 1, 'A')                   # hem of the cuirass
        lames = 3 if f1 - f0 >= 5 else 2                  # one seam in a short fauld
        for k in range(1, lames):
            p.line(f0 + round((f1 - f0) * k / lames), fl, fr, 's')
        p.line(f1, fl, fr, 'A')
        for x in (tl + 3, tr - 3):
            p.stud(x, t0 + 5, 'A')
            p.stud(x, t1 - 4, 'A')

    if pr in ('spiked', 'regal'):
        boss = p.layer()
        mid = (t0 + t1) // 2 + 1
        boss.diamond(cx, mid, 4, 4)
        p.draw(boss)
        p.gem(cx, mid, 4, 4, 'E' if pr == 'regal' else 'A')
    if pr == 'regal':
        for x in (wl + 1, wr - 1):
            p.col(x, t0 + 5, t1 - 2, 'A')
        p.stud(wl + 1, t0 + 7, 'E')
        p.stud(wr - 1, t0 + 7, 'E')

    _pauldron(p, f, pr, -1)
    _pauldron(p, f, pr, +1)
    if pr == 'regal':
        p.sparkle([(2, t0 + 1), (f['w'] - 3, t0 + 5), (1, t1 - 3), (f['w'] - 2, t1 - 7), (cx - 13, f1 + 1)])
    return p.emit()


def legs(f, pr):
    p = Piece(f)
    y0, y1 = f['leg_rows']
    knee = f['knee']
    for (lo, hi) in (f['leg_l'], f['leg_r']):
        mid = (lo + hi) // 2
        leg = p.layer()
        leg.taper(y0, knee - 2, (lo, hi), (lo + 1, hi - 1))
        leg.blob(mid, knee, (hi - lo) // 2 + (1 if pr != 'rough' else 0), 2)
        leg.taper(knee + 2, y1, (lo + 1, hi - 1), (lo + 1, hi - 1))
        p.draw(leg)
        if pr == 'rough':
            p.line(knee - 2, lo + 1, hi - 1, 's')
            p.line(knee + 2, lo + 2, hi - 2, 's')
        else:
            p.line(y0, lo + 1, hi - 1, 'A')
            p.line(knee - 2, lo + 1, hi - 1, 's')
            p.line(knee + 2, lo + 2, hi - 2, 'A')
            p.col(mid, y0 + 1, knee - 3, 'l')
        if pr == 'spiked':
            s = p.layer()
            s.spike(mid, knee - 3, 5, 0, base=4)
            p.draw(s)
        if pr == 'regal':
            p.stud(mid, knee, 'E')
            p.stud(mid, knee - 1, 'A')
            p.col(mid, knee + 3, y1 - 1, 'l')
    return p.emit()


def boots(f, pr):
    p = Piece(f)
    y0, y1 = f['boot_rows']
    for i, (lo, hi) in enumerate((f['boot_l'], f['boot_r'])):
        side = -1 if i == 0 else 1
        toe = lo if side < 0 else hi
        ankle = y0 + 2
        boot = p.layer()
        boot.taper(y0, ankle - 1, (lo + 2, hi - 2), (lo + 1, hi - 1))
        boot.taper(ankle, y1 - 1, (lo + 1, hi - 1), (lo, hi))
        boot.span(y1, lo, hi)
        p.draw(boot)
        if pr == 'rough':
            p.line(y0 + 1, lo + 2, hi - 2, 's')
            p.line(y1, lo + 1, hi - 1, 's')
        else:
            p.line(y0, lo + 2, hi - 2, 'A')
            p.line(ankle, lo + 1, hi - 1, 's')
            p.line(ankle + 1, lo + 1, hi - 1, 'l')
            p.line(y1, lo + 1, hi - 1, 'A')
        if pr == 'spiked':
            s = p.layer()
            s.spike(toe, y1 - 1, 5, side * 0.8, base=3, up=False)
            p.draw(s)
        if pr == 'regal':
            fin = p.layer()
            fin.spike(toe, ankle, 7, side * 0.75, base=5)
            p.draw(fin)
            p.stud((lo + hi) // 2, y0 + 1, 'E')
    return p.emit()


def gloves(f, pr):
    p = Piece(f)
    top, ar1 = f['arm_rows']
    for i, (lo, hi) in enumerate((f['arm_l'], f['arm_r'])):
        side = -1 if i == 0 else 1
        hand = p.layer()
        if pr == 'regal':
            hand.taper(top, top + 3, (lo + 1, hi - 1), (lo - 2, hi + 2))
        else:
            hand.taper(top, top + 3, (lo + 1, hi - 1), (lo - 1, hi + 1))
        hand.taper(top + 4, ar1, (lo, hi), (lo + 1, hi - 1))
        p.draw(hand)
        if pr == 'rough':
            p.line(top + 2, lo, hi, 's')
        else:
            p.line(top, lo + 1, hi - 1, 'A')
            p.line(top + 3, lo - 1, hi + 1, 's')
        if pr in ('spiked', 'regal'):
            knuck = p.layer()          # a scalloped ridge, not three loose pins
            for k in range(3):
                knuck.spike(lo + 1 + k * 3, ar1 - 4, 3, side * 0.3, base=4)
            p.draw(knuck)
        if pr == 'regal':
            p.stud((lo + hi) // 2, ar1 - 2, 'E')
    return p.emit()


def shield(f, pr):
    p = Piece(f)
    cx, top = 10, f['shoulder_row'] - 1
    if pr == 'rough':
        body = p.layer()
        body.blob(cx, top + 8, 6, 8)
        p.draw(body)
        p.line(top + 8, cx - 4, cx + 4, 's')
        p.box(top + 6, top + 10, cx - 1, cx + 1, 'l')
        p.stud(cx, top + 8, 'd')
        return p.emit()

    body = p.layer()
    body.rect(top, top + 9, cx - 6, cx + 6)
    body.bowl(top + 10, top + 17, cx, 6, flat=1.0)
    p.draw(body)
    p.line(top, cx - 5, cx + 5, 'A')
    p.col(cx, top + 1, top + 14, 'l')
    p.col(cx + 1, top + 1, top + 14, 'd')
    boss = p.layer()
    boss.blob(cx, top + 6, 3, 3)
    p.draw(boss)
    if pr == 'spiked':
        edge = p.layer()
        for y in (top + 2, top + 8, top + 13):
            for s in (-1, 1):
                edge.spike(cx + s * 6, y, 6, s * 0.75, base=5)
        p.draw(edge)
        p.stud(cx, top + 6, 'A')
    elif pr == 'regal':
        edge = p.layer()
        for y in (top + 1, top + 7, top + 12):
            for s in (-1, 1):
                edge.spike(cx + s * 6, y, 8, s * 0.85, base=6)
        p.draw(edge)
        p.box(top + 5, top + 7, cx - 1, cx + 1, 'E')
        p.sparkle([(cx - 10, top + 4), (cx + 10, top + 10)])
    else:
        p.stud(cx, top + 6, 'A')
    return p.emit()


SLOTS = (('helm', helm), ('chest', chest), ('legs', legs), ('gloves', gloves), ('boots', boots), ('shield', shield))


def build(frame):
    return {pr: {name: fn(frame, pr) for name, fn in SLOTS} for pr in PROFILES}


def js(frame, const, helper):
    out = [f'export const {const} = {{']
    table = build(frame)
    for pr in PROFILES:
        out.append(f'  {pr}: {{')
        for name, _ in SLOTS:
            rows = table[pr][name]
            body = ', '.join(f"{y}: '{rows[y]}'" for y in sorted(rows))
            out.append(f'    {name}: {helper}({{ {body} }}),')
        out.append('  },')
    out.append('}')
    return '\n'.join(out)


if __name__ == '__main__':
    import sys
    which = sys.argv[1] if len(sys.argv) > 1 else 'male'
    if which == 'male':
        print(js(MALE, 'WORN_MALE', 'worn'))
    else:
        print(js(FEMALE, 'WORN_FEMALE', 'wornF'))
