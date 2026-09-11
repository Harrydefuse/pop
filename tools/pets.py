"""Redraw the six pets at the size the art needs.

The roster had been drawn twice and both times it came out wrong. The first
pass was one sixteen-pixel template recoloured per creature, so a storm lion
and a puppy were the same blob. The second pass was procedural — discs and
spikes placed by trigonometry — and produced animals that were anatomically
plausible and completely unreadable, which is the "disfigured and cursed" look
the brief called out.

This pass is hand-drawn at 50x44, the canvas the reference dragon already
uses, and it is built on three rules that the earlier attempts broke:

  * Paint spans, not strings. A leg is `(33, 38, 'b')`, never an exercise in
    counting dots, so a shape can be adjusted without re-deriving the row.
  * Derive the outline. Every silhouette gets its one-pixel border for free,
    and limbs that lie over the body get their own border too — a flat
    silhouette in one colour reads as a blob however carefully it is shaped.
  * Look at it. Every creature here was rendered to a PNG and judged at the
    size a player actually sees it, over and over, until it was recognisable
    at 34 pixels wide.

Both hounds share one skeleton for the same reason: PUP came out right by hand
and FROST, drawn from scratch beside it, came out a lollipop on stilts. The
proportions that worked are written down once and varied by palette, ears,
tail and what the animal wears — not re-invented per pet.

DRAKE is not here. It was imported from a reference the player supplied and is
staying exactly as it is.

    python3 tools/pets.py            # contact sheet at tools/pets.png
    python3 tools/pets.py --emit     # the JS literals for src/game/sprites.js
"""

import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from petart import Art, look, emit

# ------------------------------------------------------- the canine skeleton
# PUP came out right by hand, and then FROST — drawn from scratch beside it —
# came out a lollipop on stilts. The proportions that worked are written down
# once here: tail, ears, neck, barrel, four legs, skull, muzzle. Each pet
# varies the palette, the ear length, the bush of the tail and what it wears,
# not the animal underneath.
TAIL = {21:(43,47),20:(44,48),19:(44,48),18:(44,48),17:(44,48),16:(45,48),
        15:(45,48),14:(45,48),13:(45,48),12:(44,48),11:(44,47),10:(43,47),
        9:(43,46),8:(42,46),7:(42,45)}
NECK = {12:(24,26),13:(24,27),14:(25,28),15:(25,29),16:(25,30),17:(25,31),
        18:(24,32),19:(22,33),20:(21,33),21:(20,33),22:(19,33),23:(19,33),
        24:(20,33)}
BODY = {18:(28,39),19:(26,42),20:(24,44),21:(23,45),22:(22,45),23:(21,45),
        24:(21,45),25:(21,45),26:(21,45),27:(21,45),28:(21,45),29:(22,45),
        30:(22,44),31:(23,44),32:(24,43),33:(25,42)}
HEAD = {8:(14,20),9:(12,22),10:(11,23),11:(10,24),12:(9,25),13:(9,25),
        14:(9,26),15:(5,26),16:(4,26),17:(4,26),18:(4,25),19:(5,24),
        20:(7,23),21:(10,22),22:(13,22)}
EAR = {1:(15,15),2:(14,16),3:(14,17),4:(13,17),5:(13,18),6:(12,18),
       7:(12,19),8:(11,19),9:(11,20),10:(12,21)}
INNER = {4:(15,16),5:(15,17),6:(14,17),7:(14,18),8:(13,18),9:(13,19)}


