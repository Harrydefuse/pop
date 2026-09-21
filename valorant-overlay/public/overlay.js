/* Overlay client: subscribes to the agent's event stream and renders state. */

const params = new URLSearchParams(location.search)
const overlay = document.getElementById('overlay')

const el = {
  icon: document.getElementById('rankIcon'),
  badge: document.getElementById('rankBadge'),
  name: document.getElementById('rankName'),
  rr: document.getElementById('rrValue'),
  rrFill: document.getElementById('rrFill'),
  leaderboard: document.getElementById('leaderboard'),
  record: document.getElementById('record'),
  recordLabel: document.getElementById('recordLabel'),
  delta: document.getElementById('delta'),
  form: document.getElementById('form'),
  note: document.getElementById('statusNote'),
}

// ------------------------------------------------------------- appearance

const layout = params.get('layout') || 'bar'
const align = params.get('align') || 'left'
const scale = Number(params.get('scale') || 1)
const formLimit = Number(params.get('form') || 5)
const recordScope = params.get('record') || 'session'

overlay.dataset.layout = layout
overlay.dataset.align = align
overlay.dataset.bg = params.get('bg') || 'card'
overlay.dataset.hideOffline = params.get('hideOffline') === '1' ? 'true' : 'false'
document.body.dataset.align = align
document.documentElement.style.setProperty('--scale', String(Number.isFinite(scale) && scale > 0 ? scale : 1))

const visible = new Set((params.get('show') || 'rank,record,delta,form').split(',').map((part) => part.trim()))
for (const node of document.querySelectorAll('[data-block]')) {
  const blocks = node.dataset.block.split(' ')
  node.hidden = !blocks.some((block) => visible.has(block))
}

// The divider only earns its place with something on both sides of it.
const hasStats = ['record', 'delta', 'form'].some((block) => visible.has(block))
document.querySelector('.divider').hidden = !(visible.has('rank') && hasStats)

// A fixed accent overrides the per-rank colour.
const accentOverride = params.get('accent')
if (accentOverride && accentOverride !== 'rank') {
  document.documentElement.style.setProperty('--accent', decodeURIComponent(accentOverride))
}

// ----------------------------------------------------------------- render

let previous = null
let rrAnimation = null

function render(state) {
  overlay.dataset.state = state.connected ? 'live' : 'offline'
  overlay.dataset.status = state.status

  if (!accentOverride || accentOverride === 'rank') {
    document.documentElement.style.setProperty('--accent', state.rank.color)
  }

  renderRank(state)
  renderRr(state)
  renderRecord(state)
  renderDelta(state)
  renderForm(state)

  el.note.textContent = state.connected ? '' : state.error || 'Disconnected'

  previous = state
}

/**
 * Riot's own rank art is used whenever the agent has it. These drawings are
 * only the fallback for when it could not be fetched — close enough to read
 * correctly at a glance on stream, but not Riot's artwork.
 */
function immortalArt(subTier) {
  // 1-3 pips below the crest mark Immortal 1, 2 and 3.
  const pips = Array.from({ length: subTier }, (_, i) => {
    const x = 50 + (i - (subTier - 1) / 2) * 12
    return `<path d="M${x - 4.5} 88 L${x} 77 L${x + 4.5} 88 Z" />`
  }).join('')

  return `
    <defs>
      <linearGradient id="art" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FF7286" />
        <stop offset="55%" stop-color="#D33B54" />
        <stop offset="100%" stop-color="#8E2438" />
      </linearGradient>
    </defs>
    <g fill="url(#art)" stroke="#FFD9DF" stroke-width="1.5" stroke-linejoin="round">
      <path d="M50 6 L82 33 L73 44 L50 24 L27 44 L18 33 Z" />
      <path d="M50 33 L78 56 L69 67 L50 50 L31 67 L22 56 Z" />
    </g>
    <g fill="#FFD9DF">${pips}</g>`
}

function radiantArt() {
  // A ring of spikes around a bright core, long every third ray.
  const rays = Array.from({ length: 12 }, (_, i) => {
    const length = i % 3 === 0 ? 46 : 31
    const shoulder = 50 - length * 0.2
    return `<path d="M50 ${50 - length} L54.5 ${shoulder} L50 50 L45.5 ${shoulder} Z"
      transform="rotate(${i * 30} 50 50)" />`
  }).join('')

  return `
    <defs>
      <radialGradient id="art">
        <stop offset="0%" stop-color="#FFFFFF" />
        <stop offset="45%" stop-color="#FFF6C9" />
        <stop offset="100%" stop-color="#E3BE5C" />
      </radialGradient>
    </defs>
    <g fill="url(#art)">${rays}</g>
    <circle cx="50" cy="50" r="8.5" fill="#FFFDF2" />`
}

function divisionArt(state) {
  const division = state.rank.division || ''
  return `
    <defs>
      <linearGradient id="art" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${state.rank.color}" stop-opacity="0.95" />
        <stop offset="100%" stop-color="${state.rank.color}" stop-opacity="0.45" />
      </linearGradient>
    </defs>
    <path d="M50 6 94 50 50 94 6 50Z" fill="url(#art)" stroke="${state.rank.color}" stroke-width="3"
      stroke-linejoin="round" />
    <text x="50" y="50" text-anchor="middle" dominant-baseline="central" fill="#0b0d12"
      font-family="Inter, Segoe UI, system-ui, sans-serif" font-size="42" font-weight="700">${division || '\u2013'}</text>`
}

