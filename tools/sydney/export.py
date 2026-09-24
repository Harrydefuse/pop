"""Ship the grid into the app as one flat module."""
import json, pathlib, sys
sys.path.insert(0, '.')

rows = pathlib.Path('terrain.txt').read_text().split('\n')
palette = json.loads(pathlib.Path('palette.json').read_text())

# rank 0 shows at any zoom, 1 once you are in a little, 2 up close.
PLACES = [
    ('cbd', 'The CBD', 151.209, -33.870, 0),
    ('bridge', 'Harbour Bridge', 151.211, -33.8523, 0),
    ('opera', 'Opera House', 151.2153, -33.8568, 0),
    ('bondi', 'Bondi', 151.274, -33.891, 0),
    ('manly', 'Manly', 151.287, -33.797, 0),
    ('mosman', 'Mosman', 151.244, -33.828, 0),
    ('quay', 'Circular Quay', 151.211, -33.861, 1),
    ('darling', 'Darling Harbour', 151.198, -33.872, 1),
    ('northsyd', 'North Sydney', 151.207, -33.838, 1),
    ('rose', 'Rose Bay', 151.266, -33.866, 1),
    ('centennial', 'Centennial Park', 151.239, -33.896, 1),
    ('heads', 'The Heads', 151.285, -33.823, 1),
    ('balmain', 'Balmain', 151.180, -33.858, 1),
    ('taronga', 'Taronga', 151.2413, -33.843, 1),
    ('watsons', 'Watsons Bay', 151.281, -33.842, 1),
    ('domain', 'The Domain', 151.218, -33.865, 2),
    ('hyde', 'Hyde Park', 151.210, -33.873, 2),
    ('barangaroo', 'Barangaroo', 151.201, -33.862, 2),
    ('surry', 'Surry Hills', 151.211, -33.885, 2),
    ('paddington', 'Paddington', 151.227, -33.885, 2),
    ('glebe', 'Glebe', 151.186, -33.879, 2),
    ('cremorne', 'Cremorne', 151.228, -33.828, 2),
    ('balmoral', 'Balmoral', 151.252, -33.823, 2),
    ('vaucluse', 'Vaucluse', 151.276, -33.857, 2),
    ('bradleys', 'Bradleys Head', 151.251, -33.852, 2),
    ('doublebay', 'Double Bay', 151.245, -33.878, 2),
    ('coogee', 'Coogee', 151.2560, -33.9200, 0),
    ('chatswood', 'Chatswood', 151.1830, -33.7970, 0),
    ('deewhy', 'Dee Why', 151.2870, -33.7540, 1),
    ('parramattariver', 'Parramatta River', 151.1550, -33.8380, 1),
    ('lanecove', 'Lane Cove River', 151.1650, -33.8180, 1),
    ('randwick', 'Randwick', 151.2410, -33.9130, 1),
    ('newtown', 'Newtown', 151.1790, -33.8980, 1),
    ('leichhardt', 'Leichhardt', 151.1560, -33.8830, 2),
    ('gladesville', 'Gladesville', 151.1330, -33.8330, 2),
    ('willoughby', 'Willoughby', 151.1990, -33.8030, 2),
    ('freshwater', 'Freshwater', 151.2880, -33.7790, 2),
    ('bronte', 'Bronte', 151.2680, -33.9040, 2),
    ('homebush', 'Homebush Bay', 151.1340, -33.8350, 2),
]

places = [{'id': i, 'name': n, 'lon': lo, 'lat': la, 'rank': r} for i, n, lo, la, r in PLACES]

head = '''// Sydney Harbour, drawn rather than photographed.
//
// A 180x180 terrain grid over an 18km square - one cell is 100 metres. The
// coastline is built from polygons of the real harbour: the channel in from the
// Heads, Middle Harbour running north, the bays cutting south past the CBD, and
// the ocean beaches from Manly down to Bondi. Everything else - woodland, city
// blocks, the shore band - is a pass over that, seeded so every build is
// identical.
//
// Each character is a terrain type. tiles.js turns each one into 8x8 of art;
// TERRAIN_COLOURS is the flat colour behind it, for legends and small previews.
'''

out = [head, 'export const SYDNEY = {', '  w: 180,', '  h: 180,', '  bbox: [151.13, -33.922, 151.325, -33.76],',
       '  places: ' + json.dumps(places, separators=(',', ':')) + ',',
       '  rows: [' + ','.join(json.dumps(r) for r in rows) + '],', '}', '',
       'export const TERRAIN_COLOURS = ' + json.dumps(palette, separators=(',', ':')), '']
(pathlib.Path(__file__).resolve().parents[2] / 'src/game/sydney.js').write_text('\n'.join(out))
print('rows', len(rows), 'places', len(places))