def canine(a, tail_fat=0, ear_lift=0, tail=True, ears=True):
    """Paint the whole animal in 'b', with 'd' far legs and 'c' paws."""
    if tail:
        a.rows({y: [(x0 - tail_fat, x1, 'b')] for y, (x0, x1) in TAIL.items()})
    if ears:
        ear = {y - ear_lift: v for y, v in EAR.items()}
        a.rows({y: [(x0, x1, 'd'), (x0 + 7, x1 + 6, 'd')] for y, (x0, x1) in ear.items()})
        a.rows({y - ear_lift: [(x0, x1, 'l'), (x0 + 7, x1 + 6, 'l')]
                for y, (x0, x1) in INNER.items()})
    for spec in (NECK, BODY):
        a.rows({y: [(x0, x1, 'b')] for y, (x0, x1) in spec.items()})
    a.rows({y: [(22, 26, 'd'), (33, 37, 'd')] for y in range(31, 41)})
    a.rows({y: [(27, 32, 'b'), (38, 43, 'b')] for y in range(32, 42)})
    a.rows({39: [(21, 26, 'd'), (32, 37, 'd')], 40: [(21, 26, 'd'), (32, 37, 'd')]})
    a.rows({40: [(26, 33, 'c'), (37, 44, 'c')], 41: [(26, 33, 'c'), (37, 44, 'c')]})
    a.rows({y: [(x0, x1, 'b')] for y, (x0, x1) in HEAD.items()})
    # light down the back, over the skull and along the bridge of the snout
    a.rows({8: [(14, 20, 'l')], 9: [(13, 21, 'l')], 10: [(12, 20, 'l')],
            15: [(6, 13, 'l')], 16: [(5, 12, 'l')],
            18: [(28, 39, 'l')], 19: [(27, 41, 'l')], 20: [(28, 40, 'l')]})
    # dark under the belly and behind the shoulder
    a.rows({31: [(27, 42, 'd')], 32: [(27, 41, 'd')], 33: [(27, 40, 'd')],
            26: [(21, 23, 'd')], 27: [(21, 24, 'd')], 28: [(21, 25, 'd')]})
    # pale muzzle, throat and chest
    a.rows({17: [(5, 13, 'c')], 18: [(5, 14, 'c')], 19: [(6, 16, 'c')],
            20: [(8, 19, 'c')], 21: [(11, 21, 'c')], 22: [(14, 22, 'c')],
            24: [(21, 25, 'c')], 25: [(21, 25, 'c')], 26: [(21, 26, 'c')],
            27: [(22, 26, 'c')], 28: [(22, 26, 'c')], 29: [(23, 27, 'c')]})
    return a


def face(a, nose='n', eye='e', pupil='k', glint='c'):
    a.rows({15: [(4, 6, nose)], 16: [(4, 7, nose)]})
    a.rows({18: [(6, 10, nose)]})
    a.rows({12: [(12, 16, eye)], 13: [(12, 16, eye)], 14: [(13, 15, eye)]})
    a.rows({12: [(13, 15, pupil)], 13: [(13, 15, pupil)]})
    a.px(13, 12, glint)
    return a

# -------------------------------------- PUP (common) — a hound that shows up
PUP_PAL = {'o': '#2a1a0c', 'd': '#7c4a1f', 'b': '#c07f3c', 'l': '#e6b070',
       'c': '#f7e4c2', 'p': '#d98a86', 'e': '#ffc94a', 'k': '#1a1008',
       'n': '#2a1c12', 'r': '#c8323c', 'y': '#ffcf4a'}

def pup():
    a = Art()
    canine(a)
    a.rows({7:[(42,45,'c')], 8:[(42,46,'c')], 9:[(43,46,'c')]})   # tail tip
    a.rows({4:[(15,16,'p'),(22,22,'p')], 5:[(15,17,'p'),(22,23,'p')],
            6:[(14,17,'p'),(21,23,'p')], 7:[(14,18,'p'),(21,24,'p')],
            8:[(13,18,'p'),(20,24,'p')], 9:[(13,19,'p'),(20,25,'p')]})
    face(a)
    a.rows({21:[(22,25,'r')], 22:[(23,27,'r')], 23:[(24,28,'r')]})
    a.rows({24:[(26,27,'y')], 25:[(26,27,'y')]})
    a.outline()
    return {'id': 'pup', 'palette': PUP_PAL, 'grid': a.grid()}