function renderBadge(state) {
  const tier = state.rank.tier
  const art = tier >= 27 ? radiantArt() : tier >= 24 ? immortalArt(tier - 23) : divisionArt(state)
  el.badge.innerHTML = `<svg viewBox="0 0 100 100" role="img" aria-label="${state.rank.name}">${art}</svg>`
}

function showBadge(state) {
  el.icon.hidden = true
  el.badge.hidden = false
  renderBadge(state)
}

function renderRank(state) {
  if (state.rank.icon) {
    if (el.icon.getAttribute('src') !== state.rank.icon) el.icon.src = state.rank.icon
    el.icon.hidden = false
    el.badge.hidden = true
    el.icon.onerror = () => showBadge(state)
  } else {
    showBadge(state)
  }
  el.icon.alt = state.rank.name

  const placements = state.rank.placementsLeft
  el.name.textContent = placements ? `Unranked · ${placements} to go` : state.rank.name

  if (previous && previous.rank.tier !== state.rank.tier && previous.rank.tier > 0) {
    const card = document.querySelector('.card')
    const direction = state.rank.tier > previous.rank.tier ? 'promote' : 'demote'
    card.classList.remove('promote', 'demote')
    void card.offsetWidth // restart the animation
    card.classList.add(direction)
  }
}

function renderRr(state) {
  const isRadiant = state.rank.tier >= 27
  el.rrFill.parentElement.hidden = isRadiant || !visible.has('rank')
  el.leaderboard.textContent = state.leaderboardRank ? `#${state.leaderboardRank}` : ''

  const from = previous ? previous.rr : state.rr
  animateNumber(from, state.rr, (value) => {
    el.rr.textContent = String(value)
  })

  const pct = Math.max(0, Math.min(100, (state.rr / state.rrMax) * 100))
  el.rrFill.style.width = `${isRadiant ? 100 : pct}%`

  if (previous && previous.rr !== state.rr) flash(el.rr)
}

function renderRecord(state) {
  const scoped =
    recordScope === 'act' && state.act
      ? { wins: state.act.wins, losses: state.act.games - state.act.wins, draws: 0 }
      : state.session

  el.recordLabel.textContent = recordScope === 'act' ? 'Act' : 'Session'
  const parts = [`<span class="wins">${scoped.wins}</span>`, '<span class="sep">–</span>', `<span class="losses">${scoped.losses}</span>`]
  if (scoped.draws) parts.push('<span class="sep">–</span>', `<span class="draws">${scoped.draws}</span>`)
  el.record.innerHTML = parts.join('')

  const before = previous
    ? recordScope === 'act' && previous.act
      ? previous.act.games
      : previous.session.wins + previous.session.losses + previous.session.draws
    : null
  const now = recordScope === 'act' && state.act ? state.act.games : scoped.wins + scoped.losses + scoped.draws
  if (before !== null && before !== now) flash(el.record)
}

function renderDelta(state) {
  const value = state.session.rrDelta
  el.delta.textContent = `${value > 0 ? '+' : ''}${value}`
  el.delta.className = `stat-value delta ${value > 0 ? 'up' : value < 0 ? 'down' : 'flat'}`
  if (previous && previous.session.rrDelta !== value) flash(el.delta)
}

function renderForm(state) {
  const games = state.session.games.slice(-formLimit)
  const signature = games.map((game) => `${game.id}:${game.outcome}`).join('|')
  if (el.form.dataset.signature === signature) return
  el.form.dataset.signature = signature
  el.form.innerHTML = games.map((game) => `<span class="pip ${game.outcome}"></span>`).join('')
}

// --------------------------------------------------------------- helpers

function flash(node) {
  node.classList.remove('flash')
  void node.offsetWidth
  node.classList.add('flash')
}

/** Counts RR up or down so a gain reads as movement rather than a jump. */
function animateNumber(from, to, apply) {
  if (rrAnimation) cancelAnimationFrame(rrAnimation)
  if (from === to) return apply(to)

  const duration = 650
  const started = performance.now()
  const step = (now) => {
    const progress = Math.min(1, (now - started) / duration)
    const eased = 1 - Math.pow(1 - progress, 3)
    apply(Math.round(from + (to - from) * eased))
    if (progress < 1) rrAnimation = requestAnimationFrame(step)
  }
  rrAnimation = requestAnimationFrame(step)
}

// ------------------------------------------------------------------ feed

/**
 * An overlay that draws nothing cannot be diagnosed inside OBS, so once it is
 * clear no agent is answering, say so on the card instead of staying blank.
 */
const waitingTimer = setTimeout(() => {
  if (previous) return
  overlay.dataset.state = 'waiting'
  overlay.dataset.status = 'offline'
  el.name.textContent = 'No data yet'
  el.note.textContent = 'Is the overlay app running?'
  el.icon.hidden = true
  el.badge.hidden = false
  renderBadge({ rank: { tier: 0, division: '', color: '#8B8F94', name: 'Unranked' } })
}, 4000)

function connect() {
  const source = new EventSource('/events')
  source.onmessage = (event) => {
    try {
      clearTimeout(waitingTimer)
      render(JSON.parse(event.data))
    } catch (err) {
      console.error('bad payload', err)
    }
  }
  source.onerror = () => {
    // EventSource reconnects on its own; only a connection that never landed
    // is worth reporting, and the waiting timer covers that.
  }
}

connect()
