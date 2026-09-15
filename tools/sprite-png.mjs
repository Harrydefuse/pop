/**
 * Export a sprite from the game back out as a PNG, so it can be opened in a
 * pixel editor and drawn on.
 *
 * The round trip has only ever run one way: tools/png2grid.py brings art in.
 * Getting a drawing back out meant screenshotting the app, which hands you
 * whatever the browser scaled it to rather than the pixels that are actually
 * stored. This writes the grid exactly — one image pixel per sprite pixel at
 * 1x, nothing resampled, transparent where the grid is.
 *
 *   node tools/sprite-png.mjs ember out/            # 1x and 10x
 *   node tools/sprite-png.mjs ember out/ --scale 16
 *   node tools/sprite-png.mjs --list
 *
 * Names are pet ids (ember, frost, zeus, ...), chests (crate, loot, vault) or
 * anything else in the table below.
 */
import { createServer } from 'vite'
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const CRC = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return (buf) => {
    let c = -1
    for (const b of buf) c = t[(c ^ b) & 0xff] ^ (c >>> 8)
    return (c ^ -1) >>> 0
  }
})()

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(CRC(body))
  return Buffer.concat([len, body, crc])
}

/** RGBA PNG, colour type 6. Alpha is the point — a sprite is mostly nothing. */
function writePng(file, px, w, h) {
  const raw = Buffer.alloc(h * (1 + w * 4))
  let o = 0
  for (let y = 0; y < h; y++) {
    raw[o++] = 0
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = px[y][x]
      raw[o++] = r
      raw[o++] = g
      raw[o++] = b
      raw[o++] = a
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  writeFileSync(
    file,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  )
}

const rgba = (hex) => {
  if (!hex) return [0, 0, 0, 0]
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255]
}

function pixels(sprite, scale) {
  const { w, h, grid, palette } = sprite
  const out = []
  for (let y = 0; y < h * scale; y++) {
    const row = []
    for (let x = 0; x < w * scale; x++) {
      const ch = (grid[Math.floor(y / scale)] ?? '')[Math.floor(x / scale)]
      row.push(ch && ch !== '.' ? rgba(palette[ch]) : [0, 0, 0, 0])
    }
    out.push(row)
  }
  return out
}

const server = await createServer({
  root: new URL('..', import.meta.url).pathname,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
})
const s = await server.ssrLoadModule('/src/game/sprites.js')

// Everything worth handing to an artist, under the name they would ask for.
const TABLE = {
  ...s.PET_SPRITES,
  crate: s.CHEST_SPRITE,
  loot: s.LOOT_CHEST_SPRITE,
  vault: s.VAULT_SPRITE,
  hero: s.heroSprite?.(),
  map: s.MAP_ICON,
}

const args = process.argv.slice(2)
if (args.includes('--list') || !args.length) {
  console.log('names:', Object.keys(TABLE).filter((k) => TABLE[k]).join(', '))
  await server.close()
  process.exit(0)
}

const [name, dir = '.'] = args
const scaleArg = args.indexOf('--scale')
const scales = scaleArg > -1 ? [1, Number(args[scaleArg + 1])] : [1, 10]
const sprite = TABLE[name]
if (!sprite) {
  console.error(`no sprite called "${name}". Try --list.`)
  await server.close()
  process.exit(1)
}

mkdirSync(dir, { recursive: true })
for (const scale of scales) {
  const file = path.join(dir, scale === 1 ? `${name}.png` : `${name}@${scale}x.png`)
  writePng(file, pixels(sprite, scale), sprite.w * scale, sprite.h * scale)
  console.log(`${file}  ${sprite.w * scale}x${sprite.h * scale}`)
}
console.log(`grid ${sprite.w}x${sprite.h}, ${Object.keys(sprite.palette).length} colours`)
await server.close()
