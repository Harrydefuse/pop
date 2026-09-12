# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** LVL100
**Generated:** 2026-08-17 03:11:32
**Category:** Arcade & Retro Game
**Design Dials:** Variance 8/10 (Bold / Asymmetric) | Motion 5/10 (Standard) | Density 7/10 (Standard)

---

## AS BUILT — authoritative

The section below this one is the raw generated recommendation, kept for reference. Where the two
disagree, **this section wins** — it documents what is actually in `src/index.css`, and every
deviation was deliberate.

### Tokens in use (`@theme` in `src/index.css`)

| Role | Token | Hex | Contrast on `--color-panel` |
|------|-------|-----|------------------------------|
| Background | `--color-void` | `#07060d` | — |
| Surface | `--color-panel` | `#120d20` | — |
| Raised surface | `--color-panel-2` | `#1a1230` | — |
| Hairline | `--color-line` | `#3a2a57` | — |
| Primary | `--color-neon` | `#a855f7` | 4.81:1 |
| Secondary signal | `--color-cyan` | `#22d3ee` | 10.5:1 |
| Success / gains | `--color-lime` | `#a3e635` | 12.6:1 |
| Currency | `--color-gold` | `#fbbf24` | 11.4:1 |
| Raid / danger | `--color-danger` | `#f43f5e` | 5.18:1 |
| Body text | `--color-ink` | `#f2ecff` | 16.5:1 |
| Secondary text | `--color-ink-dim` | `#a394c4` | 6.87:1 |
| Muted text | `--color-ink-faint` | `#8b7dae` | 4.81:1 |

Rarity ladder: common `#b8bfcc` · uncommon `#4ade80` · rare `#38bdf8` · epic `#c084fc` ·
legendary `#f59e0b`. All clear 7:1 on every surface.

**Every text token clears 4.5:1 on all three surfaces.** `--color-ink-faint` was originally
`#6b5f88` (3.08:1) and was lifted after measurement — it carries 9–11px caption text, so "muted"
must never mean "below the contrast floor".

### Deliberate deviations from the generated recommendation

| Item | Recommended | Shipped | Why |
|------|-------------|---------|-----|
| Body font | VT323 | Chakra Petch | VT323 is a pixel face; at 11–12px body sizes it is genuinely hard to read. Pixel type is reserved for labels, numbers and headings, where it has room to breathe. |
| Palette values | `#7C3AED` / `#0F0F23` | `#a855f7` / `#07060d` | Same hue family, pushed darker and more saturated so rarity colours read as the brightest thing on screen. Hierarchy belongs to the loot. |
| Landing pattern | App Store Style Landing | In-app shell + desktop pitch column | This is the product, not a marketing site. The pitch copy lives beside the device frame on wide screens. |
| Theme | Light + dark | Dark only | A single committed look. There is no light mode to keep in parity. |

### Non-negotiables (verified in-browser, not assumed)

- **Touch targets ≥44px.** Audited by measuring every `button`/`a`/`input` rect on all five tabs at
  375px and in landscape. `Btn` bakes `min-h-[44px]` into all sizes; icon-only controls expand their
  hit area with padding and negative margin rather than growing visually.
- **No colour-only meaning.** Verified/manual, rarity, locked/earned and online status all carry a
  text label or icon alongside the colour.
- **Every icon-only control has an `aria-label`.**
- **Safe areas.** `.pad-safe-top` / `.pad-safe-bottom` on the fixed header and tab bar.
- **`cursor: pointer` + `touch-action: manipulation`** globally on buttons — browsers default
  `<button>` to the arrow cursor, and this kills the 300ms tap delay.
- **Device frame gates on height as well as width** (`device:` / `pitch:` custom variants). A
  landscape phone is wide enough to trip `sm:` but far too short to host an 860px frame.
- **Motion 150–300ms**, all of it inside a `prefers-reduced-motion` guard.

---

## Generated reference

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#7C3AED` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#A78BFA` | `--color-secondary` |
| Accent/CTA | `#F43F5E` | `--color-accent` |
| Background | `#0F0F23` | `--color-background` |
| Foreground | `#E2E8F0` | `--color-foreground` |
| Muted | `#27273B` | `--color-muted` |
| Border | `#4C1D95` | `--color-border` |
| Destructive | `#EF4444` | `--color-destructive` |
| Ring | `#7C3AED` | `--color-ring` |

**Color Notes:** Neon purple + rose action

### Typography

- **Heading Font:** Press Start 2P
- **Body Font:** VT323
- **Mood:** pixel, retro, gaming, 8-bit, nostalgic, arcade
- **Google Fonts:** [Press Start 2P + VT323](https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');
```

### Spacing Variables

*Density: 7/10 — Standard*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #F43F5E;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #7C3AED;
  border: 2px solid #7C3AED;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #0F0F23;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #7C3AED;
  outline: none;
  box-shadow: 0 0 0 3px #7C3AED20;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Pixel Art

**Keywords:** Retro, 8-bit, 16-bit, gaming, blocky, nostalgic, pixelated, arcade

**Best For:** Indie games, retro tools, creative portfolios, nostalgia marketing, Web3/NFT

**Key Effects:** Frame-by-frame sprite animation, blinking cursor, instant transitions, marquee text

### Page Pattern

**Pattern Name:** App Store Style Landing

- **Conversion Strategy:** Show real screenshots. Include ratings (4.5+ stars). QR code for mobile. Platform-specific CTAs.
- **CTA Placement:** Download buttons prominent (App Store + Play Store) throughout
- **Section Order:** 1. Hero with device mockup, 2. Screenshots carousel, 3. Features with icons, 4. Reviews/ratings, 5. Download CTAs

---

## Motion

**Stagger List** (Standard) — Trigger: load or scroll | Duration: 300-450ms | Easing: `back.out(1.4)`

```js
gsap.from('.grid-item', { opacity: 0, scale: 0.92, y: 16, duration: 0.4, stagger: { each: 0.06, from: 'start', grid: 'auto' }, ease: 'back.out(1.4)' });
```

**Framework notes:** grid: 'auto' lets GSAP infer rows/columns from a CSS grid layout for a natural wave stagger

- ✅ Combine with from: 'center' for a bento-grid layout to draw the eye inward first
- ❌ Don't use back.out on dense data tables; the overshoot reads as sloppy on informational UI
- ⚡ Group DOM writes; avoid interleaving layout reads (getBoundingClientRect) between staggered tweens

---

## Anti-Patterns (Do NOT Use)

- ❌ Inconsistent styling
- ❌ Poor contrast ratios

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
