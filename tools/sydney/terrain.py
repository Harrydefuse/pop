"""Dress the coastline into an illustrated map.

The reference is a JRPG world map: land with texture, tree clusters, little
building blocks, a shallow band along every shore, beaches on the ocean side.
None of that is noise — each pass is a real feature of the place, seeded so the
result is identical every build.
"""
import json, math, pathlib, random, sys
sys.path.insert(0, '.')
from coast import W, H, WEST, EAST, NORTH, SOUTH, cell, poly, rasterise

random.seed(7)

DEEP, SHALLOW, SAND, GRASS, GRASS2, TREE, TREE2 = '~', '-', 's', '.', ',', 't', 'T'
BUILD, BUILD2, ROAD, MAJOR, ROCK, PARK = 'b', 'B', 'r', 'R', 'k', 'p'
BRIDGE, LANDMARK = 'X', 'O'

water = rasterise()
g = [[GRASS if not water[y][x] else DEEP for x in range(W)] for y in range(H)]


def near(y, x, pred, r=1):
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and pred(ny, nx):
                return True
    return False


def fill(pts, ch, jitter=0.0):
    ys = [p[1] for p in pts]
    for y in range(max(0, int(min(ys))), min(H, int(max(ys)) + 1)):
        xs = []
        for i in range(len(pts)):
            (x1, y1), (x2, y2) = pts[i], pts[(i + 1) % len(pts)]
            if (y1 <= y < y2) or (y2 <= y < y1):
                xs.append(x1 + (y - y1) / (y2 - y1) * (x2 - x1))
        xs.sort()
        for i in range(0, len(xs) - 1, 2):
            for x in range(max(0, int(xs[i])), min(W, int(xs[i + 1]) + 1)):
                if g[y][x] not in (DEEP, SHALLOW) and (jitter == 0 or random.random() > jitter):
                    g[y][x] = ch


# ------------------------------------------------------------------ parks ---
# The green Sydney actually has, in the places it actually has it.
PARKS = [
    [(151.213, -33.858), (151.222, -33.860), (151.224, -33.872), (151.214, -33.871)],   # Domain + Botanic
    [(151.205, -33.869), (151.213, -33.869), (151.213, -33.879), (151.206, -33.878)],   # Hyde Park
    [(151.230, -33.888), (151.248, -33.890), (151.248, -33.903), (151.231, -33.901)],   # Centennial
    [(151.276, -33.812), (151.296, -33.808), (151.298, -33.828), (151.279, -33.826)],   # North Head
    [(151.246, -33.818), (151.266, -33.814), (151.268, -33.832), (151.250, -33.834)],   # Mosman bush
    [(151.256, -33.878), (151.272, -33.880), (151.272, -33.894), (151.257, -33.892)],   # Vaucluse
    [(151.246, -33.816), (151.256, -33.815), (151.257, -33.828), (151.247, -33.828)],   # Middle Head
    [(151.276, -33.836), (151.288, -33.834), (151.289, -33.848), (151.277, -33.847)],   # South Head
    [(151.235, -33.840), (151.245, -33.841), (151.245, -33.850), (151.236, -33.849)],   # Taronga
    [(151.2255, -33.8410), (151.2305, -33.8410), (151.2305, -33.8490), (151.2255, -33.8490)],  # Cremorne Point
    [(151.2620, -33.8490), (151.2700, -33.8490), (151.2700, -33.8560), (151.2620, -33.8560)],  # Nielsen Park
    [(151.2110, -33.8560), (151.2160, -33.8555), (151.2160, -33.8600), (151.2110, -33.8600)],  # Dawes Point
    [(151.1450, -33.7880), (151.1720, -33.7900), (151.1700, -33.8180), (151.1450, -33.8150)],  # Lane Cove NP
    [(151.2450, -33.7780), (151.2700, -33.7800), (151.2680, -33.8000), (151.2440, -33.7980)],  # Garigal / Manly Dam
    [(151.2280, -33.9060), (151.2450, -33.9080), (151.2440, -33.9200), (151.2270, -33.9180)],  # Randwick racecourse
    [(151.1380, -33.8620), (151.1560, -33.8640), (151.1550, -33.8780), (151.1370, -33.8760)],  # inner west green
]
for p in PARKS:
    fill(poly(p), PARK)