# ----------------------------------- TURBO (uncommon) — an armoured tortoise
TURBO_PAL = {'o': '#16260f', 'd': '#2a5f2e', 'g': '#4f9e46', 'G': '#7dc85f',
       'c': '#dcefb4', 'S': '#7d3f10', 's': '#b56d2c', 'H': '#e8a44e',
       'e': '#ffffff', 'k': '#141018', 'y': '#ffd166'}

def turbo():
    a = Art()
    head = {19:(6,14),20:(4,14),21:(3,15),22:(2,15),23:(2,16),24:(2,17),
            25:(3,18),26:(4,19),27:(6,20),28:(9,21)}
    a.rows({y: [(x0, x1, 'g')] for y, (x0, x1) in head.items()})

    a.rows({y: [(12,20,'g'), (33,41,'g')] for y in range(24, 34)})
    a.rows({y: [(11,21,'g'), (32,42,'g')] for y in range(34, 38)})
    a.rows({36:[(11,21,'d'), (32,42,'d')], 37:[(11,21,'d'), (32,42,'d')]})
    a.rows({38:[(12,13,'y'),(15,16,'y'),(18,19,'y'),(33,34,'y'),(36,37,'y'),(39,40,'y')]})
    a.rows({26:[(42,45,'g')], 27:[(42,46,'g')], 28:[(43,46,'d')]})
    a.rows({27:[(13,41,'c')], 28:[(14,40,'c')], 29:[(16,38,'c')], 30:[(19,35,'c')]})

    # --- shell: three crisp crest spikes over a domed carapace
    for cx in (23, 28, 33):
        a.rows({6:[(cx,cx,'s')], 7:[(cx-1,cx+1,'s')], 8:[(cx-2,cx+2,'s')],
                9:[(cx-2,cx+2,'s')], 10:[(cx-2,cx+2,'s')]})
    dome = {9:(20,34),10:(18,36),11:(16,38),12:(15,39),13:(14,40),14:(13,41),
            15:(12,42),16:(11,43),17:(11,43),18:(10,44),19:(10,44),20:(10,44),
            21:(10,44),22:(10,44),23:(10,44),24:(11,44),25:(12,43),26:(14,41)}
    a.rows({y: [(x0, x1, 's')] for y, (x0, x1) in dome.items()})
    for cx in (23, 28, 33):
        a.rows({7:[(cx-1,cx,'H')], 8:[(cx-2,cx,'H')]})
    a.rows({9:[(21,32,'H')], 10:[(19,34,'H')], 11:[(17,35,'H')], 12:[(16,34,'H')],
            13:[(15,31,'H')], 14:[(14,26,'H')]})
    a.rows({24:[(11,44,'S')], 25:[(12,43,'S')], 26:[(14,41,'S')]})
    # plate seams: one belt, staggered plates above and below it
    a.rows({17:[(11,43,'S')]})
    for x in (20, 27, 34):
        for y in range(12, 17):
            a.px(x, y, 'S')
    for x in (16, 23, 31, 38):
        for y in range(18, 24):
            a.px(x, y, 'S')

    a.rows({21:[(4,7,'e')], 22:[(4,8,'e')]})
    a.rows({21:[(5,6,'k')], 22:[(5,7,'k')]})
    a.rows({25:[(3,10,'d')]})
    a.px(3, 23, 'd')
    a.px(2, 24, 'd')
    a.rows({19:[(7,13,'G')], 20:[(5,12,'G')]})

    a.shift(3)
    a.outline()
    return {'id': 'turbo', 'palette': TURBO_PAL, 'grid': a.grid()}

