import { useEffect, useMemo, useState } from 'react'
import { Btn, SectionTitle } from '../components/ui'
import CampaignSheet from '../components/CampaignSheet'
import WorldMap from '../components/WorldMap'
import Icon from '../components/Icon'
import { areaKm2 } from '../game/ground'
import { placeById } from '../game/places'
import { useGame } from '../game/useGame'
import { ACTIVITIES } from '../game/config'
import { CAMPAIGN, actById } from '../game/campaign'
import { campaignState } from '../game/engine'

/** One colour per route, so a screen of them reads as separate walks. */
const ROUTE_COLOURS = ['#0e7490', '#be123c', '#3f6212', '#6d28d9', '#c2410c', '#0369a1']

/** How long ago, short enough for a list row. */
function whenAgo(at) {
  const days = Math.floor((Date.now() - at) / 86400000)
  if (days < 1) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return `${Math.round(days / 7)}w ago`
}

/**
 * Bosses stand somewhere. Tying each one to a real place turns the ladder into
 * a route through the city rather than a list — you can see where the story
 * goes next, and it is a walk away.
 */
const BOSS_SITES = {
  golem: 'quay',
  wraith: 'darling',
  couch: 'northsyd',
  doomscroll: 'cbd',
  ironjaw: 'domain',
  wall: 'centennial',
  nox: 'mosman',
  mirror: 'rose',
  backslide: 'bondi',
  lvl100: 'heads',
}

/** One number and what it is. Three of them fit across a phone. */
function Stat({ value, label, colour }) {
  return (
    <div className="min-w-0">
      <div className="figure text-[19px] leading-none" style={{ color: colour }}>
        {value}
      </div>
      <div className="label text-ink-faint mt-1.5">{label}</div>
    </div>
  )
}

/**
 * The map, opened from the header.
 *
 * One map now, and it is the real one. The illustrated Sydney was the better
 * picture and the worse map: it could not show you the street you ran down, and
 * it meant nothing at all if you lived somewhere else. Everything it carried
 * moved onto real ground — the tint is the blocks you have covered, the pins
 * are the bosses, and the line is Tuesday.
 */
