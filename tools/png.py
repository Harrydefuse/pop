"""Minimal PNG reader/writer. No PIL in this environment, and the sprite
pipeline only needs truecolour RGB/RGBA plus palette images."""
import zlib, struct


def read(path):
    data = open(path, 'rb').read()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', 'not a PNG'
    pos, idat, plte, trns, hdr = 8, b'', None, None, None
    while pos < len(data):
        (ln,) = struct.unpack('>I', data[pos:pos + 4])
        typ = data[pos + 4:pos + 8]
        body = data[pos + 8:pos + 8 + ln]
        if typ == b'IHDR':
            hdr = struct.unpack('>IIBBBBB', body)
        elif typ == b'IDAT':
            idat += body
        elif typ == b'PLTE':
            plte = body
        elif typ == b'tRNS':
            trns = body
        elif typ == b'IEND':
            break
        pos += 12 + ln
    w, h, depth, ctype, comp, filt, interlace = hdr
    assert depth == 8, f'only 8-bit supported, got {depth}'
    assert interlace == 0, 'interlaced PNG not supported'
    channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ctype]
    raw = zlib.decompress(idat)
    bpp = channels
    stride = w * bpp
    out, prev = [], bytearray(stride)
    p = 0
    for _ in range(h):
        f = raw[p]; p += 1
        line = bytearray(raw[p:p + stride]); p += stride
        for i in range(stride):
            a = line[i - bpp] if i >= bpp else 0
            b = prev[i]
            c = prev[i - bpp] if i >= bpp else 0
            if f == 1:
                line[i] = (line[i] + a) & 255
            elif f == 2:
                line[i] = (line[i] + b) & 255
            elif f == 3:
                line[i] = (line[i] + (a + b) // 2) & 255
            elif f == 4:
                pa, pb, pc = abs(b - c), abs(a - c), abs(a + b - 2 * c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 255
        out.append(line)
        prev = line

    px = []
    for line in out:
        row = []
        for x in range(w):
            v = line[x * bpp:(x + 1) * bpp]
            if ctype == 2:
                row.append((v[0], v[1], v[2], 255))
            elif ctype == 6:
                row.append((v[0], v[1], v[2], v[3]))
            elif ctype == 0:
                row.append((v[0], v[0], v[0], 255))
            elif ctype == 4:
                row.append((v[0], v[0], v[0], v[1]))
            else:
                i = v[0]
                a = trns[i] if trns and i < len(trns) else 255
                row.append((plte[i * 3], plte[i * 3 + 1], plte[i * 3 + 2], a))
        px.append(row)
    return w, h, px


def _chunk(t, d):
    return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)


def write(path, px, scale=1):
    h, w = len(px), len(px[0])
    buf = b''
    for row in px:
        line = b''.join(bytes(c[:3]) * scale for c in row)
        buf += (b'\x00' + line) * scale
    png = b'\x89PNG\r\n\x1a\n' + _chunk(b'IHDR', struct.pack('>IIBBBBB', w * scale, h * scale, 8, 2, 0, 0, 0))
    png += _chunk(b'IDAT', zlib.compress(buf, 9)) + _chunk(b'IEND', b'')
    open(path, 'wb').write(png)
