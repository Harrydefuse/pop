"""Render sprite grids to a PNG so the art can be looked at while it is drawn.

Judging a fifty-pixel nine-colour sprite from a wall of letters does not work.
This writes a scaled-up sheet straight to disk with nothing but zlib, so the
loop is edit, render, compare against the reference, fix.
"""

import struct
import zlib


def png(path, pixels, w, h, scale=8):
    raw = b''
    for y in range(h):
        for _ in range(scale):
            row = b'\x00'
            for x in range(w):
                row += bytes(pixels[y][x]) * scale
            raw += row
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    ihdr = struct.pack('>IIBBBBB', w * scale, h * scale, 8, 6, 0, 0, 0)
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))


def hexrgb(s):
    s = s.lstrip('#')
    return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16), 255)


def sheet(path, entries, scale=8, gap=2, bg='#000000'):
    cell_w = max(len(g[0]) for g, _ in entries)
    cell_h = max(len(g) for g, _ in entries)
    w = (cell_w + gap) * len(entries) + gap
    h = cell_h + gap * 2
    ground = hexrgb(bg)
    px = [[ground] * w for _ in range(h)]
    for i, (grid, pal) in enumerate(entries):
        ox = gap + i * (cell_w + gap)
        for y, row in enumerate(grid):
            for x, c in enumerate(row):
                if c == '.':
                    continue
                px[gap + y][ox + x] = hexrgb(pal[c])
    png(path, px, w, h, scale)
