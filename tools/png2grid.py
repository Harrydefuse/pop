"""Turn a pixel-art PNG into the character-grid + palette format the game uses.

Detects the native pixel size (art exported at 8x still transcribes to its true
grid), trims the margin, and assigns one palette character per distinct colour.
Output is byte-exact: no resampling, no colour approximation."""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import png

CHARS = 'abcdefghijklmnpqrstuvwxyzABCDEFGHIJKLMNPQRSTUVWXYZ0123456789#$%&@=+~^'


def transparent(c, bg_tol=8):
    """A pixel counts as background if it is fully clear, or near-white."""
    r, g, b, a = c
    if a < 24:
        return True
    return r > 255 - bg_tol and g > 255 - bg_tol and b > 255 - bg_tol


def trim(px):
    h, w = len(px), len(px[0])
    top = next((y for y in range(h) if any(not transparent(c) for c in px[y])), None)
    if top is None:
        raise SystemExit('image is entirely background')
    bot = max(y for y in range(h) if any(not transparent(c) for c in px[y]))
    left = min(x for y in range(top, bot + 1) for x in range(w) if not transparent(px[y][x]))
    right = max(x for y in range(top, bot + 1) for x in range(w) if not transparent(px[y][x]))
    return [row[left:right + 1] for row in px[top:bot + 1]]


def block_size(px):
    """Native pixel size = gcd of every horizontal and vertical run length."""
    g = 0
    for row in px:
        run, prev = 0, None
        for c in row:
            k = None if transparent(c) else c
            if k == prev:
                run += 1
            else:
                if prev is not None:
                    g = math.gcd(g, run)
                run, prev = 1, k
        if prev is not None:
            g = math.gcd(g, run)
    for x in range(len(px[0])):
        run, prev = 0, None
        for y in range(len(px)):
            c = px[y][x]
            k = None if transparent(c) else c
            if k == prev:
                run += 1
            else:
                if prev is not None:
                    g = math.gcd(g, run)
                run, prev = 1, k
        if prev is not None:
            g = math.gcd(g, run)
    return max(1, g)


def downsample(px, n):
    h, w = len(px), len(px[0])
    out = []
    for y in range(0, h - n + 1, n):
        row = []
        for x in range(0, w - n + 1, n):
            row.append(px[y + n // 2][x + n // 2])
        out.append(row)
    return out


def to_grid(px):
    counts = {}
    for row in px:
        for c in row:
            if not transparent(c):
                counts[c[:3]] = counts.get(c[:3], 0) + 1
    order = sorted(counts, key=lambda c: -counts[c])
    if len(order) > len(CHARS):
        raise SystemExit(f'{len(order)} distinct colours, only {len(CHARS)} palette slots')
    key = {c: CHARS[i] for i, c in enumerate(order)}
    grid = [''.join('.' if transparent(c) else key[c[:3]] for c in row) for row in px]
    palette = {key[c]: '#%02x%02x%02x' % c for c in order}
    return grid, palette, {key[c]: counts[c] for c in order}


def main(path):
    w, h, px = png.read(path)
    px = trim(px)
    n = block_size(px)
    native = downsample(px, n)
    grid, palette, counts = to_grid(native)
    print(f'source {w}x{h} -> trimmed {len(px[0])}x{len(px)} -> native pixel {n}px -> grid {len(grid[0])}x{len(grid)}')
    print(f'{len(palette)} colours: ' + ', '.join(f'{k}={v}({counts[k]})' for k, v in palette.items()))
    body = ',\n    '.join(f"{k}: '{v}'" for k, v in palette.items())
    rows = ',\n    '.join(f"'{r}'" for r in grid)
    out = (f"export const SPRITE = {{\n  w: {len(grid[0])},\n  h: {len(grid)},\n"
           f"  palette: {{\n    {body},\n  }},\n  grid: [\n    {rows},\n  ],\n}}\n")
    pathlib.Path(path).with_suffix('.grid.js').write_text(out)
    print('wrote', pathlib.Path(path).with_suffix('.grid.js'))
    return grid, palette


if __name__ == '__main__':
    main(sys.argv[1])