# --------------------------------------------------------------- built-up ---
URBAN = [
    [(151.198, -33.856), (151.216, -33.860), (151.216, -33.888), (151.196, -33.884)],   # CBD + Surry Hills
    [(151.196, -33.828), (151.216, -33.828), (151.216, -33.848), (151.196, -33.846)],   # North Sydney
    [(151.170, -33.860), (151.196, -33.864), (151.196, -33.890), (151.170, -33.888)],   # inner west
    [(151.216, -33.872), (151.244, -33.876), (151.244, -33.892), (151.216, -33.890)],   # Paddington
    [(151.244, -33.856), (151.258, -33.858), (151.258, -33.874), (151.244, -33.872)],   # Double Bay
    [(151.222, -33.826), (151.244, -33.824), (151.244, -33.842), (151.224, -33.842)],   # Cremorne
    [(151.262, -33.884), (151.278, -33.886), (151.278, -33.900), (151.263, -33.898)],   # Bondi
    [(151.278, -33.792), (151.292, -33.793), (151.292, -33.805), (151.278, -33.804)],   # Manly
    [(151.172, -33.850), (151.190, -33.852), (151.190, -33.863), (151.173, -33.861)],   # Balmain
    [(151.256, -33.858), (151.272, -33.860), (151.272, -33.876), (151.257, -33.874)],   # Rose Bay
    [(151.1300, -33.8620), (151.1720, -33.8680), (151.1700, -33.9000), (151.1300, -33.8940)],  # Leichhardt, Ashfield
    [(151.1700, -33.8760), (151.2100, -33.8820), (151.2080, -33.9160), (151.1690, -33.9100)],  # Newtown, Marrickville
    [(151.1360, -33.8180), (151.1720, -33.8240), (151.1700, -33.8420), (151.1350, -33.8360)],  # Ryde, Gladesville
    [(151.1780, -33.7860), (151.2080, -33.7880), (151.2060, -33.8180), (151.1760, -33.8160)],  # Chatswood, Willoughby
    [(151.2680, -33.7620), (151.2960, -33.7640), (151.2940, -33.7860), (151.2660, -33.7840)],  # Dee Why, Brookvale
    [(151.2180, -33.9000), (151.2560, -33.9060), (151.2540, -33.9220), (151.2170, -33.9160)],  # Kensington, Randwick
    [(151.2540, -33.9040), (151.2660, -33.9060), (151.2650, -33.9220), (151.2530, -33.9200)],  # Coogee, Clovelly
]
for u in URBAN:
    fill(poly(u), BUILD, jitter=0.34)

# ------------------------------------------------------------------ roads ---
def line(a, b, ch):
    (x1, y1), (x2, y2) = cell(*a), cell(*b)
    n = int(max(abs(x2 - x1), abs(y2 - y1)) * 2) + 1
    for i in range(n + 1):
        x, y = round(x1 + (x2 - x1) * i / n), round(y1 + (y2 - y1) * i / n)
        if 0 <= x < W and 0 <= y < H and g[y][x] not in (DEEP, SHALLOW):
            g[y][x] = ch


ROADS = [
    ((151.211, -33.852), (151.211, -33.842), MAJOR),                 # the Bridge approach
    ((151.209, -33.858), (151.205, -33.890), MAJOR),                 # George St south
    ((151.196, -33.876), (151.170, -33.884), MAJOR),                 # Parramatta Road
    ((151.212, -33.878), (151.250, -33.884), MAJOR),                 # Oxford Street
    ((151.211, -33.842), (151.240, -33.828), MAJOR),                 # Military Road
    ((151.250, -33.884), (151.274, -33.890), ROAD),                  # out to Bondi
    ((151.222, -33.866), (151.252, -33.862), ROAD),                  # New South Head Road
    ((151.196, -33.848), (151.196, -33.828), ROAD),
    ((151.240, -33.828), (151.256, -33.818), ROAD),
    ((151.256, -33.818), (151.282, -33.800), ROAD),                  # up to Manly
    ((151.196, -33.858), (151.176, -33.856), ROAD),                  # out to Balmain
    ((151.252, -33.862), (151.278, -33.858), ROAD),                  # New South Head Rd to Watsons Bay
    ((151.170, -33.884), (151.132, -33.888), MAJOR),                 # Parramatta Road, further west
    ((151.205, -33.890), (151.215, -33.918), MAJOR),                 # south to Kensington
    ((151.215, -33.918), (151.256, -33.912), ROAD),                  # across to Coogee
    ((151.196, -33.838), (151.192, -33.790), MAJOR),                 # Pacific Highway north
    ((151.192, -33.790), (151.198, -33.762), ROAD),
    ((151.256, -33.818), (151.278, -33.782), ROAD),                  # up the northern beaches
    ((151.170, -33.848), (151.140, -33.828), ROAD),                  # Victoria Road west
]
for a, b, ch in ROADS:
    line(a, b, ch)

# ----------------------------------------------------- shore, sand, texture --
# A two-cell shallow band. Sydney reads as Sydney because of its edges, so the
# shoreline gets the most attention.
for _ in range(2):
    edge = []
    for y in range(H):
        for x in range(W):
            if g[y][x] == DEEP and near(y, x, lambda ny, nx: g[ny][nx] not in (DEEP, SHALLOW), 1):
                edge.append((y, x))
    for y, x in edge:
        g[y][x] = SHALLOW