# -------------------------------------------- FROST (rare) — an ice sentinel
FROST_PAL = {'o': '#0e1626', 'd': '#3c5a86', 'b': '#7099c7', 'l': '#a8c8ea',
       'c': '#eaf4ff', 'i': '#3fc9f5', 'I': '#a8f2ff', 'e': '#7ff0ff',
       'k': '#08121f'}

def _frost_shard(a, cx, tip, base, half):
    for y in range(tip, base + 1):
        t = (y - tip) / max(1, base - tip)
        w = round(half * t)
        a.span(y, cx - w, cx + w, 'i')
        if w:
            a.span(y, cx - w, cx - w + max(0, w - 1), 'I')

def frost():
    a = Art()
    _frost_shard(a, 30, 5, 19, 4)
    _frost_shard(a, 36, 8, 20, 3)
    canine(a, tail_fat=2, ear_lift=1)
    a.rows({6:[(42,45,'c')], 7:[(41,45,'c')], 8:[(41,46,'c')], 9:[(42,46,'c')]})
    face(a, nose='k', eye='e', pupil='k', glint='I')
    a.outline()
    return {'id': 'frost', 'palette': FROST_PAL, 'grid': a.grid()}

# -------------------------------------------- EMBER (epic) — an ash wyrmling
EMBER_PAL = {'o': '#170f13', 'd': '#3a3038', 'b': '#5a4e58', 'l': '#8b7f89',
       'r': '#e8501c', 'R': '#ff9a2a', 'y': '#ffe08a', 'w': '#d9d0c2',
       'k': '#0d0a10'}

def ember():
    a = Art()
    # --- wing: membrane sagging between the fingers, the way a bat's does.
    # A plain fan came out a boulder; the scallops are what say "wing".
    W = (33, 8)
    TIPS = [(28, 25), (39, 25), (45, 20), (48, 13)]
    for (ax, ay), (bx, by) in zip(TIPS, TIPS[1:]):
        for i in range(41):
            t = i / 40
            sag = 3.2 * (t * (1 - t) * 4)
            px = ax + (bx - ax) * t + (W[0] - (ax + (bx - ax) * t)) * sag / 12
            py = ay + (by - ay) * t + (W[1] - (ay + (by - ay) * t)) * sag / 12
            a.line(W[0], W[1], round(px), round(py), 'd')
    for tx, ty in TIPS:
        a.line(W[0], W[1], tx, ty, 'b')
    a.rows({12:[(43,45,'r')], 13:[(44,46,'r')], 18:[(41,43,'r')], 23:[(35,37,'r')]})
    a.outline()      # the wing gets its own edge before the body covers its root

    # --- tail along the ground
    a.rows({33:[(35,41,'b')], 34:[(36,44,'b')], 35:[(38,46,'b')],
            36:[(40,48,'b')], 37:[(43,48,'b')]})
    a.rows({36:[(45,48,'R')], 37:[(45,48,'y')]})

    # --- horns, swept back off the skull
    a.line(19, 12, 27, 6, 'l', 2)
    a.line(16, 11, 24, 4, 'w', 2)
    for bx, by in ((20, 17), (23, 20), (26, 22)):   # neck spines
        a.rows({by - 2: [(bx, bx + 1, 'l')], by - 1: [(bx - 1, bx + 2, 'l')]})

    # --- neck and body
    neck = {17:(19,23),18:(19,24),19:(19,25),20:(20,27),21:(20,29),22:(21,31),
            23:(21,33)}
    body = {22:(24,34),23:(22,36),24:(21,38),25:(21,39),26:(21,40),27:(21,40),
            28:(21,40),29:(21,40),30:(22,40),31:(22,39),32:(23,39),33:(24,38),
            34:(25,37),35:(26,36)}
    for spec in (neck, body):
        a.rows({y: [(x0, x1, 'b')] for y, (x0, x1) in spec.items()})

    # --- legs
    a.rows({y: [(32,38,'b')] for y in range(33, 40)})
    a.rows({y: [(22,28,'d')] for y in range(30, 40)})
    a.rows({39:[(19,28,'d'),(31,41,'b')], 40:[(19,28,'d'),(31,41,'b')]})
    a.rows({41:[(19,20,'w'),(22,23,'w'),(25,26,'w'),(31,32,'w'),(34,35,'w'),(37,38,'w')]})

    # --- head
    head = {10:(8,18),11:(7,20),12:(6,21),13:(5,21),14:(4,21),15:(4,21),
            16:(4,21),17:(5,21),18:(6,20),19:(8,20)}
    a.rows({y: [(x0, x1, 'b')] for y, (x0, x1) in head.items()})

    # --- molten: belly, throat, cracks along the flank
    a.rows({26:[(21,24,'r')], 27:[(21,24,'r')], 28:[(21,25,'r')],
            29:[(22,25,'r')], 30:[(23,26,'r')]})
    a.rows({27:[(22,23,'R')], 28:[(22,24,'R')], 29:[(23,24,'R')]})
    a.rows({20:[(20,22,'r')], 21:[(20,23,'r')], 22:[(21,23,'R')]})
    a.line(29, 25, 32, 31, 'r')                      # cracks, not stripes
    a.line(35, 27, 37, 33, 'r')
    a.px(30, 27, 'R'); a.px(31, 28, 'R'); a.px(36, 29, 'R')

    # --- light along the top of the skull and the back
    a.rows({10:[(9,17,'l')], 11:[(8,18,'l')]})
    a.rows({12:[(7,16,'d')], 15:[(4,17,'d')], 16:[(4,18,'d')]})   # brow and jaw

    # --- face
    a.rows({12:[(9,13,'R')], 13:[(9,13,'R')], 14:[(10,12,'R')]})
    a.rows({12:[(10,12,'k')], 13:[(10,12,'k')]})
    a.px(10, 13, 'y')
    a.rows({16:[(4,12,'k')]})                       # mouth
    a.rows({17:[(5,6,'w'),(8,9,'w'),(11,12,'w')]})  # teeth
    a.px(5, 13, 'k'); a.px(5, 14, 'k')              # nostril

    a.outline()
    return {'id': 'ember', 'palette': EMBER_PAL, 'grid': a.grid()}

