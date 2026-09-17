"""Turn the game logos in art/logos/ into inlined art the app can draw.

The logos are real brand marks, so they cannot be drawn from a description or
generated — somebody has to put the actual files in. This reads whatever is in
`art/logos/`, squares it up, trims the dead space around the mark, downsizes it
to something sane for a 34px chip on a 2x screen, and writes the whole lot out
as base64 data URIs.

Inlined rather than served, for the same reason every other asset here is: the
app makes zero network requests, and a profile that loads its logos from the
internet is a profile that is broken on the tube.

    python3 tools/import_logos.py [art/logos] [src/game/logoArt.js]
                                  [--clear overwatch,rainbow]

One file per game, named for the id the app knows it by:

    valorant.png  cs.png  apex.png  fortnite.png  cod.png  overwatch.png
    rainbow.png   marvelrivals.png  lol.png  dota.png  rocket.png
    fifa.png      nba2k.png  minecraft.png  roblox.png  gta.png
    fighting.png  mmo.png  shooter.png  other.png

Transparent PNG is best. A white-background PNG works too — a mark sitting on
a solid white square looks wrong on the dark theme, so a uniform border colour
is detected and knocked out.
"""

import base64
import io
import pathlib
import sys

try:
    from PIL import Image
except ImportError:
    raise SystemExit('needs Pillow: pip install Pillow')

# Drawn at 34px, and phones are 2x or 3x, so 96 covers it with room to spare
# without anybody noticing the file size.
SIZE = 96

# How close to the corner colour a pixel has to be before it counts as
# background. Generous, because a "white" export is rarely all 255s.
TOLERANCE = 18


def knockout(im, everywhere=False):
    """Drop a uniform background, if the image has one.

    Only fires when all four corners agree — a logo that genuinely reaches its
    own corners keeps every pixel it came with.

    By default it floods in from the edges, so white that is enclosed by the
    mark survives. That is right for most logos and wrong for the ones whose
    inner shape is meant to be see-through — the Overwatch ring, say, where
    the white inside it should show the card, not sit on it. `everywhere`
    removes every matching pixel instead.
    """
    im = im.convert('RGBA')
    w, h = im.size
    px = im.load()
    corners = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
    if any(c[3] < 200 for c in corners):
        return im  # already has transparency; leave it alone
    first = corners[0]
    for c in corners[1:]:
        if max(abs(a - b) for a, b in zip(c[:3], first[:3])) > TOLERANCE:
            return im  # corners disagree, so there is no background to drop

    # Only a near-white or near-black surround is treated as background. A flat
    # colour is usually the logo — Fortnite's blue tile and Minecraft's grass
    # block are the mark, and knocking either out would leave a letter floating
    # in space. Those two happen to have gradients that the corner test already
    # catches, but the next one might not.
    lum = 0.299 * first[0] + 0.587 * first[1] + 0.114 * first[2]
    if 24 < lum < 232:
        return im

    if everywhere:
        for y in range(h):
            for x in range(w):
                r, g, b, a = px[x, y]
                if a >= 200 and max(abs(v - u) for v, u in zip((r, g, b), first[:3])) <= TOLERANCE:
                    px[x, y] = (r, g, b, 0)
        return im

    # Flood from the edges rather than removing every matching pixel, so white
    # that the mark encloses is kept.
    seen = set()
    stack = [(x, y) for x in range(w) for y in (0, h - 1)]
    stack += [(x, y) for y in range(h) for x in (0, w - 1)]
    while stack:
        x, y = stack.pop()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h):
            continue
        seen.add((x, y))
        r, g, b, a = px[x, y]
        if a < 200 or max(abs(v - u) for v, u in zip((r, g, b), first[:3])) > TOLERANCE:
            continue
        px[x, y] = (r, g, b, 0)
        stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    return im