for y in range(H):
    for x in range(W):
        if g[y][x] in (DEEP, SHALLOW):
            continue
        lon = WEST + (x + 0.5) / W * (EAST - WEST)
        if lon > 151.255 and near(y, x, lambda ny, nx: g[ny][nx] == SHALLOW, 1):
            g[y][x] = SAND


def blobs(count, size, on, put, spread=0.62):
    """Grows clumps rather than scattering pixels. Uniform noise reads as static;
    clumps read as woodland."""
    for _ in range(count):
        cy, cx = random.randrange(H), random.randrange(W)
        if g[cy][cx] not in on:
            continue
        frontier = [(cy, cx)]
        placed = 0
        while frontier and placed < size:
            y, x = frontier.pop(random.randrange(len(frontier)))
            if not (0 <= y < H and 0 <= x < W) or g[y][x] not in on:
                continue
            g[y][x] = put
            placed += 1
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                if random.random() < spread:
                    frontier.append((y + dy, x + dx))


blobs(620, 15, (GRASS,), TREE)                    # bushland through the suburbs
blobs(250, 6, (TREE,), TREE2)                     # depth inside the canopy
blobs(320, 6, (GRASS,), GRASS2)                   # open ground variation
blobs(240, 24, (PARK,), TREE, spread=0.74)        # parks are mostly canopy
blobs(130, 8, (PARK,), TREE2, spread=0.7)

# A park with no trees in it is a lawn. Whatever the clumps missed gets planted.
for y in range(H):
    for x in range(W):
        if g[y][x] == PARK and random.random() < 0.45:
            g[y][x] = TREE if random.random() < 0.75 else TREE2

# Buildings sit on a street grid with gaps, not scattered — a block of flats is
# a block, and the gaps between them are what make it read as a city.
for y in range(H):
    for x in range(W):
        if g[y][x] != BUILD:
            continue
        # Streets run the length of the block. Breaking them up at random left
        # tan squares that read as empty lots, not as a city.
        if y % 4 == 3 or x % 5 == 4:
            g[y][x] = ROAD
        elif random.random() < 0.30:
            g[y][x] = BUILD2

# cliffs where the headlands meet the ocean
for y in range(H):
    for x in range(W):
        lon = WEST + (x + 0.5) / W * (EAST - WEST)
        if g[y][x] in (GRASS, GRASS2, TREE, TREE2) and lon > 151.262 and near(y, x, lambda ny, nx: g[ny][nx] in (SAND, SHALLOW), 1):
            g[y][x] = ROCK

# ------------------------------------------------------------- landmarks ---
# Two things do all the work of saying "Sydney". Everything else is just a
# harbour.
def span(a, b, ch, wide=1):
    (x1, y1), (x2, y2) = cell(*a), cell(*b)
    n = int(max(abs(x2 - x1), abs(y2 - y1)) * 3) + 1
    for i in range(n + 1):
        x, y = x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n
        for dy in range(wide):
            for dx in range(wide):
                px, py = round(x) + dx, round(y) + dy
                if 0 <= px < W and 0 <= py < H:
                    g[py][px] = ch


span((151.2108, -33.8560), (151.2117, -33.8498), BRIDGE, wide=2)      # the Bridge
for dy, dx in ((0, 0), (0, 1), (1, 0), (1, 1), (0, 2), (2, 1)):       # Bennelong Point
    x, y = cell(151.2153, -33.8570)
    if 0 <= int(y) + dy < H and 0 <= int(x) + dx < W:
        g[int(y) + dy][int(x) + dx] = LANDMARK

rows = [''.join(r) for r in g]
pathlib.Path('terrain.txt').write_text('\n'.join(rows))

PALETTE = {
    DEEP: '#1a4674', SHALLOW: '#3f93cc', SAND: '#e2d19a',
    BRIDGE: '#cfd6dd', LANDMARK: '#f3f1e6',
    GRASS: '#57893f', GRASS2: '#4a7a35', TREE: '#3d6b2c', TREE2: '#2f5622',
    BUILD: '#8a8378', BUILD2: '#6f6a61', ROAD: '#c9c0a6', MAJOR: '#e8dcbc',
    ROCK: '#7d6f5c', PARK: '#4f8038',
}
pathlib.Path('palette.json').write_text(json.dumps(PALETTE))

if __name__ == '__main__':
    import png
    Z = 5
    im = [[(0, 0, 0)] * (W * Z) for _ in range(H * Z)]
    for y, row in enumerate(rows):
        for x, c in enumerate(row):
            col = tuple(int(PALETTE[c][i:i + 2], 16) for i in (1, 3, 5))
            for dy in range(Z):
                for dx in range(Z):
                    im[y * Z + dy][x * Z + dx] = col
    png.write('terrain.png', im)
    from collections import Counter
    print(Counter(''.join(rows)).most_common())
