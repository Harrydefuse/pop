"""Turn a pixel-art PNG into the character-grid + palette format the game uses.

Detects the native pixel size (art exported at 8x still transcribes to its true
grid), trims the margin, and assigns one palette character per distinct colour.
Output is byte-exact: no resampling, no colour approximation.

    python3 tools/png2grid.py frost-adult.png
    python3 tools/png2grid.py frost-adult.png --canvas 50x44 --name FROST_ADULT

`--canvas WxH` is what a growth series needs. Trimming alone sizes every grid
to its own subject, so five drawings of the same pet come back as five
different grids and the animal appears to jump around between stages. On a
fixed canvas each one is centred horizontally and stood on the floor, so the
feet land in the same place at every stage and only the creature changes.
"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import png

CHARS = 'abcdefghijklmnpqrstuvwxyzABCDEFGHIJKLMNPQRSTUVWXYZ0123456789#$%&@=+~^'


def transparent(c, bg_tol=8):
    """A pixel counts as background if it is clear, near-white, or magenta.

    Magenta because art/README.md offers it as the alternative to alpha for
    tools that make transparency awkward, and it was the one importer that did
    not honour the offer.
    """
    r, g, b, a = c
    if a < 24:
        return True
    if r > 250 and g < 6 and b > 250:
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


def fit(grid, w, h):
    """Stand the drawing on a fixed canvas: centred across, feet on the floor.

    Bottom-anchored rather than centred vertically, because a creature that
    grows does it upward and outward from where it stands. Centring would slide
    the feet up the frame every time the art got taller.
    """
    gw, gh = len(grid[0]), len(grid)
    if gw > w or gh > h:
        raise SystemExit(f'grid is {gw}x{gh}, which does not fit the {w}x{h} canvas')
    left = (w - gw) // 2
    rows = [('.' * left + r).ljust(w, '.') for r in grid]
    return ['.' * w] * (h - gh) + rows


def main(path, canvas=None, name='SPRITE'):
    w, h, px = png.read(path)
    cut = trim(px)
    n = block_size(cut)
    note = f'source {w}x{h} -> trimmed {len(cut[0])}x{len(cut)} -> native pixel {n}px'

    # Drawn on the canvas already — a file painted over one of the templates —
    # so the placement is the artist's and is kept exactly. Only a drawing that
    # sized itself gets centred and stood on the floor, which is the case
    # `fit` exists for.
    as_drawn = downsample(px, n) if canvas and w % n == 0 and h % n == 0 else None
    if as_drawn and (len(as_drawn[0]), len(as_drawn)) == tuple(canvas):
        grid, palette, counts = to_grid(as_drawn)
        note += f' -> canvas {canvas[0]}x{canvas[1]}, placed as drawn'
    else:
        grid, palette, counts = to_grid(downsample(cut, n))
        note += f' -> grid {len(grid[0])}x{len(grid)}'
        if canvas:
            grid = fit(grid, *canvas)
            note += f' -> canvas {canvas[0]}x{canvas[1]}, centred and stood on the floor'
    print(note)
    print(f'{len(palette)} colours: ' + ', '.join(f'{k}={v}({counts[k]})' for k, v in palette.items()))
    body = ',\n    '.join(f"{k}: '{v}'" for k, v in palette.items())
    rows = ',\n    '.join(f"'{r}'" for r in grid)
    out = (f"export const {name} = {{\n  w: {len(grid[0])},\n  h: {len(grid)},\n"
           f"  palette: {{\n    {body},\n  }},\n  grid: [\n    {rows},\n  ],\n}}\n")
    pathlib.Path(path).with_suffix('.grid.js').write_text(out)
    print('wrote', pathlib.Path(path).with_suffix('.grid.js'))
    return grid, palette


def cli(argv):
    if not argv:
        raise SystemExit('usage: png2grid.py FILE.png [--canvas WxH] [--name IDENT]')
    path, canvas, name = argv[0], None, 'SPRITE'
    rest = argv[1:]
    while rest:
        flag = rest.pop(0)
        if flag == '--canvas':
            canvas = tuple(int(v) for v in rest.pop(0).lower().split('x'))
        elif flag == '--name':
            name = rest.pop(0)
        else:
            raise SystemExit(f'unknown option {flag}')
    return main(path, canvas, name)


if __name__ == '__main__':
    cli(sys.argv[1:])
