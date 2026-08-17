import { useMemo, useState } from 'react'
import { Btn, Chip, Modal, Panel, SectionTitle } from '../components/ui'
import Icon from '../components/Icon'
import Avatar from '../components/Avatar'
import { useGame } from '../game/useGame'
import { CHANNELS, COACHES } from '../game/data'
import { classById, fmt, relTime } from '../game/engine'
import { alpha } from '../game/color'

function Composer({ channel, onClose }) {
  const { post } = useGame()
  const [body, setBody] = useState('')
  const [tags, setTags] = useState('')

  return (
    <Modal open onClose={onClose} title={`POST TO ${CHANNELS.find((c) => c.id === channel).name.toUpperCase()}`}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={6}
        autoFocus
        placeholder="Share a routine, a PB, a form check, or just how the week went…"
        className="w-full bg-panel-2 border border-line p-2.5 text-[12px] text-ink placeholder:text-ink-faint focus:border-neon outline-none resize-none"
      />
      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="tags, comma separated"
        className="w-full bg-panel-2 border border-line p-2.5 mt-2 text-[12px] text-ink placeholder:text-ink-faint focus:border-neon outline-none"
      />
      <Btn
        full
        className="mt-3"
        disabled={!body.trim()}
        onClick={() => {
          post({
            channel,
            body: body.trim(),
            tags: tags
              .split(',')
              .map((t) => t.trim().replace(/^#/, ''))
              .filter(Boolean),
          })
          onClose()
        }}
      >
        POST
      </Btn>
    </Modal>
  )
}

function Post({ p }) {
  const { state, like } = useGame()
  const liked = state.liked.includes(p.id)
  const cls = classById(p.author.classId)

  return (
    <Panel className="p-3" corners={false}>
      {p.pinned && (
        <div className="font-pixel text-[6px] text-gold mb-2.5 flex items-center gap-1.5">
          <Icon name="spark" size={9} color="var(--color-gold)" /> PINNED
        </div>
      )}
      <div className="flex items-start gap-2.5">
        <Avatar av={p.author.avatar} size={32} ring={cls.color} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-pixel text-[8px]">{p.author.name}</span>
            <span className="font-pixel text-[6px]" style={{ color: cls.color }}>
              {cls.name}
            </span>
            <span className="font-mono text-[10px] text-ink-faint">LV {p.author.level}</span>
            <span className="font-mono text-[10px] text-ink-faint">· {relTime(p.at)}</span>
          </div>
          <div className="text-[12px] text-ink-dim mt-2 whitespace-pre-line leading-relaxed">{p.body}</div>

          {p.attachment && (
            <div className="mt-2.5 border border-line-hot bg-panel-2 p-2.5 flex items-center gap-2.5">
              <Icon name="trophy" size={16} color="var(--color-gold)" />
              <div>
                <div className="font-pixel text-[8px] text-gold">{p.attachment.label}</div>
                <div className="font-mono text-[10px] text-lime mt-1">{p.attachment.delta}</div>
              </div>
              <span className="ml-auto font-pixel text-[6px] text-lime border border-lime px-1 py-0.5">VERIFIED</span>
            </div>
          )}

          {!!p.tags?.length && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {p.tags.map((t) => (
                <Chip key={t} color="var(--color-ink-faint)">
                  #{t}
                </Chip>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 mt-3">
            <button onClick={() => like(p.id)} className="flex items-center gap-1.5">
              <Icon name="heart" size={11} color={liked ? 'var(--color-danger)' : 'var(--color-ink-faint)'} />
              <span className="font-mono text-[11px]" style={{ color: liked ? 'var(--color-danger)' : 'var(--color-ink-faint)' }}>
                {fmt(p.likes)}
              </span>
            </button>
            <span className="flex items-center gap-1.5">
              <Icon name="chat" size={11} color="var(--color-ink-faint)" />
              <span className="font-mono text-[11px] text-ink-faint">{fmt(p.replies)}</span>
            </span>
          </div>
        </div>
      </div>
    </Panel>
  )
}

function Coaching() {
  const { state, buyCoaching } = useGame()
  return (
    <div className="space-y-2.5">
      <Panel className="p-3.5" accent="var(--color-cyan)">
        <div className="font-pixel text-[9px] text-cyan">COACHING</div>
        <div className="text-[11px] text-ink-dim mt-2 leading-snug">
          Flat $5 a session, lifetime access, no subscription. Half goes to the coach. Fitness and game coaches sit in
          the same list on purpose — both are trainable skills.
        </div>
      </Panel>

      {COACHES.map((c) => {
        const owned = state.purchased.includes(c.id)
        return (
          <Panel key={c.id} className="p-3" corners={false}>
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 grid place-items-center border shrink-0" style={{ borderColor: c.color, background: alpha(c.color, 12) }}>
                <Icon name={c.tag === 'FITNESS' ? 'dumbbell' : c.tag === 'RECOVERY' ? 'heart' : 'crosshair'} size={18} color={c.color} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-pixel text-[8px] truncate">{c.name}</span>
                  <Chip color={c.color}>{c.tag}</Chip>
                </div>
                <div className="text-[11px] text-ink-dim mt-1.5">{c.role}</div>
                <div className="font-mono text-[10px] text-ink-faint mt-1">
                  ★ {c.rating} · {fmt(c.students)} students
                </div>
              </div>
            </div>

            <ul className="mt-3 space-y-1.5">
              {c.lessons.map((l) => (
                <li key={l} className="flex items-center gap-2">
                  <Icon name={owned ? 'check' : 'lock'} size={10} color={owned ? 'var(--color-lime)' : 'var(--color-ink-faint)'} />
                  <span className="text-[11px]" style={{ color: owned ? 'var(--color-ink-dim)' : 'var(--color-ink-faint)' }}>
                    {l}
                  </span>
                </li>
              ))}
            </ul>

            <Btn
              full
              size="sm"
              className="mt-3"
              variant={owned ? 'dim' : 'cyan'}
              disabled={owned}
              onClick={() => buyCoaching(c.id, c.name)}
            >
              {owned ? 'UNLOCKED' : `UNLOCK · $${c.price}`}
            </Btn>
          </Panel>
        )
      })}
    </div>
  )
}

export default function Guild() {
  const { state } = useGame()
  const [view, setView] = useState('feed')
  const [channel, setChannel] = useState('general')
  const [composing, setComposing] = useState(false)

  const posts = useMemo(
    () => state.feed.filter((p) => p.channel === channel).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.at - a.at),
    [state.feed, channel],
  )

  return (
    <div className="p-3 space-y-3">
      <div className="grid grid-cols-2 border border-line bg-panel">
        {[
          ['feed', 'FEED'],
          ['coaching', 'COACHING'],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setView(k)}
            className="font-pixel text-[8px] py-2.5 border-r border-line last:border-0"
            style={{
              color: view === k ? '#12081f' : 'var(--color-ink-faint)',
              background: view === k ? 'var(--color-neon)' : 'transparent',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'coaching' ? (
        <Coaching />
      ) : (
        <>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
            {CHANNELS.map((c) => (
              <button
                key={c.id}
                onClick={() => setChannel(c.id)}
                className="font-pixel text-[7px] px-2.5 py-2 border whitespace-nowrap shrink-0 transition-colors"
                style={{
                  color: channel === c.id ? 'var(--color-neon)' : 'var(--color-ink-faint)',
                  borderColor: channel === c.id ? 'var(--color-neon)' : 'var(--color-line)',
                  background: channel === c.id ? 'rgba(168,85,247,0.12)' : 'transparent',
                }}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-ink-faint">{CHANNELS.find((c) => c.id === channel).desc}</span>
            <Btn size="sm" onClick={() => setComposing(true)}>
              + POST
            </Btn>
          </div>

          <div className="space-y-2.5">
            {posts.map((p) => (
              <Post key={p.id} p={p} />
            ))}
            {!posts.length && (
              <Panel className="p-6 text-center">
                <div className="text-[11px] text-ink-faint">Nothing here yet. Start it off.</div>
              </Panel>
            )}
          </div>

          <SectionTitle color="var(--color-ink-faint)">HOUSE RULES</SectionTitle>
          <Panel className="p-3.5">
            <ul className="space-y-2 text-[11px] text-ink-dim">
              <li>· Verified PBs get a badge. Unverified ones do not — post them anyway.</li>
              <li>· Form checks welcome in #gym-help. No shaming, ever.</li>
              <li>· No supplement spam, no coach DMs unless asked.</li>
            </ul>
          </Panel>
        </>
      )}

      {composing && <Composer channel={channel} onClose={() => setComposing(false)} />}
    </div>
  )
}