# ------------------------------------------- ZEUS (legendary) — a storm lion
ZEUS_PAL = {'o': '#2a1406', 'd': '#a9701f', 'b': '#e0a844', 'l': '#f7d489',
       'c': '#ffeec4', 'm': '#8a4a10', 'M': '#c87d18', 'N': '#f0b32c',
       'z': '#8fe8ff', 'Z': '#ffffff', 'e': '#ffe066', 'k': '#1a0f04',
       'n': '#3a1f08'}

CX, CY = 19, 17

def _zeus_mane(a):
    """A filled spiky disc: the mane is a mass with a ragged edge, not stripes."""
    for i in range(40):
        ang = i * 2 * math.pi / 40
        s, c = math.sin(ang), math.cos(ang)
        r = (12.0 if s < -0.3 else 15.0 if s < 0.4 else 13.5) + (2.4 if i % 2 else 0)
        key = 'N' if s < -0.25 else ('m' if s > 0.5 or c > 0.55 else 'M')
        a.line(CX, CY, CX + round(r * c), CY + round(r * s), key, 2)
    # a few darker strands so the mass has direction
    for i in range(0, 40, 5):
        ang = i * 2 * math.pi / 40
        s, c = math.sin(ang), math.cos(ang)
        a.line(CX + round(6 * c), CY + round(6 * s),
               CX + round(12 * c), CY + round(12 * s), 'm')

def _zeus_bolt(a, x, y, dx, dy, n=4):
    px, py, flip = x, y, 1
    for i in range(n):
        nx, ny = px + dx + flip * dy // 2, py + dy - flip * dx // 2
        a.line(px, py, nx, ny, 'z', 2)
        a.line(px, py, nx, ny, 'Z')
        px, py, flip = nx, ny, -flip

