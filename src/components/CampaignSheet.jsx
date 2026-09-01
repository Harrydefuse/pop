import { useMemo, useState } from 'react'
import { Bar, Btn, Chip, Modal, Panel, SectionTitle } from './ui'
import Icon from './Icon'
import LogSheet from './LogSheet'
import { BossArt, PetView } from './Sprites'
import Arena from './Arena'
import { useGame } from '../game/useGame'
import { ACTIVITIES, RARITY } from '../game/config'
import { ACTS, CAMPAIGN, actById } from '../game/campaign'
import { campaignState, fmtFull } from '../game/engine'
import { alpha } from '../game/color'

/**
 * Opening the log from a boss puts whatever it is weak to at the front, so the
 * double-damage option is the first thing under your thumb.
 */
function fightOrder(boss) {
  const ids = ACTIVITIES.filter((a) => !a.gaming || boss.weak === 'aim').map((a) => a.id)
  if (!boss.weak) return ids
  const weak = ACTIVITIES.filter((a) => a.tag === boss.weak).map((a) => a.id)
  return [...weak, ...ids.filter((id) => !weak.includes(id))]
}

function statusOf(boss, player, c) {
  if (c.defeated.includes(boss.id)) return 'cleared'
  if (c.current && c.current.id === boss.id) return 'fighting'
  return player.level >= boss.level ? 'ahead' : 'locked'
}

const SILHOUETTE = { filter: 'grayscale(1) brightness(0.45)', opacity: 0.7 }

/** The boss you are standing in front of. One target, one action. */
function CurrentBoss({ boss, damage, onFight, onArena }) {
  const act = actById(boss.act)

  return (
    <Panel accent={act.color} className="p-3.5 text-center">
      <Chip color={act.color} className="mb-3">
        ACT {act.numeral} · {act.name}
      </Chip>
      <BossArt sprite={boss.sprite} size={116} className="mx-auto float-soft" />
      <div className="font-pixel text-[12px] mt-2" style={{ color: act.color }}>
        {boss.name}
      </div>
      <div className="text-[11px] text-ink-dim mt-1">{boss.title}</div>

      <div className="mt-3.5">
        <Bar pct={damage / boss.hp} color="var(--color-danger)" height={12} shine />
        <div className="flex justify-between mt-1.5">
          <span className="font-mono text-[11px] text-danger">{fmtFull(Math.round(damage))}</span>
          <span className="font-mono text-[11px] text-ink-faint">{fmtFull(boss.hp)} HP</span>
        </div>
      </div>

      <div className="mt-3 border p-2.5 text-left" style={{ borderColor: alpha(act.color, 40), background: alpha(act.color, 8) }}>
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[7px] text-ink-faint">WEAK TO</span>
          {boss.weak && (
            <span className="font-pixel text-[7px] px-1.5 py-0.5" style={{ background: act.color, color: 'var(--color-on-accent)' }}>
              x2 DMG
            </span>
          )}
        </div>
        <div className="text-[12px] mt-1.5" style={{ color: act.color }}>
          {boss.weakLabel}
        </div>
        <div className="text-[11px] text-ink-dim mt-1.5 leading-snug">{boss.beat}</div>
      </div>

      {/* This is the tab's whole reason to exist, so it gets the whole width
          and twice the height of an ordinary button. Sessions wear the boss
          down between visits; the arena is where it actually falls, and where
          you can fail. */}
      <button
        onClick={onArena}
        className="w-full mt-3.5 py-4 border-2 font-pixel text-[13px] transition-transform active:scale-[0.98]"
        style={{
          borderColor: 'var(--color-danger)',
          background: 'var(--color-danger)',
          color: 'var(--color-on-accent)',
          boxShadow: `0 0 26px -6px var(--color-danger)`,
        }}
      >
        BATTLE
        <span className="block font-pixel text-[7px] mt-1.5 opacity-80">{boss.name}</span>
      </button>
      <Btn full variant="ghost" size="sm" className="mt-1.5" onClick={onFight}>
        WHAT AM I FIGHTING?
      </Btn>
    </Panel>
  )
}

/** Shown when you have cleared everything your level allows. */
function Gated({ boss, levels }) {
  return (
    <Panel accent="var(--color-gold)" className="p-3.5 text-center">
      <Chip color="var(--color-gold)" className="mb-3">
        ROAD CLEAR
      </Chip>
      <BossArt sprite={boss.sprite} size={96} className="mx-auto" style={SILHOUETTE} />
      <div className="font-pixel text-[11px] text-gold mt-2.5">{boss.name} IS WAITING</div>
      <div className="text-[12px] text-ink-dim mt-2 leading-snug">
        You have beaten everything on this stretch of road. {levels === 1 ? 'One more level' : `${levels} more levels`} and it
        opens.
      </div>
    </Panel>
  )
}

