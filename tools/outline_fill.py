"""Turn a line-art outline into a painted character.

Given a closed outline drawn on the sprite grid, this finds every region the
lines enclose, so each one can be assigned a material — hair here, face there,
arms, legs. The silhouette then comes from the drawing rather than from
anything I invent, which is the whole point of working from an outline."""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import png

INK = 128          # anything darker than this counts as a line


def load(path):
    w, h, px = png.read(path)
    ink = [[(p[3] > 40 and (p[0] + p[1] + p[2]) / 3 < INK) for p in row] for row in px]
    return w, h, ink


def block_size(ink, w, h):
    """Native pixel size, from the gcd of every run of identical cells."""
    g = 0
    for row in ink:
        run, prev = 0, None
        for v in row:
            if v == prev:
                run += 1
            else:
                if prev is not None:
                    g = math.gcd(g, run)
                run, prev = 1, v
        g = math.gcd(g, run)
    for x in range(w):
        run, prev = 0, None
        for y in range(h):
            v = ink[y][x]
            if v == prev:
                run += 1
            else:
                if prev is not None:
                    g = math.gcd(g, run)
                run, prev = 1, v
        g = math.gcd(g, run)
    return max(1, g)


def downsample(ink, w, h, n):
    gw, gh = w // n, h // n
    out = []
    for gy in range(gh):
        row = []
        for gx in range(gw):
            hits = sum(
                ink[gy * n + dy][gx * n + dx]
                for dy in range(n)
                for dx in range(n)
            )
            row.append(hits > n * n * 0.35)
        out.append(row)
    return out, gw, gh


def regions(grid, gw, gh):
    """Flood from the border to find outside; everything else is an enclosure."""
    seen = [[False] * gw for _ in range(gh)]
    stack = [(0, x) for x in range(gw)] + [(gh - 1, x) for x in range(gw)]
    stack += [(y, 0) for y in range(gh)] + [(y, gw - 1) for y in range(gh)]
    outside = set()
    while stack:
        y, x = stack.pop()
        if not (0 <= y < gh and 0 <= x < gw) or seen[y][x] or grid[y][x]:
            continue
        seen[y][x] = True
        outside.add((y, x))
        stack += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]

    labels, out = [[None] * gw for _ in range(gh)], []
    for y in range(gh):
        for x in range(gw):
            if grid[y][x] or (y, x) in outside or labels[y][x] is not None:
                continue
            idx = len(out)
            cells, stack = [], [(y, x)]
            while stack:
                cy, cx = stack.pop()
                if not (0 <= cy < gh and 0 <= cx < gw):
                    continue
                if grid[cy][cx] or labels[cy][cx] is not None or (cy, cx) in outside:
                    continue
                labels[cy][cx] = idx
                cells.append((cy, cx))
                stack += [(cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)]
            ys = [c[0] for c in cells]
            xs = [c[1] for c in cells]
            out.append({'id': idx, 'cells': cells, 'n': len(cells),
                        'y0': min(ys), 'y1': max(ys), 'x0': min(xs), 'x1': max(xs)})
    return labels, out, outside


def main(path):
    w, h, ink = load(path)
    n = block_size(ink, w, h)
    grid, gw, gh = downsample(ink, w, h, n)
    labels, regs, outside = regions(grid, gw, gh)
    print(f'{path}\n  source {w}x{h} -> native pixel {n}px -> grid {gw}x{gh}')
    print(f'  {sum(sum(r) for r in grid)} line cells, {len(regs)} enclosed regions')
    for r in sorted(regs, key=lambda r: -r['n']):
        print(f"    region {r['id']:>2}: {r['n']:>4} cells   rows {r['y0']}-{r['y1']}   cols {r['x0']}-{r['x1']}")
    pathlib.Path('outline.grid.txt').write_text(
        '\n'.join(''.join('#' if grid[y][x] else ('.' if (y, x) in outside else str(labels[y][x] % 10))
                          for x in range(gw)) for y in range(gh)))
    print('  wrote outline.grid.txt')
    return grid, labels, regs, gw, gh


if __name__ == '__main__':
    main(sys.argv[1])
