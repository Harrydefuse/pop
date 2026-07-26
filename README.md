# Relay

A landing page for **Relay**, an automation switchboard product concept — built to show off a distinctive visual identity along with a full animation layer.

## Stack

- [Vite](https://vite.dev/) + [React](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Framer Motion](https://motion.dev/) for scroll-linked and in-view animation
- Native SVG/SMIL for the hero's animated pipeline diagram

## Design

Industrial control-panel aesthetic: deep graphite background, amber signal accent, teal secondary signal, brass structural accent. Big Shoulders Display for headlines, Inter for body copy, IBM Plex Mono for data/labels.

The signature element is the **signal spine** — a vertical rail fixed to the left edge of the viewport (desktop only) that fills with the page's scroll progress and lights up a node at each section, alongside an autonomous pulse that travels the rail independent of scroll. A thin horizontal progress bar mirrors scroll progress on all screen sizes.

## Development

```bash
npm install
npm run dev      # start dev server
npm run build    # production build
npm run preview  # preview the production build
npm run lint      # oxlint
```

All motion respects `prefers-reduced-motion`.
