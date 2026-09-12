/**
 * Light or dark, remembered per device.
 *
 * The whole theme is CSS custom properties, so switching is one attribute on
 * <html> — no component re-renders to repaint, no colours passed down a tree.
 * The value is read and applied at import time, before React's first render,
 * because applying it in an effect means a frame of the wrong theme on every
 * open, and on a dark-mode device that frame is a flash of white.
 */
const KEY = 'lvl100.theme'

export const THEMES = ['light', 'dark']

/**
 * Light until someone says otherwise. The app is designed light — the paper
 * ground, the deep accents and the sprite art were all drawn for it — so dark
 * is a choice a player makes, not something a phone's setting makes for them.
 * Following prefers-color-scheme instead is one line here if that changes.
 */
export const DEFAULT_THEME = 'light'

export function readTheme() {
  try {
    const saved = localStorage.getItem(KEY)
    if (THEMES.includes(saved)) return saved
  } catch {
    /* private mode, storage disabled — everyone gets the default */
  }
  return DEFAULT_THEME
}

export function applyTheme(theme) {
  const next = THEMES.includes(theme) ? theme : 'light'
  document.documentElement.dataset.theme = next
  try {
    localStorage.setItem(KEY, next)
  } catch {
    /* the theme still applies for this session, it just will not be remembered */
  }
  return next
}

// Paint the right theme before anything renders.
if (typeof document !== 'undefined') document.documentElement.dataset.theme = readTheme()
