"""Sydney Harbour as a terrain grid.

The harbour is the only thing that makes a map of Sydney read as Sydney, so it
is built first and everything else hangs off it. Water is defined as polygons in
grid space and rasterised; the land is whatever is left.

Grid: 12km square, 120x120 cells, so one cell is 100m.
    west 151.170  ->  east 151.300
    north -33.790 ->  south -33.900
"""
import json, math, pathlib, random

W = H = 120
WEST, EAST = 151.170, 151.300
NORTH, SOUTH = -33.790, -33.900

random.seed(20)


def cell(lon, lat):
    return ((lon - WEST) / (EAST - WEST) * W, (NORTH - lat) / (NORTH - SOUTH) * H)


def poly(points):
    return [cell(lo, la) for lo, la in points]


# --------------------------------------------------------------- the ocean --
# The Pacific, east of the coastline: Manly down past the Heads to Bondi.
OCEAN = poly([
    (151.302, -33.780), (151.302, -33.912), (151.283, -33.906), (151.2775, -33.897),
    (151.2765, -33.888), (151.2810, -33.878), (151.2845, -33.866), (151.2860, -33.852),
    (151.2860, -33.840), (151.2865, -33.832), (151.2900, -33.826), (151.2925, -33.818),
    (151.2960, -33.808), (151.2900, -33.796), (151.2930, -33.788), (151.300, -33.784),
])

# ------------------------------------------------------------ the harbour ---
# Port Jackson, west from the Heads to the Parramatta River. Traced headland by
# headland: the north shore runs a long way south at Bradleys Head and Cremorne
# Point, and getting that wrong is what puts Taronga in open water.
HARBOUR = poly([
    # north shore, west to east
    (151.1700, -33.8470), (151.1780, -33.8450), (151.1850, -33.8420), (151.1920, -33.8440),
    (151.1980, -33.8450), (151.2030, -33.8470), (151.2090, -33.8490), (151.2140, -33.8510),
    (151.2180, -33.8520), (151.2220, -33.8500), (151.2285, -33.8490), (151.2330, -33.8465),
    (151.2390, -33.8450), (151.2430, -33.8470), (151.2480, -33.8500), (151.2506, -33.8517),
    (151.2540, -33.8480), (151.2550, -33.8420), (151.2530, -33.8380), (151.2560, -33.8285),
    (151.2620, -33.8140), (151.2695, -33.8095), (151.2790, -33.8125), (151.2865, -33.8190),
    (151.2925, -33.8255),
    # across the mouth to South Head, then the south shore running back west
    (151.2860, -33.8340), (151.2830, -33.8360), (151.2810, -33.8420), (151.2780, -33.8480),
    (151.2760, -33.8550), (151.2740, -33.8590), (151.2660, -33.8620), (151.2560, -33.8620),
    (151.2510, -33.8630), (151.2440, -33.8670), (151.2360, -33.8680), (151.2320, -33.8640),
    (151.2290, -33.8615), (151.2255, -33.8595), (151.2225, -33.8590), (151.2180, -33.8600),
    (151.2153, -33.8572), (151.2115, -33.8605), (151.2090, -33.8560), (151.2040, -33.8560),
    (151.2010, -33.8572), (151.1970, -33.8562), (151.1900, -33.8540), (151.1820, -33.8520),
    (151.1760, -33.8505), (151.1700, -33.8500),
])

