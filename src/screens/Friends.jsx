import { useMemo, useState } from 'react'
import { Bar, Btn, Panel, SectionTitle } from '../components/ui'
import Icon from '../components/Icon'
import Avatar from '../components/Avatar'
import { useGame } from '../game/useGame'
import { FRIENDS } from '../game/data'
import { classById, xpToNext } from '../game/engine'
import WorldRaid from '../components/WorldRaid'

/**
 * The world raid lives here rather than in a tab of its own: it is a thing you
 * do with other people, so it belongs next to the people.
 */
function ModeSwitch({ mode, setMode }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[
        ['squad', 'YOUR SQUAD'],
        ['raid', 'WORLD RAID'],
      ].map(([id, label]) => {
        const on = mode === id
        return (
          <button
            key={id}
            onClick={() => setMode(id)}
            aria-pressed={on}
            className="font-pixel text-[8px] min-h-[44px] border transition-colors active:brightness-125"
            style={{
              borderColor: on ? 'var(--color-neon)' : 'var(--color-line)',
              background: on ? 'var(--color-neon)' : 'transparent',
              color: on ? '#0b0715' : 'var(--color-ink-faint)',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Ranked by level, not by power. Level only moves when you show up, so the
 * board rewards consistency rather than who owns the best gear — which is the
 * kind of competition that stays friendly.
 */
export default function Friends() {
  const { state } = useGame()
  const [mode, setMode] = useState('squad')
  const p = state.player
  const [added, setAdded] = useState([])
  const [query, setQuery] = useState('')
  const [cheered, setCheered] = useState([])

  const me = useMemo(
    () => ({
      id: 'me',
      name: p.name,
      handle: p.handle,
      level: p.level,
      xp: p.xp,
      streak: p.streak,
      classId: p.classId,
      avatar: p.avatar,
      me: true,
    }),
    [p],
  )

  const board = useMemo(
    () => [...FRIENDS, ...added, me].sort((a, b) => b.level - a.level || b.streak - a.streak),
    [added, me],
  )

  const myPlace = board.findIndex((f) => f.id === 'me') + 1
  const above = board[myPlace - 2]

  const add = (e) => {
    e.preventDefault()
    const handle = query.trim().replace(/^@/, '')
    if (!handle) return
    setAdded((list) => [
      ...list,
      {
        id: `added-${handle}`,
        name: handle.slice(0, 10).toUpperCase(),
        handle,
        level: 4 + Math.floor(Math.random() * 30),
        streak: Math.floor(Math.random() * 20),
        classId: 'vanguard',
        avatar: { seed: list.length + 3, skin: '#e8b48a', hair: '#22d3ee', shirt: '#a855f7' },
        fresh: true,
      },
    ])
    setQuery('')
  }

  if (mode === 'raid') {
    return (
      <div className="p-3 space-y-3">
        <ModeSwitch mode={mode} setMode={setMode} />
        <WorldRaid />
      </div>
    )
  }

  return (
    <div className="p-3 space-y-3.5">
      <ModeSwitch mode={mode} setMode={setMode} />
      <Panel className="p-3.5" accent="var(--color-neon)">
        <div className="font-pixel text-[10px] text-neon">YOUR CIRCLE</div>
        <div className="text-[11px] text-ink-dim mt-2 leading-snug">
          Ranked by level, so it comes down to who keeps showing up. You are{' '}
          <span className="text-ink">#{myPlace} of {board.length}</span>
          {above && (
            <>
              {' '}— <span className="text-neon">{above.name}</span> is {above.level - p.level}{' '}
              level{above.level - p.level === 1 ? '' : 's'} ahead.
            </>
          )}
        </div>
        <form className="flex gap-2 mt-3" onSubmit={add}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="add by handle"
            aria-label="Friend handle"
            className="flex-1 min-w-0 bg-panel-2 border border-line px-2.5 min-h-[44px] text-[12px] text-ink placeholder:text-ink-faint focus:border-neon outline-none"
          />
          <Btn size="sm" type="submit" disabled={!query.trim()}>
            <Icon name="plus" size={10} color="currentColor" /> ADD
          </Btn>
        </form>
      </Panel>

      <div>
        <SectionTitle right={<span className="font-mono text-[10px] text-ink-faint">by level</span>}>
          LEADERBOARD
        </SectionTitle>
        <Panel className="p-1">
          {board.map((f, i) => {
            const cls = classById(f.classId)
            const isMe = f.id === 'me'
            const medal = ['#fbbf24', '#c5cdd8', '#b07a4a'][i]
            return (
              <div
                key={f.id}
                className="flex items-center gap-2.5 px-2.5 py-2.5 border-b border-line last:border-0"
                style={isMe ? { background: 'rgba(168, 85, 247, 0.10)' } : undefined}
              >
                <span
                  className="font-pixel text-[9px] w-6 text-center shrink-0"
                  style={{ color: medal ?? (isMe ? 'var(--color-neon-bright)' : 'var(--color-ink-faint)') }}
                >
                  {i + 1}
                </span>
                <Avatar av={f.avatar} size={32} ring={isMe ? 'var(--color-neon)' : cls.color} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-pixel text-[8px] truncate">{f.name}</span>
                    {isMe && <span className="font-pixel text-[6px] text-neon-bright">YOU</span>}
                    {f.fresh && <span className="font-pixel text-[6px] text-lime">NEW</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Icon name="flame" size={8} color="#fb923c" />
                    <span className="font-mono text-[10px] text-ink-faint">{f.streak} day streak</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-pixel text-[11px]" style={{ color: isMe ? 'var(--color-neon-bright)' : 'var(--color-ink)' }}>
                    {f.level}
                  </div>
                  <div className="font-pixel text-[6px] text-ink-faint mt-0.5">LEVEL</div>
                </div>

                {!isMe && (
                  <button
                    onClick={() => setCheered((c) => (c.includes(f.id) ? c : [...c, f.id]))}
                    aria-label={`Cheer ${f.name}`}
                    className="grid place-items-center w-11 h-11 shrink-0 border active:brightness-125"
                    style={{
                      borderColor: cheered.includes(f.id) ? 'var(--color-lime)' : 'var(--color-line)',
                    }}
                  >
                    <Icon
                      name={cheered.includes(f.id) ? 'check' : 'heart'}
                      size={12}
                      color={cheered.includes(f.id) ? 'var(--color-lime)' : 'var(--color-ink-faint)'}
                    />
                  </button>
                )}
              </div>
            )
          })}
        </Panel>
      </div>

      <Panel className="p-3.5">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="font-pixel text-[8px] text-ink-faint">YOUR NEXT LEVEL</span>
          <span className="font-mono text-[10px] text-ink-dim">
            {Math.round(p.xp)} / {xpToNext(p.level)} XP
          </span>
        </div>
        <Bar pct={p.xp / xpToNext(p.level)} height={8} shine />
        <div className="text-[11px] text-ink-dim mt-2.5 leading-snug">
          No global board here on purpose. Ten people you actually know beats ten million you don&apos;t.
        </div>
      </Panel>
    </div>
  )
}
