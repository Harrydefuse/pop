"""Authoring helpers for the pet sprites.

Two things make a 50x44 creature drawable by hand. The first is that the
silhouette is painted as spans rather than counted out as dots in a string, so
a leg is `span(33, 38, 'b')` and not an exercise in arithmetic. The second is
that the outline is derived: everything gets a one-pixel dark border for free,
which is most of what separates pixel art from a smear.
"""

import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from preview import png, hexrgb

W, H = 50, 44


class Art:
    def __init__(self, w=W, h=H):
        self.w, self.h = w, h
        self.g = [['.'] * w for _ in range(h)]
        self.mark = None

    def span(self, y, x0, x1, ch):
        for x in range(x0, x1 + 1):
            if 0 <= x < self.w and 0 <= y < self.h:
                self.g[y][x] = ch
                if self.mark is not None:
                    self.mark.add((y, x))

    def part(self):
        """Start tracking a limb, so edge() can draw its own border."""
        self.mark = set()
        return self

    def edge(self, ch='o'):
        """Border the tracked limb even where it lies on top of the body.

        A flat silhouette in one colour reads as a blob however carefully it is
        shaped; the internal edges are what separate an arm from a chest."""
        cells, self.mark = self.mark or set(), None
        near = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
        for y, x in sorted(cells):
            for dy, dx in near:
                ny, nx = y + dy, x + dx
                if 0 <= ny < self.h and 0 <= nx < self.w and (ny, nx) not in cells:
                    self.g[ny][nx] = ch
        return self

    def rows(self, spec):
        """spec: {y: [(x0, x1, ch), ...]} applied in order."""
        for y in sorted(spec):
            for x0, x1, ch in spec[y]:
                self.span(y, x0, x1, ch)

    def px(self, x, y, ch):
        self.span(y, x, x, ch)

    def shift(self, dy=0, dx=0):
        """Drop the whole drawing onto a common ground line."""
        g = [['.'] * self.w for _ in range(self.h)]
        for y in range(self.h):
            for x in range(self.w):
                ny, nx = y + dy, x + dx
                if self.g[y][x] != '.' and 0 <= ny < self.h and 0 <= nx < self.w:
                    g[ny][nx] = self.g[y][x]
        self.g = g
        return self

    def line(self, x0, y0, x1, y1, ch, thick=1):
        """A drawn stroke: wing fingers, horns, the seams in a hide."""
        steps = max(abs(x1 - x0), abs(y1 - y0))
        for i in range(steps + 1):
            t = i / max(1, steps)
            x = round(x0 + (x1 - x0) * t)
            y = round(y0 + (y1 - y0) * t)
            for dy in range(thick):
                self.span(y + dy, x, x + thick - 1, ch)
        return self

    def outline(self, ch='o', diagonal=True):
        """Border every painted cell. Done last, so shading never leaks out."""
        near = [(-1, 0), (1, 0), (0, -1), (0, 1)]
        if diagonal:
            near += [(-1, -1), (-1, 1), (1, -1), (1, 1)]
        add = []
        for y in range(self.h):
            for x in range(self.w):
                if self.g[y][x] != '.':
                    continue
                for dy, dx in near:
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < self.h and 0 <= nx < self.w and self.g[ny][nx] not in ('.', ch):
                        add.append((y, x))
                        break
        for y, x in add:
            self.g[y][x] = ch
        return self

    def grid(self):
        return [''.join(r) for r in self.g]


def look(path, entries, scale=9, gap=3, bg='#12101a'):
    """Contact sheet: every pet side by side at the size a player sees them."""
    cw = max(len(g[0]) for g, _ in entries)
    ch = max(len(g) for g, _ in entries)
    w = (cw + gap) * len(entries) + gap
    h = ch + gap * 2
    px = [[hexrgb(bg)] * w for _ in range(h)]
    for i, (grid, pal) in enumerate(entries):
        ox = gap + i * (cw + gap)
        for y, row in enumerate(grid):
            for x, c in enumerate(row):
                if c != '.':
                    px[gap + y][ox + x] = hexrgb(pal[c])
    png(path, px, w, h, scale)


def emit(name, sprite):
    """Print a sprite as the JS literal that goes into src/game/sprites.js."""
    pal = ', '.join(f"{k}: '{v}'" for k, v in sprite['palette'].items())
    body = ',\n'.join(f"    '{r}'" for r in sprite['grid'])
    return (f"export const {name} = {{\n  id: '{sprite['id']}',\n  w: {len(sprite['grid'][0])},"
            f"\n  h: {len(sprite['grid'])},\n  palette: {{ {pal} }},\n  grid: [\n{body},\n  ],\n}}\n")