# Bays cut off the channel; each one is what makes the coast read as Sydney.
BAYS = [
    # Darling Harbour, Cockle Bay and Johnstons Bay, west of the CBD
    poly([(151.1975, -33.8562), (151.2055, -33.8568), (151.2050, -33.8700), (151.2010, -33.8780),
          (151.1940, -33.8770), (151.1930, -33.8650), (151.1900, -33.8590)]),
    # Farm Cove, in front of the Botanic Gardens
    poly([(151.2160, -33.8575), (151.2245, -33.8590), (151.2240, -33.8650), (151.2180, -33.8660),
          (151.2150, -33.8620)]),
    # Woolloomooloo Bay
    poly([(151.2225, -33.8592), (151.2292, -33.8600), (151.2285, -33.8720), (151.2245, -33.8720),
          (151.2225, -33.8650)]),
    # Rushcutters Bay
    poly([(151.2300, -33.8618), (151.2382, -33.8650), (151.2375, -33.8730), (151.2320, -33.8730)]),
    # Double Bay
    poly([(151.2380, -33.8672), (151.2495, -33.8632), (151.2500, -33.8725), (151.2420, -33.8730)]),
    # Rose Bay, the big one on the south shore
    poly([(151.2530, -33.8622), (151.2700, -33.8600), (151.2720, -33.8760), (151.2630, -33.8790),
          (151.2540, -33.8720)]),
    # Watsons Bay, in behind South Head
    poly([(151.2770, -33.8400), (151.2835, -33.8385), (151.2835, -33.8480), (151.2775, -33.8470)]),
    # Neutral Bay and Careening Cove, in behind Kirribilli
    poly([(151.2145, -33.8512), (151.2255, -33.8492), (151.2255, -33.8300), (151.2190, -33.8280),
          (151.2140, -33.8345)]),
    # Mosman Bay, running north past the ferry wharf
    poly([(151.2335, -33.8468), (151.2425, -33.8452), (151.2425, -33.8285), (151.2360, -33.8265)]),
    # Parramatta River, heading west out of frame
    poly([(151.1785, -33.8480), (151.1700, -33.8455), (151.1700, -33.8560), (151.1795, -33.8520)]),
    # Iron Cove and Rozelle Bay
    poly([(151.1700, -33.8620), (151.1835, -33.8640), (151.1835, -33.8760), (151.1700, -33.8760)]),
]


# Middle Harbour in past Balmoral and The Spit, and North Harbour up to Manly:
# both are channels, so both are drawn as a line with a width.
INLETS = [
    ([(151.2590, -33.8235), (151.2540, -33.8175), (151.2500, -33.8130), (151.2472, -33.8060),
      (151.2430, -33.8005), (151.2350, -33.7960), (151.2270, -33.7925), (151.2210, -33.7900)], 5.0),
    ([(151.2525, -33.8195), (151.2495, -33.8235)], 3.0),                       # Hunters Bay
    ([(151.2760, -33.8125), (151.2810, -33.8060), (151.2845, -33.8025)], 6.0), # North Harbour
    ([(151.2845, -33.8030), (151.2880, -33.8020)], 3.0),                       # Manly Cove
]


def stroke(pts, width):
    """Every cell within half a width of the line — a channel, not a blob."""
    cells = [cell(lo, la) for lo, la in pts]
    out = set()
    r = width / 2
    for i in range(len(cells) - 1):
        (x1, y1), (x2, y2) = cells[i], cells[i + 1]
        n = int(max(abs(x2 - x1), abs(y2 - y1)) * 3) + 1
        for k in range(n + 1):
            cx, cy = x1 + (x2 - x1) * k / n, y1 + (y2 - y1) * k / n
            for dy in range(int(-r) - 1, int(r) + 2):
                for dx in range(int(-r) - 1, int(r) + 2):
                    px, py = int(cx) + dx, int(cy) + dy
                    if dx * dx + dy * dy <= r * r and 0 <= px < W and 0 <= py < H:
                        out.add((py, px))
    return out


def rasterise():
    grid = [[0] * W for _ in range(H)]   # 0 land, 1 water

    def fill(pts):
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
                    grid[y][x] = 1

    fill(OCEAN)
    fill(HARBOUR)
    for b in BAYS:
        fill(b)
    for pts, width in INLETS:
        for y, x in stroke(pts, width):
            grid[y][x] = 1
    return grid


if __name__ == '__main__':
    import png
    g = rasterise()
    Z = 5
    im = [[(0, 0, 0)] * (W * Z) for _ in range(H * Z)]
    for y in range(H):
        for x in range(W):
            c = (32, 90, 150) if g[y][x] else (74, 124, 62)
            for dy in range(Z):
                for dx in range(Z):
                    im[y * Z + dy][x * Z + dx] = c
    png.write('coast.png', im)
    water = sum(sum(r) for r in g)
    print(f'{W}x{H} grid, {water} water cells ({water * 100 // (W * H)}%)')
