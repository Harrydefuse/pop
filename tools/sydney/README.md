# The Sydney map

The map on the MAP tab is generated, not hand-typed. Three passes:

    python3 coast.py      # water: the ocean, Port Jackson, the bays and inlets
    python3 terrain.py    # everything on the land, and terrain.png to look at
    python3 export.py     # writes src/game/sydney.js

Run them from inside this directory, in that order — each one imports the last.
Seeded, so the same source always produces the same map.

`coast.py` is the part that matters. Port Jackson is traced headland by headland
from real coordinates: get Bradleys Head or Cremorne Point wrong and the north
shore sits a kilometre too far north, which puts Taronga in open water. Winding
inlets — Middle Harbour, North Harbour — are stroked polylines rather than
polygons, because a polygon there fills as a blob.

The grid is 120x120 over a 12km square, so one cell is 100 metres:

    west 151.170   east 151.300
    north -33.790  south -33.900

`src/game/tiles.js` turns each terrain character into 8x8 of drawn art at
runtime. Nothing here needs to know about that.

## If you have an OSM extract

This is all hand-traced because the build environment cannot reach
overpass-api.de. Given a real extract, the coastline polygons in `coast.py` can
be replaced with the actual ways and everything downstream still works — the
rest of the pipeline only cares that `rasterise()` returns a water grid.