/** One rung of the ladder. State reads off colour, art and a single tag. */
function PathRow({ boss, status, damage, onOpen }) {
  const act = actById(boss.act)
  const cleared = status === 'cleared'
  const fighting = status === 'fighting'
  const locked = status === 'locked'

  return (
    <button onClick={onOpen} className="w-full text-left active:brightness-125">
      <div
        className="flex items-center gap-2.5 px-2 py-2 border-b border-line last:border-0 min-h-[50px]"
        style={fighting ? { background: alpha(act.color, 14) } : undefined}
      >
        <div
          className="w-9 h-9 grid place-items-center shrink-0 border"
          style={{ borderColor: fighting ? act.color : 'var(--color-line)' }}
        >
          <BossArt
            sprite={boss.sprite}
            size={24}
            style={locked ? SILHOUETTE : cleared ? { filter: 'grayscale(0.85)', opacity: 0.45 } : undefined}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div
            className="font-pixel text-[8px] truncate"
            style={{ color: fighting ? act.color : cleared ? 'var(--color-ink-faint)' : 'var(--color-ink)' }}
          >
            {boss.name}
          </div>
          {fighting ? (
            <Bar pct={damage / boss.hp} color="var(--color-danger)" height={3} className="mt-1.5" />
          ) : (
            // A boss you already have the level for is queued, not locked, so it
            // shows its name rather than a requirement you have already met.
            <div className="text-[10px] text-ink-faint mt-1 truncate">
              {locked ? `Opens at level ${boss.level}` : boss.title}
            </div>
          )}
        </div>

        {cleared && <Icon name="check" size={13} color="var(--color-lime)" />}
        {fighting && (
          <span className="font-mono text-[11px] shrink-0" style={{ color: act.color }}>
            {Math.round((damage / boss.hp) * 100)}%
          </span>
        )}
        {locked && <Icon name="lock" size={12} color="var(--color-ink-faint)" />}
        {status === 'ahead' && <span className="font-pixel text-[7px] text-ink-faint shrink-0">LV {boss.level}</span>}
      </div>
    </button>
  )
}

/** Everything about one boss, including the ones you have not met yet. */
function Detail({ boss, status, damage, onBack, onFight }) {
  const act = actById(boss.act)
  const r = boss.reward

  return (
    <>
      <button onClick={onBack} className="font-pixel text-[8px] text-ink-faint min-h-[44px] flex items-center active:brightness-125">
        ← THE PATH
      </button>

      <div className="text-center">
        <BossArt sprite={boss.sprite} size={108} className="mx-auto" style={status === 'locked' ? SILHOUETTE : undefined} />
        <div className="font-pixel text-[11px] mt-2" style={{ color: act.color }}>
          {boss.name}
        </div>
        <div className="text-[12px] text-ink-dim mt-1.5">{boss.title}</div>
        <div className="font-pixel text-[7px] mt-2.5" style={{ color: act.color }}>
          ACT {act.numeral} · OPENS AT LEVEL {boss.level}
        </div>
      </div>

      <p className="text-[12px] text-ink-dim mt-3.5 leading-relaxed">{boss.lore}</p>

      {status === 'fighting' && (
        <div className="mt-3.5">
          <Bar pct={damage / boss.hp} color="var(--color-danger)" height={8} />
          <div className="flex justify-between mt-1.5">
            <span className="font-mono text-[11px] text-danger">{fmtFull(Math.round(damage))}</span>
            <span className="font-mono text-[11px] text-ink-faint">{fmtFull(boss.hp)} HP</span>
          </div>
        </div>
      )}
      {status === 'cleared' && (
        <div className="flex items-center gap-2 mt-3.5 border border-lime p-2.5">
          <Icon name="check" size={13} color="var(--color-lime)" />
          <span className="font-pixel text-[8px] text-lime">CLEARED</span>
        </div>
      )}

      <div className="mt-3 border border-line bg-panel-2 p-2.5">
        <div className="font-pixel text-[7px] text-ink-faint">WEAK TO {boss.weak && '· x2 DAMAGE'}</div>
        <div className="text-[12px] mt-1.5" style={{ color: act.color }}>
          {boss.weakLabel}
        </div>
        <div className="text-[11px] text-ink-dim mt-1.5 leading-snug">{boss.beat}</div>
      </div>

      <div className="mt-3 border border-line bg-panel-2 p-2.5">
        <div className="font-pixel text-[7px] text-ink-faint">DROPS</div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2">
          <span className="flex items-center gap-1.5">
            <Icon name="core" size={12} color="var(--color-gold)" />
            <span className="font-mono text-[11px] text-gold">{fmtFull(r.cores)}</span>
          </span>
          {r.gear && (
            <span className="font-pixel text-[7px]" style={{ color: RARITY[r.gear].color }}>
              {RARITY[r.gear].label} GEAR
            </span>
          )}
          {r.pet && (
            <span className="flex items-center gap-1.5">
              <PetView refId={r.pet} level={1} size={24} />
              <span className="font-pixel text-[7px] text-cyan">COMPANION</span>
            </span>
          )}
          {r.title && <span className="text-[11px] text-ink-dim">Title · {r.title}</span>}
        </div>
      </div>

      {status === 'fighting' && (
        <Btn full variant="danger" className="mt-3.5" onClick={onFight}>
          FIGHT IT
        </Btn>
      )}
    </>
  )
}

