"""Transcribe the scroll-map reference in art/ into the header's map button.

The source is a soft AI render, not clean pixel art, so it is resampled on its
own ink box with mode-per-cell against a fixed thirteen-colour palette: the
dominant colour inside a cell wins, which keeps the outline hard instead of
smearing it into the parchment the way an average would.
"""
import sys, pathlib
from collections import Counter

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import png

SRC = pathlib.Path(__file__).resolve().parents[1] / 'art' / 'ChatGPT Image Aug 30, 2026, 10_07_45 PM.png'
BG = (207, 206, 206)
W = H = 24

PAL = {
    'o': '#0d0b12',  # outline
    'p': '#f7dc9a',  # parchment
    'P': '#efcb7d',  # parchment shade
    'r': '#e6a860',  # curl of the roll
    'n': '#9c6b33',  # inside of the roll
    'g': '#4c9c30',  # scrub
    'G': '#38761f',  # deep scrub
    'b': '#0e84cc',  # river
    'B': '#0a5f99',  # river bed
    'w': '#f2f2f2',  # compass case
    'k': '#3a3a3a',  # compass face, keep
    'a': '#a8a8a8',  # compass rim
    'x': '#e85018',  # north needle
}
RGB = {k: tuple(int(v[i:i + 2], 16) for i in (1, 3, 5)) for k, v in PAL.items()}


def is_bg(p):
    return all(abs(p[i] - BG[i]) < 16 for i in range(3))


def key(c):
    return min(RGB, key=lambda k: sum((RGB[k][i] - c[i]) ** 2 for i in range(3)))


def main():
    w, h, px = png.read(str(SRC))
    ys = [y for y in range(h) if any(not is_bg(px[y][x]) for x in range(w))]
    xs = [x for x in range(w) if any(not is_bg(px[y][x]) for y in range(h))]
    x0, x1, y0, y1 = xs[0], xs[-1], ys[0], ys[-1]
    sw, sh = (x1 - x0 + 1) / W, (y1 - y0 + 1) / H
    rows = []
    for gy in range(H):
        line = ''
        for gx in range(W):
            c = Counter()
            ya, yb = int(y0 + gy * sh), int(y0 + (gy + 1) * sh)
            xa, xb = int(x0 + gx * sw), int(x0 + (gx + 1) * sw)
            for y in range(ya, max(ya + 1, yb)):
                for x in range(xa, max(xa + 1, xb)):
                    p = px[y][x][:3]
                    c['.' if is_bg(p) else key(p)] += 1
            line += c.most_common(1)[0][0]
        rows.append(line)

    pal = ', '.join(f"{k}: '{v}'" for k, v in PAL.items())
    body = ',\n'.join(f"    '{r}'" for r in rows)
    print(f"""export const MAP_ICON = {{
  w: {W},
  h: {H},
  palette: {{ {pal} }},
  grid: [
{body},
  ],
}}""")


if __name__ == '__main__':
    main()