def zeus():
    a = Art()
    a.line(44, 27, 47, 13, 'b', 2)
    a.rows({7:[(46,47,'N')], 8:[(45,48,'N')], 9:[(45,48,'N')], 10:[(45,48,'N')],
            11:[(46,48,'N')], 12:[(46,47,'N')]})

    canine(a, tail=False, ears=False)
    _zeus_mane(a)

    # the face sits in front of the mane
    a.rows({y: [(x0, min(x1, 23), 'b')] for y, (x0, x1) in HEAD.items()})
    a.rows({8:[(14,20,'l')], 9:[(13,21,'l')], 10:[(12,20,'l')],
            15:[(6,13,'l')], 16:[(5,12,'l')]})
    a.rows({17:[(5,13,'c')], 18:[(5,14,'c')], 19:[(6,16,'c')], 20:[(8,19,'c')],
            21:[(11,20,'c')], 22:[(14,20,'c')]})

    # ears through the top of the mane
    a.rows({3:[(14,15,'b'),(23,24,'b')], 4:[(13,17,'b'),(22,26,'b')],
            5:[(13,17,'b'),(22,26,'b')], 6:[(14,17,'b'),(22,25,'b')]})
    a.rows({4:[(15,16,'n'),(24,25,'n')], 5:[(15,16,'n'),(24,25,'n')]})

    face(a, glint='c')
    a.rows({11:[(11,17,'n')]})
    a.rows({12:[(12,17,'e')], 13:[(12,17,'e')], 14:[(13,16,'e')]})
    a.rows({12:[(13,16,'k')], 13:[(13,16,'k')]})
    a.px(13, 13, 'c')
    a.rows({18:[(6,11,'k')]})

    _zeus_bolt(a, 29, 11, 4, -3)
    _zeus_bolt(a, 12, 27, -3, 3)
    a.outline()
    return {'id': 'zeus', 'palette': ZEUS_PAL, 'grid': a.grid()}

# --------------------------- TUSKLING (legendary, seasonal) — Grimtusk’s cub
TUSKLING_PAL = {'o': '#132009', 'd': '#2f5a20', 'g': '#4e8c33', 'G': '#79b84e',
       't': '#f4eed6', 'e': '#ffc93c', 'k': '#0f1408', 'h': '#4a2f16',
       'H': '#8a5a2a', 'w': '#c8b78e'}