export default function MapSheet({ onClose }) {
  const { state } = useGame()
  const ground = useMemo(() => new Set(state.explored ?? []), [state.explored])
  const [picked, setPicked] = useState(null)
  const [campaign, setCampaign] = useState(false)
  const c = campaignState(state.player, state.campaign)

  const markers = useMemo(
    () =>
      CAMPAIGN.map((boss) => {
        const p = placeById(BOSS_SITES[boss.id])
        if (!p) return null
        const cleared = c.defeated.includes(boss.id)
        return {
          id: boss.id,
          boss,
          place: p,
          lat: p.lat,
          lon: p.lon,
          name: boss.name,
          where: p.name,
          colour: cleared ? '#94a3b8' : actById(boss.act).color,
          state: cleared ? 'cleared' : c.current?.id === boss.id ? 'current' : 'ahead',
        }
      }).filter(Boolean),
    [c.defeated, c.current],
  )

  const shown = markers.find((m) => m.id === picked) ?? markers.find((m) => m.state === 'current') ?? markers[0]

  // Every distance session that came back with a trace, newest first.
  const routes = useMemo(
    () =>
      (state.log ?? [])
        .filter((l) => l.detail?.route?.length > 1)
        .slice(0, 12)
        .map((l, i) => ({
          id: l.id,
          points: l.detail.route,
          km: (l.detail.metres ?? 0) / 1000,
          label: (ACTIVITIES.find((a) => a.id === l.activityId)?.name ?? 'SESSION').toUpperCase(),
          when: whenAgo(l.at),
          colour: ROUTE_COLOURS[i % ROUTE_COLOURS.length],
        })),
    [state.log],
  )

  const [only, setOnly] = useState('all')
  // Peek by default. The map is what the button was pressed for.
  const [open, setOpen] = useState(false)

  // The sheet it replaced closed on Escape, and a full-screen layer that traps
  // you until you find the right corner is worse than the one it replaced.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const shownRoutes = only === 'all' ? routes : routes.filter((r) => r.id === only)
  const totalKm = routes.reduce((n, r) => n + r.km, 0)
  const covered = areaKm2(ground)

  return (
    <>
      {/* A map screen, not a map in a box: the map is the page, and everything
          about it lives on a sheet over the bottom of it that you pull up when
          you want it. Every map app on the phone works this way. */}
      <div
        className="absolute inset-0 z-50 flex flex-col bg-void"
        role="dialog"
        aria-modal="true"
        aria-label="Where you have been"
      >
        <div className="flex items-center gap-2 px-2 py-2 pt-[max(8px,env(safe-area-inset-top))] shrink-0">
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="grid place-items-center w-11 h-11 rounded-[var(--radius-sm)] text-[20px] text-ink-faint hover:text-ink active:bg-panel-2"
          >
            ‹
          </button>
          <span className="font-display text-[16px] text-ink">WHERE YOU&rsquo;VE BEEN</span>
        </div>

        <div className="relative flex-1 min-h-0">
          <WorldMap
            routes={shownRoutes}
            ground={ground}
            pins={markers}
            onPickPin={(id) => {
              setPicked(id)
              setOpen(true)
            }}
            height="100%"
            className="absolute inset-0"
          />
        </div>

        <div className="map-sheet" data-open={open ? '' : undefined}>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Collapse the details' : 'Expand the details'}
            className="shrink-0 w-full pt-2.5 pb-1.5 min-h-[44px]"
          >
            <span className="map-grip" aria-hidden="true" />
          </button>

          <div className="px-4 pb-4 min-h-0 overflow-y-auto scroll-thin">
            <div className="grid grid-cols-3 gap-3">
              <Stat value={routes.length} label={routes.length === 1 ? 'Route' : 'Routes'} colour="var(--color-ink)" />
              <Stat value={`${totalKm.toFixed(1)} km`} label="Covered" colour="var(--color-cyan)" />
              <Stat value={`${covered.toFixed(1)} km²`} label="Ground claimed" colour="var(--color-lime)" />
            </div>

            <div className="text-[13px] text-ink-dim mt-2.5 leading-snug">
              {ground.size
                ? 'The green is ground you have actually stood on. It only grows, and it never goes back.'
                : 'Track a walk, a run or a ride from TRAIN with location on. The line lands here, and the blocks you pass through turn green for good.'}
            </div>

            {/* ----------------------------------------------------- the walks */}
            {routes.length > 0 && (
              <div className="mt-3 border-t border-line pt-2 space-y-1">
                <button
                  onClick={() => setOnly('all')}
                  className="w-full flex items-center gap-2.5 min-h-[44px] px-1 text-left active:brightness-125"
                  aria-pressed={only === 'all'}
                >
                  <span
                    className="w-2.5 h-2.5 shrink-0 rounded-full border"
                    style={{
                      borderColor: 'var(--color-line-hot)',
                      background: only === 'all' ? 'var(--color-ink)' : 'transparent',
                    }}
                  />
                  <span className="font-display text-[14px] text-ink-dim">Everything</span>
                </button>
                {routes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setOnly(r.id)}
                    className="w-full flex items-center gap-2.5 min-h-[44px] px-1 text-left active:brightness-125"
                    aria-pressed={only === r.id}
                  >
                    <span
                      className="w-2.5 h-2.5 shrink-0 rounded-full border"
                      style={{ borderColor: r.colour, background: only === r.id ? r.colour : 'transparent' }}
                    />
                    <span className="label text-ink-faint w-[62px] shrink-0">{r.label}</span>
                    <span className="text-[14px] text-ink">{r.km.toFixed(2)} km</span>
                    <span className="text-[14px] text-ink-faint ml-auto">{r.when}</span>
                  </button>
                ))}
              </div>
            )}

            {/* ------------------------------------------------ what the pin is */}
            {shown && (
              <div className="mt-3 pt-3 border-t border-line">
                <SectionTitle color={actById(shown.boss.act).color}>
                  {shown.state === 'cleared'
                    ? 'CLEARED'
                    : shown.state === 'current'
                      ? 'STANDING HERE NOW'
                      : 'FURTHER ON'}
                </SectionTitle>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-display text-[16px]" style={{ color: actById(shown.boss.act).color }}>
                    {shown.boss.name}
                  </span>
                  <span className="text-[14px] text-ink-faint">at {shown.place.name}</span>
                </div>
                <div className="text-[14px] text-ink-dim mt-2 leading-snug">{shown.boss.lore}</div>
                {shown.state !== 'cleared' && (
                  <Btn
                    full
                    size="sm"
                    variant={shown.state === 'current' ? 'danger' : 'ghost'}
                    className="mt-3"
                    onClick={() => setCampaign(true)}
                  >
                    {shown.state === 'current' ? 'FIGHT IT' : 'SEE THE ROAD'}
                  </Btn>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-line">
              <Icon name="pin" size={14} color="var(--color-ink-faint)" />
              <span className="text-[13px] text-ink-faint leading-snug">
                Pinch or scroll to zoom, drag to move — it is the whole world. Tap a pin to read the boss standing
                there.
              </span>
            </div>
          </div>
        </div>
      </div>
      {campaign && <CampaignSheet onClose={() => setCampaign(false)} />}
    </>
  )
}