def ink(im):
    """Whether this logo can be seen on any ground, or needs one of its own.

    A logo drawn in a single tone is invisible against a card of that tone:
    Overwatch is white and vanishes on the light theme, Rainbow Six is black
    and vanishes on the dark one. Measured rather than configured, because the
    next logo somebody adds will have the same problem and nobody will
    remember this rule.

    Returns 'light' for a logo that needs a dark plate behind it, 'dark' for
    one that needs a light plate, and 'mixed' for everything that carries its
    own contrast.
    """
    px = im.convert('RGBA').load()
    w, h = im.size
    light = dark = n = 0
    step = max(1, min(w, h) // 64)
    for y in range(0, h, step):
        for x in range(0, w, step):
            r, g, b, a = px[x, y]
            if a < 128:
                continue
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            n += 1
            if lum > 200:
                light += 1
            elif lum < 60:
                dark += 1
    if not n:
        return 'mixed'
    # Judged on the bulk of the mark, not its extremes. Overwatch has one
    # orange arc on an otherwise white logo, and a min/max test called that
    # "mixed" and then let it disappear on a white card.
    if light / n > 0.6:
        return 'light'
    if dark / n > 0.6:
        return 'dark'
    return 'mixed'


def square(im):
    """Trim to the mark, then centre it on a transparent square.

    Logos arrive with wildly different amounts of padding baked in — the
    Fortnite one is edge to edge, the League one floats in a wide frame. Without
    this the row of chips looks like it was assembled by four different people.
    """
    box = im.getbbox()
    if box:
        im = im.crop(box)
    w, h = im.size
    side = max(w, h)
    pad = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    pad.paste(im, ((side - w) // 2, (side - h) // 2))
    return pad


def main(src_dir, out_path, everywhere=()):
    src = pathlib.Path(src_dir)
    if not src.is_dir():
        raise SystemExit(f'no such directory: {src}')

    entries = []
    for f in sorted(src.iterdir()):
        if f.suffix.lower() not in ('.png', '.jpg', '.jpeg', '.webp'):
            continue
        # Named for the game id, which is lower case — Valorant.png is the
        # same logo as valorant.png and should not miss its game.
        key = f.stem.lower()
        im = square(knockout(Image.open(f), key in everywhere))
        im = im.resize((SIZE, SIZE), Image.LANCZOS)
        tone = ink(im)
        buf = io.BytesIO()
        im.save(buf, 'PNG', optimize=True)
        b64 = base64.b64encode(buf.getvalue()).decode()
        entries.append((key, b64, len(buf.getvalue()), tone))
        print(f'{f.name:>24} -> {key:<14} {len(buf.getvalue()) / 1024:6.1f} kB  {tone}')

    if not entries:
        raise SystemExit(f'nothing to import from {src}')

    body = ',\n'.join(f"  {k}: {{ ink: '{t}', src: '{b}' }}" for k, b, _, t in entries)
    out = (
        '// Generated by tools/import_logos.py from art/logos/. Do not edit by\n'
        '// hand — re-run the tool instead.\n'
        '//\n'
        "// These are the games' own logos, each the trademark of its owner, used\n"
        '// only to identify the game somebody plays. Inlined as base64 so the app\n'
        '// still makes no network requests.\n'
        '\n'
        '/**\n'
        ' * Game id to its logo: a 96x96 PNG, trimmed and centred, plus whether the\n'
        " * mark carries its own contrast. 'light' and 'dark' logos are drawn in one\n"
        ' * tone and need a plate behind them or they vanish on one of the themes.\n'
        ' */\n'
        'export const LOGO_ART = {\n'
        f'{body},\n'
        '}\n'
    )
    pathlib.Path(out_path).write_text(out)
    total = sum(n for _, _, n, _t in entries)
    print(f'\nwrote {out_path} — {len(entries)} logos, {total / 1024:.0f} kB raw')


if __name__ == '__main__':
    # --clear a,b,c names the logos whose enclosed background should go too.
    argv = sys.argv[1:]
    clear = ()
    if '--clear' in argv:
        i = argv.index('--clear')
        clear = tuple(argv[i + 1].split(','))
        argv = argv[:i] + argv[i + 2:]
    main(
        argv[0] if len(argv) > 0 else 'art/logos',
        argv[1] if len(argv) > 1 else 'src/game/logoArt.js',
        clear,
    )