/**
 * The whole story mode, behind one tap. It used to be a tab of its own, which
 * made the campaign feel like a side room; now it opens off the day you are
 * actually living, which is where the sessions come from.
 */
/** On its own tab there is no dialog to be inside — the same content just sits
 *  on the page. `embedded` is which of the two it is. */
function Shell({ embedded, onClose, title, accent, children }) {
  if (!embedded) {
    return (
      <Modal open onClose={onClose} wide title={title} accent={accent}>
        {children}
      </Modal>
    )
  }
  return <div className="p-3">{children}</div>
}

export default function CampaignSheet({ onClose, embedded }) {
  const { state } = useGame()
  const [detail, setDetail] = useState(null)
  const [fighting, setFighting] = useState(null)
  const [arena, setArena] = useState(null)
  const c = campaignState(state.player, state.campaign)
  // Everything you have put down, the one you are on, and one silhouette of
  // what comes next — nothing further.
  const seen = useMemo(() => {
    const out = CAMPAIGN.filter((b) => c.defeated.includes(b.id)).map((b) => b.id)
    if (c.current) out.push(c.current.id)
    const rest = CAMPAIGN.filter((b) => !out.includes(b.id))
    if (rest.length) out.push(rest[0].id)
    return out
  }, [c])
  const ahead = CAMPAIGN.length - seen.length

  return (
    <>
      <Shell
        embedded={embedded}
        onClose={onClose}
        title={detail ? 'BOSS' : 'YOUR STORY'}
        accent={detail ? actById(detail.act).color : 'var(--color-neon)'}
      >
        {detail ? (
          <Detail
            boss={detail}
            status={statusOf(detail, state.player, c)}
            damage={c.damage}
            onBack={() => setDetail(null)}
            onFight={() => {
              setFighting(detail)
              setDetail(null)
            }}
          />
        ) : (
          <div className="space-y-3">
            {c.current ? (
              <CurrentBoss
                boss={c.current}
                damage={c.damage}
                onFight={() => setFighting(c.current)}
                onArena={() => setArena(c.current)}
              />
            ) : c.locked ? (
              <Gated boss={c.locked} levels={c.gatedBy} />
            ) : (
              <Panel accent="var(--color-gold)" className="p-4 text-center">
                <div className="font-pixel text-[12px] text-gold">STORY COMPLETE</div>
                <div className="text-[12px] text-ink-dim mt-2">Every boss down. You are the thing on the box.</div>
              </Panel>
            )}

            <Panel corners={false} className="p-2.5">
              <div className="flex items-center justify-between">
                <span className="font-pixel text-[8px] text-ink-faint">BOSSES DOWN</span>
                <span className="font-mono text-[12px] text-neon-bright">
                  {c.cleared} / {c.total}
                </span>
              </div>
              <Bar pct={c.cleared / c.total} color="var(--color-neon)" height={6} className="mt-2" />
            </Panel>

            <SectionTitle right={<span className="font-mono text-[10px] text-ink-faint">what you have walked</span>}>
              THE PATH
            </SectionTitle>
            {/* Only what you have actually met: the ones you put down, the one
                in front of you, and a silhouette of whatever is next. Listing
                all ten from the first session gave the story away and buried
                the only boss you can reach under nine you cannot. */}
            {ACTS.map((act) => {
              const bosses = CAMPAIGN.filter((b) => b.act === act.id && seen.includes(b.id))
              if (!bosses.length) return null
              const all = CAMPAIGN.filter((b) => b.act === act.id)
              const done = all.filter((b) => c.defeated.includes(b.id)).length
              return (
                <div key={act.id}>
                  <div className="flex items-center gap-2 px-0.5 mb-1.5">
                    <span className="font-pixel text-[8px]" style={{ color: act.color }}>
                      ACT {act.numeral}
                    </span>
                    <span className="font-pixel text-[7px] text-ink-faint truncate">{act.name}</span>
                    <span className="ml-auto font-mono text-[10px] text-ink-faint shrink-0">
                      {done}/{all.length}
                    </span>
                  </div>
                  <Panel corners={false} className="p-0.5">
                    {bosses.map((b) => (
                      <PathRow
                        key={b.id}
                        boss={b}
                        status={statusOf(b, state.player, c)}
                        damage={c.damage}
                        onOpen={() => setDetail(b)}
                      />
                    ))}
                  </Panel>
                </div>
              )
            })}
            {ahead > 0 && (
              <Panel corners={false} className="p-3 text-center">
                <div className="font-pixel text-[8px] text-ink-faint">{ahead} MORE AHEAD</div>
                <div className="text-[11px] text-ink-dim mt-1.5">
                  You meet them one at a time. Put this one down and the next comes into view.
                </div>
              </Panel>
            )}
          </div>
        )}
      </Shell>

      {fighting && (
        <LogSheet
          title={fighting.name}
          accepts={fightOrder(fighting)}
          accent={actById(fighting.act).color}
          onClose={() => setFighting(null)}
        />
      )}

      {arena && <Arena boss={arena} onClose={() => setArena(null)} />}
    </>
  )
}
