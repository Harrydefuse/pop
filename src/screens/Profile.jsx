import { useMemo, useState } from 'react'
import { Bar, Btn, Chip, Modal, Panel, SectionTitle } from '../components/ui'
import Icon from '../components/Icon'
import Avatar from '../components/Avatar'
import StreakFlame from '../components/StreakFlame'
import Hero from './Hero'
import { useGame } from '../game/useGame'
import { ACTIVITIES } from '../game/config'
import { classById, fmt, powerScore, rankFor } from '../game/engine'
import { WEEKS_KEPT, weekActivities, weekOf, weekSeries } from '../game/progress'
import { pinnedEfforts } from '../game/efforts'
import { buildCard, cardAge, cardTitle, encodeCard, leaderboard } from '../game/profile'
import { alpha } from '../game/color'

const NONE = []

/**
 * The page you would actually show someone.
 *
 * Everything the app knows that is worth being proud of was scattered across
 * four screens: the character on HERO, the bests on TRAIN, the week on a chart
 * you had to scroll to, the ladder on a tab full of strangers who do not exist.
 * A profile is the one place all of that belongs, because "look what I did" is
 * a single thought.
 */
export default function Profile() {
  const { state } = useGame()
  const p = state.player
  const [tab, setTab] = useState('progress')
  const [sharing, setSharing] = useState(false)
  const [editing, setEditing] = useState(false)
  const power = powerScore(p)
  const { rank } = rankFor(power)
  const cls = classById(p.classId)
  const friends = state.friends ?? NONE

  return (
    <div className="stack-in p-3 space-y-3">
      {/* ------------------------------------------------------------ who */}
      <Panel accent={cls.color} className="p-4">
        <div className="flex items-center gap-3">
          <Avatar av={p.avatar} size={64} ring={rank.color} className="rounded-full" />
          <div className="min-w-0 flex-1">
            <div className="font-display text-[20px] text-ink truncate">{p.name}</div>
            <div className="label text-ink-faint mt-1 truncate">@{p.handle}</div>
            <div className="flex items-center gap-1.5 mt-2">
              <Chip color={cls.color}>{cls.name}</Chip>
              <Chip color={rank.color}>{rank.name}</Chip>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          {[
            [p.level, 'Level', 'var(--color-neon)'],
            [fmt(power), 'Power', rank.color],
            [friends.length, friends.length === 1 ? 'Friend' : 'Friends', 'var(--color-ink)'],
          ].map(([v, label, tone]) => (
            <div key={label}>
              <div className="figure text-[20px] leading-none" style={{ color: tone }}>
                {v}
              </div>
              <div className="label text-ink-faint mt-1.5">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <Btn size="sm" variant="ghost" onClick={() => setEditing(true)}>
            Edit profile
          </Btn>
          <Btn size="sm" variant="ghost" onClick={() => setSharing(true)}>
            Share profile
          </Btn>
        </div>
      </Panel>

      {/* ---------------------------------------------------------- tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 rounded-[var(--radius-sm)] bg-panel-2">
        {[
          ['progress', 'Progress'],
          ['character', 'Character'],
          ['friends', 'Friends'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className="font-display text-[14px] py-2 min-h-[44px] rounded-[calc(var(--radius-sm)-2px)] transition-colors"
            style={{
              color: tab === id ? 'var(--color-ink)' : 'var(--color-ink-faint)',
              background: tab === id ? 'var(--color-panel)' : 'transparent',
              boxShadow: tab === id ? 'var(--elev)' : undefined,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'progress' && <Progress state={state} />}
      {/* The character screen in full, rather than a summary of it: it is
          already the best page in the app and it belongs behind this name. */}
      {tab === 'character' && <Hero embedded />}
      {tab === 'friends' && <Friends state={state} onShare={() => setSharing(true)} />}

      {sharing && <ShareSheet state={state} onClose={() => setSharing(false)} />}
      {editing && <EditSheet player={p} onClose={() => setEditing(false)} />}
    </div>
  )
}

/* -------------------------------------------------------------- progress */

/**
 * The quarter, filtered.
 *
 * One chart for everything is the honest total and a useless answer to "how is
 * my running going", so the chips do what every training app's do: narrow it to
 * one thing. Weeks folded before the app kept a breakdown have none, which is
 * why a filtered chart can be shorter than the unfiltered one.
 */
function Progress({ state }) {
  const [act, setAct] = useState(null)
  const series = useMemo(() => weekSeries(state.weeks, WEEKS_KEPT).map((w) => weekOf(w, act)), [state.weeks, act])
  const options = useMemo(() => weekActivities(state.weeks).slice(0, 5), [state.weeks])
  const cur = series[series.length - 1]
  const activity = act ? ACTIVITIES.find((a) => a.id === act) : null
  // Distance for the ones measured in it, minutes for everything else — a
  // swimmer should not open their own profile to a kilometre count of zero.
  const useKm = activity ? activity.unit === 'km' : series.some((w) => w.km > 0)
  const top = Math.max(1, ...series.map((w) => (useKm ? w.km : w.minutes)))
  const pinned = pinnedEfforts(state.bests ?? {}, state.player.efforts ?? NONE)

  return (
    <>
      {options.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto scroll-thin pb-1">
          {[[null, 'Everything'], ...options.map((id) => [id, ACTIVITIES.find((a) => a.id === id)?.name ?? id])].map(
            ([id, label]) => {
              const on = act === id
              return (
                <button
                  key={label}
                  onClick={() => setAct(id)}
                  aria-pressed={on}
                  className="shrink-0 label px-3 min-h-[44px] rounded-full border transition-colors"
                  style={{
                    borderColor: on ? 'var(--color-neon)' : 'var(--color-line)',
                    background: on ? alpha('var(--color-neon)', 12) : 'transparent',
                    color: on ? 'var(--color-ink)' : 'var(--color-ink-faint)',
                  }}
                >
                  {label}
                </button>
              )
            },
          )}
        </div>
      )}

      <Panel className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="label text-ink-faint">This week{activity ? ` · ${activity.name}` : ''}</div>
            <div className="grid grid-cols-3 gap-4 mt-2.5">
              {[
                [useKm ? `${cur.km.toFixed(1)}` : `${Math.round(cur.minutes)}`, useKm ? 'km' : 'min'],
                [cur.sessions, cur.sessions === 1 ? 'session' : 'sessions'],
                [act ? '—' : Math.round(cur.volume).toLocaleString(), act ? '' : 'kg'],
              ].map(([v, label], i) => (
                <div key={i}>
                  <div className="figure text-[22px] text-ink leading-none">{v}</div>
                  <div className="label text-ink-faint mt-1.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <StreakFlame days={state.player.streak} />
        </div>

        {/* A quarter of a year, one bar a week. The gaps are the point. */}
        <div className="flex items-end gap-[3px] h-16 mt-4" aria-hidden="true">
          {series.map((w, i) => {
            const v = useKm ? w.km : w.minutes
            const h = Math.max(2, Math.round((v / top) * 62))
            const now = i === series.length - 1
            return (
              <span
                key={w.key}
                className="flex-1 rounded-t-[3px]"
                style={{
                  height: h,
                  background: now ? 'var(--color-neon)' : v ? 'var(--color-line-hot)' : 'var(--color-line)',
                }}
              />
            )
          })}
        </div>
        <div className="flex justify-between mt-2">
          <span className="label text-ink-faint">{WEEKS_KEPT} weeks ago</span>
          <span className="label text-ink-faint">this week</span>
        </div>
      </Panel>

      {pinned.length > 0 && (
        <div>
          <SectionTitle right={<span className="label text-ink-faint">pinned</span>}>Best efforts</SectionTitle>
          <Panel className="p-3.5">
            <div className="grid grid-cols-3 gap-2 text-center">
              {pinned.map((e) => (
                <div key={e.id} className="min-w-0">
                  <div className="figure text-[20px] text-ink leading-none">
                    {e.value}
                    {e.unit && <span className="text-[13px] text-ink-dim ml-0.5">{e.unit}</span>}
                  </div>
                  <div className="label text-ink-faint mt-1.5 truncate" title={e.name}>
                    {e.name}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </>
  )
}

/* --------------------------------------------------------------- friends */

/** One person, as the card they sent. */
function FriendRow({ card, place, onOpen }) {
  const cls = classById(card.classId)
  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center gap-3 px-3.5 py-3 min-h-[64px] text-left border-b border-line last:border-0 active:bg-panel-2"
    >
      <span className="figure text-[15px] text-ink-faint w-5 shrink-0">{place}</span>
      <Avatar av={card.avatar} size={40} ring={card.me ? 'var(--color-neon)' : cls.color} className="rounded-full" />
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[15px] text-ink truncate">
          {card.name}
          {card.me && <span className="label text-neon ml-1.5">you</span>}
        </span>
        <span className="block label text-ink-faint mt-1 truncate">{cardTitle(card)}</span>
      </span>
      <span className="text-right shrink-0">
        <span className="block figure text-[17px] text-ink">{card.level}</span>
        <span className="block label text-ink-faint mt-0.5">level</span>
      </span>
    </button>
  )
}

function Friends({ state, onShare }) {
  const { addFriend, removeFriend } = useGame()
  const friends = state.friends ?? NONE
  const board = useMemo(() => leaderboard(state, friends), [state, friends])
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(null)
  const shown = board.find((c) => (c.handle ?? c.name) === open)

  return (
    <>
      <Panel className="p-4">
        <div className="text-[14px] text-ink-dim leading-relaxed">
          There are no accounts yet, so nobody can be followed — a friend list needs somewhere both people can read
          from and this app has nowhere. What it has instead is a card: send yours, paste theirs, and they are here.
          It is a snapshot, not a feed, and it only changes when they send you a new one.
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3.5">
          <Btn size="sm" variant="go" onClick={() => setAdding(true)}>
            Add a friend
          </Btn>
          <Btn size="sm" variant="ghost" onClick={onShare}>
            Send yours
          </Btn>
        </div>
      </Panel>

      <div>
        <SectionTitle right={<span className="label text-ink-faint">by level</span>}>
          {friends.length ? 'Standings' : 'Just you so far'}
        </SectionTitle>
        <Panel>
          {board.map((c) => (
            <FriendRow
              key={c.handle ?? c.name}
              card={c}
              place={c.place}
              onOpen={() => setOpen(c.handle ?? c.name)}
            />
          ))}
        </Panel>
      </div>

      {adding && (
        <AddFriendSheet
          onClose={() => setAdding(false)}
          onAdd={(code) => {
            addFriend(code)
            setAdding(false)
          }}
        />
      )}
      {shown && (
        <CardSheet
          card={shown}
          onClose={() => setOpen(null)}
          onRemove={
            shown.me
              ? null
              : () => {
                  removeFriend(shown.handle ?? shown.name)
                  setOpen(null)
                }
          }
        />
      )}
    </>
  )
}

/** A friend's card, opened. The showing-off, seen from the other side. */
function CardSheet({ card, onClose, onRemove }) {
  const cls = classById(card.classId)
  return (
    <Modal open onClose={onClose} title={card.name.toUpperCase()}>
      <div className="flex items-center gap-3">
        <Avatar av={card.avatar} size={56} ring={cls.color} className="rounded-full" />
        <div className="min-w-0">
          <div className="font-display text-[16px] text-ink truncate">@{card.handle ?? 'unknown'}</div>
          <div className="label text-ink-faint mt-1">{cardTitle(card)}</div>
          {!card.me && <div className="label text-ink-faint mt-1">{cardAge(card)}</div>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
        {[
          [card.level, 'Level'],
          [fmt(card.power ?? 0), 'Power'],
          [card.streak ?? 0, 'Streak'],
        ].map(([v, label]) => (
          <div key={label}>
            <div className="figure text-[19px] text-ink leading-none">{v}</div>
            <div className="label text-ink-faint mt-1.5">{label}</div>
          </div>
        ))}
      </div>

      {card.efforts?.length > 0 && (
        <div className="mt-4">
          <SectionTitle>Best efforts</SectionTitle>
          <Panel className="p-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              {card.efforts.map((e) => (
                <div key={e.id} className="min-w-0">
                  <div className="figure text-[18px] text-ink leading-none">
                    {e.value}
                    {e.unit && <span className="text-[12px] text-ink-dim ml-0.5">{e.unit}</span>}
                  </div>
                  <div className="label text-ink-faint mt-1.5 truncate">{e.name}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      <div className="mt-4">
        <SectionTitle>Their week</SectionTitle>
        <Panel className="p-3">
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              [card.week?.sessions ?? 0, 'sessions'],
              [Math.round(card.week?.minutes ?? 0), 'min'],
              [(card.week?.km ?? 0).toFixed(1), 'km'],
              [Math.round(card.week?.volume ?? 0).toLocaleString(), 'kg'],
            ].map(([v, label]) => (
              <div key={label}>
                <div className="figure text-[16px] text-ink leading-none">{v}</div>
                <div className="label text-ink-faint mt-1.5">{label}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {card.worn?.length > 0 && (
        <div className="mt-4">
          <SectionTitle right={<span className="label text-ink-faint">{card.worn.length} pieces</span>}>
            What they are wearing
          </SectionTitle>
          <Panel className="p-3">
            <div className="flex flex-wrap gap-1.5">
              {card.worn.map((w) => (
                <span
                  key={w.slot}
                  className="label px-2 py-1.5 rounded-full bg-panel-2"
                  style={{ color: `var(--color-r-${w.rarity})` }}
                >
                  {w.kind} +{w.level}
                </span>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {onRemove && (
        <Btn full size="sm" variant="ghost" className="mt-4" onClick={onRemove}>
          Remove {card.name}
        </Btn>
      )}
    </Modal>
  )
}

function AddFriendSheet({ onClose, onAdd }) {
  const [code, setCode] = useState('')
  return (
    <Modal open onClose={onClose} title="ADD A FRIEND">
      <p className="text-[14px] text-ink-dim leading-relaxed">
        Ask them to hit <strong>Share profile</strong> and send you the code. Paste the whole thing here — it starts
        with LVL100.
      </p>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={4}
        placeholder="LVL100.CARD.1|…"
        aria-label="Their profile code"
        className="w-full mt-3 p-3 text-[13px] text-ink bg-panel-2 border border-line rounded-[var(--radius-sm)] font-mono break-all placeholder:text-ink-faint focus:border-neon focus:ring-2 focus:ring-[var(--color-neon)] outline-none"
      />
      <Btn full variant="go" className="mt-3" disabled={!code.trim()} onClick={() => onAdd(code)}>
        ADD THEM
      </Btn>
      <p className="text-[13px] text-ink-faint mt-3 leading-snug">
        Pasting a newer code from someone already here updates them rather than adding a second.
      </p>
    </Modal>
  )
}

/** Your card, as a code to hand over. */
function ShareSheet({ state, onClose }) {
  const code = useMemo(() => encodeCard(buildCard(state)), [state])
  const [note, setNote] = useState(null)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setNote('Copied. Send it to them however you like.')
    } catch {
      setNote('Could not reach the clipboard — select the code and copy it by hand.')
    }
  }

  const share = async () => {
    if (!navigator.share) return copy()
    try {
      await navigator.share({ title: `${state.player.name} on LVL100`, text: code })
    } catch {
      /* they closed the sheet, which is not an error */
    }
  }

  return (
    <Modal open onClose={onClose} title="SHARE PROFILE">
      <p className="text-[14px] text-ink-dim leading-relaxed">
        Your character, your level, your streak, your week and the three bests you pinned. Nothing else — no log, no
        routes, nowhere you have been.
      </p>
      <textarea
        readOnly
        value={code}
        rows={4}
        aria-label="Your profile code"
        onFocus={(e) => e.target.select()}
        className="w-full mt-3 p-3 text-[13px] text-ink-dim bg-panel-2 border border-line rounded-[var(--radius-sm)] font-mono break-all"
      />
      <div className="grid grid-cols-2 gap-2 mt-3">
        <Btn size="sm" variant="cyan" onClick={copy}>
          <Icon name="link" size={11} color="currentColor" /> Copy code
        </Btn>
        <Btn size="sm" variant="ghost" onClick={share}>
          Share it
        </Btn>
      </div>
      {note && <div className="text-[13px] text-ink-dim mt-3 leading-snug">{note}</div>}
    </Modal>
  )
}

function EditSheet({ player, onClose }) {
  const { editProfile } = useGame()
  const [name, setName] = useState(player.name)
  const [handle, setHandle] = useState(player.handle)
  const clean = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
  const ok = name.trim().length > 0 && clean.length > 1

  return (
    <Modal open onClose={onClose} title="EDIT PROFILE">
      <SectionTitle>Name</SectionTitle>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={18}
        aria-label="Your name"
        className="w-full min-h-[48px] px-3 text-[15px] text-ink bg-panel-2 border border-line rounded-[var(--radius-sm)] focus:border-neon focus:ring-2 focus:ring-[var(--color-neon)] outline-none"
      />
      <SectionTitle>Handle</SectionTitle>
      <div className="flex items-center gap-2">
        <span className="text-[15px] text-ink-faint">@</span>
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          maxLength={18}
          aria-label="Your handle"
          className="flex-1 min-h-[48px] px-3 text-[15px] text-ink bg-panel-2 border border-line rounded-[var(--radius-sm)] focus:border-neon focus:ring-2 focus:ring-[var(--color-neon)] outline-none"
        />
      </div>
      <p className="text-[13px] text-ink-faint mt-2 leading-snug">
        Letters, numbers and underscores. It is how a friend&rsquo;s app knows a new card of yours is still you, so
        changing it makes you a new person to anyone who already has you.
      </p>
      <Btn
        full
        variant="go"
        className="mt-4"
        disabled={!ok}
        onClick={() => {
          editProfile(name, clean)
          onClose()
        }}
      >
        SAVE
      </Btn>
      <div className="mt-4 pt-4 border-t border-line">
        <div className="label text-ink-faint">Your look</div>
        <div className="text-[13px] text-ink-dim mt-1.5 leading-snug">
          The face and the body are set when you make the character. Everything else on the profile is earned.
        </div>
        <Bar pct={1} color="var(--color-line-hot)" height={4} className="mt-3" />
      </div>
    </Modal>
  )
}
