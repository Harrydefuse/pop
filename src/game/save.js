// Moving a character between devices, without a server to keep it on.
//
// Everything this game knows about you lives in one object in your browser.
// That is the honest constraint until there are accounts: so the whole save
// travels as a code you copy — no login, no sync, no one else holding it.

const MAGIC = 'LVL100.1|'

export function encodeSave(state) {
  const json = JSON.stringify({ ...state, toasts: [], reward: null })
  // Latin-1 only, so widen first — names carry accents and emoji.
  return MAGIC + btoa(String.fromCharCode(...new TextEncoder().encode(json)))
}

export function decodeSave(code) {
  const trimmed = String(code).trim().replace(/\s+/g, '')
  if (!trimmed.startsWith(MAGIC.replace('|', '')) && !trimmed.startsWith(MAGIC)) return null
  try {
    const body = trimmed.slice(trimmed.indexOf('|') + 1)
    const bytes = Uint8Array.from(atob(body), (c) => c.charCodeAt(0))
    const parsed = JSON.parse(new TextDecoder().decode(bytes))
    return parsed?.player?.name ? parsed : null
  } catch {
    return null
  }
}
