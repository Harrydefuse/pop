import { Bar, Btn, Panel, SectionTitle } from '../components/ui'
import Icon from '../components/Icon'
import Avatar from '../components/Avatar'
import { useGame } from '../game/useGame'
import { classById, xpToNext } from '../game/engine'
import { leaderboard } from '../game/profile'
import WorldRaid from '../components/WorldRaid'

/**
 * The raid, and the people you are doing it alongside.
 *
 * This screen used to open on a leaderboard of six invented characters with an
 * "add by handle" box that manufactured a seventh out of a random number. It
 * looked like a social network and was a screensaver. The friends here are the
 * real ones now — cards people actually sent — and everything that adds or
 * removes them lives on your profile, where the rest of you already is.
 */
export default function Friends({ onGo }) {
  const { state } = useGame()
  const p = state.player
  const friends = state.friends ?? []
  const board = leaderboard(state, friends)
  const myPlace = board.findIndex((c) => c.me) + 1
  const above = board[myPlace - 2]

  return (
    <div className="stack-in p-3 space-y-3.5">
      <WorldRaid />

      <div>
        <SectionTitle right={<span className="text-[14px] text-ink-faint">by level</span>}>
          {friends.length ? 'Your circle' : 'Nobody here yet'}
        </SectionTitle>
        {friends.length ? (
          <Panel>
            {board.map((c) => {
              const cls = classById(c.classId)
              const medal = ['var(--color-gold)', 'var(--tone-slate)', 'var(--tone-bronze)'][c.place - 1]
              return (
                <div
                  key={c.handle ?? c.name}
                  className="flex items-center gap-2.5 px-3 py-3 border-b border-line last:border-0"
                  style={c.me ? { background: 'color-mix(in srgb, var(--color-neon) 8%, transparent)' } : undefined}
                >
                  <span
                    className="figure text-[15px] w-6 text-center shrink-0"
                    style={{ color: medal ?? (c.me ? 'var(--color-neon)' : 'var(--color-ink-faint)') }}
                  >
                    {c.place}
                  </span>
                  <Avatar av={c.avatar} size={34} ring={c.me ? 'var(--color-neon)' : cls.color} className="rounded-full" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-display text-[14px] text-ink truncate">{c.name}</span>
                      {c.me && <span className="label text-neon">you</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Icon name="flame" size={9} color="var(--tone-orange)" />
                      <span className="label text-ink-faint">{c.streak ?? 0} day streak</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="figure text-[17px]" style={{ color: c.me ? 'var(--color-neon)' : 'var(--color-ink)' }}>
                      {c.level}
                    </div>
                    <div className="label text-ink-faint mt-0.5">level</div>
                  </div>
                </div>
              )
            })}
          </Panel>
        ) : (
          <Panel className="p-4">
            <div className="text-[14px] text-ink-dim leading-relaxed">
              Friends are cards people send you — there is no server to follow anyone on, so nobody appears here until
              somebody hands you theirs. Yours is on your profile.
            </div>
            <Btn full size="sm" variant="go" className="mt-3" onClick={() => onGo?.('hero')}>
              Go to your profile
            </Btn>
          </Panel>
        )}
        {friends.length > 0 && (
          <div className="text-[14px] text-ink-dim mt-2.5 leading-snug">
            Ranked by level, so it comes down to who keeps showing up. You are{' '}
            <span className="text-ink">
              #{myPlace} of {board.length}
            </span>
            {above && (
              <>
                {' '}— <span className="text-neon">{above.name}</span> is {above.level - p.level}{' '}
                level{above.level - p.level === 1 ? '' : 's'} ahead.
              </>
            )}
          </div>
        )}
      </div>

      <Panel className="p-3.5">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="label text-ink-faint">Your next level</span>
          <span className="text-[14px] text-ink-dim">
            {Number.isFinite(xpToNext(p.level)) ? `${Math.round(p.xp)} / ${xpToNext(p.level)} XP` : 'MAX LEVEL'}
          </span>
        </div>
        <Bar pct={Number.isFinite(xpToNext(p.level)) ? p.xp / xpToNext(p.level) : 1} height={8} shine />
        <div className="text-[14px] text-ink-dim mt-2.5 leading-snug">
          No global board here on purpose. Ten people you actually know beats ten million you don&apos;t.
        </div>
      </Panel>
    </div>
  )
}
