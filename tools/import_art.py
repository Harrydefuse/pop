"""Import a PNG into the game's sprite format.

    python3 tools/import_art.py <file.png> <grid-width> [grid-height] [--name NAME]

Handles both kinds of source:

  * A clean pixel-art export — every colour block on an exact grid. Transcribed
    byte-for-byte, no resampling, no colour approximation.
  * A soft render — anti-aliased edges, a glow, thousands of colours, "pixels"
    that are not really on a grid. Quantised to a small palette, then each cell
    of the target grid takes the dominant palette colour inside it. Mode rather
    than mean, which is what keeps edges hard instead of muddy.

It picks between them automatically and says which it used.
"""
import sys, math, random, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import png

random.seed(11)
CHARS = 'abcdefghijklmnpqrstuvwxyzABCDEFGHIJKLMNPQRSTUVWXYZ0123456789#$%&@=+~^'


def is_bg(p):
    """Clear, near-white or near-black all count as background."""
    r, g, b, a = p
    if a < 40:
        return True
    if r > 246 and g > 246 and b > 246:
        return True
    return r < 9 and g < 9 and b < 9


def trim(px, w, h):
    ys = [y for y in range(h) if any(not is_bg(p) for p in px[y])]
    if not ys:
        raise SystemExit('image is entirely background')
    xs = [x for x in range(min(ys), max(ys) + 1) for x in range(w) if any(not is_bg(px[y][x]) for y in ys)]
    xs = [x for x in range(w) if any(not is_bg(px[y][x]) for y in ys)]
    return [row[min(xs):max(xs) + 1] for row in px[min(ys):max(ys) + 1]]


def exact_block(px):
    """gcd of every run length; >1 means the art sits on a real pixel grid."""
    g = 0
    rows, cols = len(px), len(px[0])
    for row in px:
        run, prev = 0, object()
        for p in row:
            k = None if is_bg(p) else p[:3]
            if k == prev:
                run += 1
            else:
                if run:
                    g = math.gcd(g, run)
                run, prev = 1, k
        g = math.gcd(g, run)
    for x in range(cols):
        run, prev = 0, object()
        for y in range(rows):
            k = None if is_bg(px[y][x]) else px[y][x][:3]
            if k == prev:
                run += 1
            else:
                if run:
                    g = math.gcd(g, run)
                run, prev = 1, k
        g = math.gcd(g, run)
    return max(1, g)


def kmeans(pool, k, iters=12):
    cent = random.sample(pool, min(k, len(pool)))
    for _ in range(iters):
        buckets = [[] for _ in cent]
        for c in pool:
            bi = min(range(len(cent)), key=lambda i: sum((a - b) ** 2 for a, b in zip(c, cent[i])))
            buckets[bi].append(c)
        for i, b in enumerate(buckets):
            if b:
                cent[i] = tuple(round(sum(v[j] for v in b) / len(b)) for j in range(3))
    return cent


def resample(px, gw, gh, k=20):
    rows, cols = len(px), len(px[0])
    cw, ch = cols / gw, rows / gh
    pool = [p[:3] for row in px for p in row if not is_bg(p)]
    cent = kmeans(random.sample(pool, min(16000, len(pool))), k)
    near = {}

    def snap(c):
        if c not in near:
            near[c] = min(cent, key=lambda m: sum((a - b) ** 2 for a, b in zip(c, m)))
        return near[c]

    out = []
    for gy in range(gh):
        row = []
        for gx in range(gw):
            x0, x1 = gx * cw, (gx + 1) * cw
            y0, y1 = gy * ch, (gy + 1) * ch
            ix0, ix1 = int(x0 + cw * 0.18), max(int(x1 - cw * 0.18), int(x0) + 1)
            iy0, iy1 = int(y0 + ch * 0.18), max(int(y1 - ch * 0.18), int(y0) + 1)
            votes, solid, total = {}, 0, 0
            for y in range(max(0, iy0), min(rows, iy1)):
                for x in range(max(0, ix0), min(cols, ix1)):
                    total += 1
                    p = px[y][x]
                    if not is_bg(p):
                        solid += 1
                        c = snap(p[:3])
                        votes[c] = votes.get(c, 0) + 1
            row.append(max(votes, key=votes.get) if total and solid / total >= 0.42 and votes else None)
        out.append(row)
    return out


def to_sprite(cells, name):
    counts = {}
    for row in cells:
        for c in row:
            if c:
                counts[c] = counts.get(c, 0) + 1
    order = sorted(counts, key=lambda c: -counts[c])
    if len(order) > len(CHARS):
        raise SystemExit(f'{len(order)} colours, only {len(CHARS)} palette slots — reduce colours in the source')
    key = {c: CHARS[i] for i, c in enumerate(order)}
    grid = [''.join('.' if c is None else key[c] for c in row) for row in cells]
    palette = {key[c]: '#%02x%02x%02x' % c for c in order}
    body = ',\n    '.join(f"{k}: '{v}'" for k, v in palette.items())
    rows = ',\n    '.join(f"'{r}'" for r in grid)
    return (f"export const {name} = {{\n  w: {len(grid[0])},\n  h: {len(grid)},\n"
            f"  palette: {{\n    {body},\n  }},\n  grid: [\n    {rows},\n  ],\n}}\n"), palette


def main():
    argv = sys.argv[1:]
    name = 'SPRITE'
    if '--name' in argv:
        i = argv.index('--name')
        name = argv[i + 1]
        del argv[i:i + 2]
    args = [a for a in argv if not a.startswith('--')]
    path = args[0]
    gw = int(args[1]) if len(args) > 1 else None
    gh = int(args[2]) if len(args) > 2 else gw

    w, h, px = png.read(path)

    # If the source canvas is an exact multiple of the target grid, it was drawn
    # on that grid — sample it where it sits. Trimming first would crop to the
    # ink and then squash a non-square subject into a square box.
    on_grid = gw and gh and w % gw == 0 and h % gh == 0 and w // gw == h // gh
    if not on_grid:
        px = trim(px, w, h)
    tw, th = len(px[0]), len(px)
    n = exact_block(px)
    exact = n > 1 and tw % n == 0 and th % n == 0

    if on_grid and not exact:
        cells = resample(px, gw, gh)
        how = f'sampled on its own {w // gw}x grid, no crop'
    elif exact and (gw is None or (tw // n, th // n) == (gw, gh)):
        cells = [[None if is_bg(px[y * n + n // 2][x * n + n // 2]) else px[y * n + n // 2][x * n + n // 2][:3]
                  for x in range(tw // n)] for y in range(th // n)]
        how = f'exact transcription (native pixel {n}px)'
    else:
        if gw is None:
            raise SystemExit('this source has no clean pixel grid — pass a target size, e.g. 48 48')
        cells = resample(px, gw, gh)
        how = f'resampled to {gw}x{gh} (source has no clean grid)'

    js, palette = to_sprite(cells, name)
    out = pathlib.Path(path).with_suffix('.sprite.js')
    out.write_text(js)
    print(f'{path}\n  {w}x{h} -> trimmed {tw}x{th} -> {how}')
    print(f'  {len(palette)} colours, grid {len(cells[0])}x{len(cells)}')
    print(f'  wrote {out}')


if __name__ == '__main__':
    main()