def tuskling():
    # Outlined in stages. One flat green silhouette reads as a blob however
    # carefully it is shaped, so each limb gets its own edge before the part in
    # front of it is painted over the top.
    a = Art()
    a.part()
    a.line(39, 34, 45, 12, 'H', 3)
    a.rows({5:[(42,47,'H')], 6:[(41,48,'H')], 7:[(41,48,'H')], 8:[(41,48,'H')],
            9:[(41,48,'H')], 10:[(42,47,'H')], 11:[(43,47,'H')]})
    a.rows({5:[(43,45,'w')], 6:[(42,44,'w')], 7:[(42,43,'w')], 9:[(45,46,'w')]})
    a.edge()

    a.part()
    for y, (lx0, lx1) in {8:(5,9),9:(3,9),10:(2,9),11:(3,9),12:(5,9),13:(7,9)}.items():
        a.span(y, lx0, lx1, 'g')
        a.span(y, 40 - lx1, 40 - lx0, 'g')
    a.edge()

    a.part()
    torso = {20:(15,25),21:(13,27),22:(10,30),23:(8,32),24:(8,33),25:(8,33),
             26:(9,33),27:(9,32),28:(10,32),29:(10,31),30:(11,31)}
    a.rows({y: [(x0, x1, 'g')] for y, (x0, x1) in torso.items()})
    a.rows({20:[(15,25,'d')], 21:[(15,25,'d')]})            # neck in shadow
    a.rows({23:[(9,14,'G')], 24:[(9,13,'G')], 25:[(9,13,'G')]})
    a.edge()

    a.rows({y: [(12,20,'g'),(22,30,'d')] for y in range(30, 39)})
    a.rows({39:[(10,21,'g'),(21,32,'d')], 40:[(10,21,'g'),(21,32,'d')],
            41:[(10,21,'g'),(21,32,'d')]})
    a.rows({42:[(10,11,'t'),(14,15,'t'),(18,19,'t'),(22,23,'t'),(26,27,'t'),(30,31,'t')]})
    a.edge()

    a.part()
    a.rows({y: [(4,10,'g')] for y in range(24, 33)})
    a.rows({32:[(2,11,'g')], 33:[(2,11,'g')], 34:[(2,11,'g')], 35:[(3,10,'g')]})
    a.rows({y: [(4,5,'d')] for y in range(24, 33)})
    a.rows({y: [(31,38,'g')] for y in range(23, 31)})
    a.rows({y: [(34,41,'g')] for y in range(28, 32)})
    a.rows({32:[(34,43,'g')], 33:[(34,43,'g')], 34:[(35,42,'g')]})
    a.rows({y: [(37,38,'d')] for y in range(23, 30)})
    a.edge()

    a.part()
    head = {3:(14,26),4:(12,28),5:(11,29),6:(10,30),7:(10,30),8:(9,31),9:(9,31),
            10:(9,31),11:(9,31),12:(8,32),13:(8,32),14:(8,32),15:(8,32),
            16:(9,32),17:(9,31),18:(10,30),19:(12,28),20:(15,25)}
    a.rows({y: [(x0, x1, 'g')] for y, (x0, x1) in head.items()})
    # light off the top-left, not a cap across the crown
    a.rows({3:[(15,20,'G')], 4:[(13,18,'G')], 5:[(12,16,'G')], 6:[(11,14,'G')],
            7:[(10,13,'G')]})
    a.rows({10:[(10,18,'d'),(22,30,'d')], 11:[(10,18,'d'),(22,30,'d')]})

    a.rows({12:[(11,17,'e'),(23,29,'e')], 13:[(11,17,'e'),(23,29,'e')],
            14:[(11,17,'e'),(23,29,'e')], 15:[(12,16,'e'),(24,28,'e')]})
    a.rows({13:[(14,15,'k'),(26,27,'k')], 14:[(14,15,'k'),(26,27,'k')]})
    a.rows({11:[(10,18,'o'),(22,30,'o')]})
    a.px(13, 13, 't'); a.px(25, 13, 't')
    a.rows({18:[(18,22,'d')], 19:[(17,23,'d')]})
    a.rows({19:[(18,18,'k'),(22,22,'k')]})
    a.rows({20:[(13,27,'k')], 21:[(15,25,'k')]})
    a.rows({20:[(15,16,'t'),(19,20,'t'),(23,24,'t')]})
    a.edge()

    a.part()
    a.line(12, 21, 11, 16, 't', 3)
    a.line(28, 21, 29, 16, 't', 3)
    a.edge()

    a.rows({28:[(10,32,'H')], 29:[(10,31,'h')], 30:[(11,31,'h')],
            31:[(12,20,'h'),(22,30,'h')], 32:[(13,19,'h'),(23,29,'h')]})
    a.edge()
    a.outline()
    return {'id': 'tuskling', 'palette': TUSKLING_PAL, 'grid': a.grid()}


PETS = [pup, turbo, frost, ember, zeus, tuskling]

if __name__ == '__main__':
    built = [p() for p in PETS]
    if '--emit' in sys.argv:
        for s in built:
            print(emit(s['id'].upper(), s))
    else:
        out = pathlib.Path(__file__).parent / 'pets.png'
        look(str(out), [(s['grid'], s['palette']) for s in built])
        print('wrote', out)
