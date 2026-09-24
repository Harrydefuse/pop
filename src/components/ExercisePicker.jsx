import { useMemo, useState } from 'react'
import { Btn, Modal, Panel, SectionTitle } from './ui'
import Icon from './Icon'
import { useGame } from '../game/useGame'
import { GEAR, MUSCLES, exerciseByName, searchExercises } from '../game/exercises'
import { alpha } from '../game/color'

/**
 * Choosing what you are about to do a set of.
 *
 * The old picker was eighteen buttons in a two-column grid, which works right
 * up until someone's programme has a Bulgarian split squat in it — and then the
 * whole session gets logged as "Other" and every chart it feeds goes flat.
 *
 * So: search first, because someone who knows what they want should type four
 * letters and go; filters for the days you are working around what the gym has
 * free; recents at the top, because most people rotate through the same fifteen
 * exercises forever; and a way to add your own, because no list is finished.
 */

/** One array, so a save without the field yet does not re-run every memo. */
const NONE = []

export default function ExercisePicker({ open, current, recent = [], onPick, onClose }) {
  const { state, addExercise } = useGame()
  const custom = state.exercises ?? NONE
  const [q, setQ] = useState('')
  const [muscle, setMuscle] = useState(null)
  const [gear, setGear] = useState(null)
  const [adding, setAdding] = useState(false)

  const results = useMemo(
    () => searchExercises(q, { custom, muscle, gear }),
    [q, custom, muscle, gear],
  )

  // Only when nothing is being searched or filtered: a "recent" section that
  // ignores the filter you just set is a section in the way.
  const showRecent = !q && !muscle && !gear && recent.length > 0
  const recents = showRecent ? recent.slice(0, 6) : []
  const rest = showRecent ? results.filter((e) => !recents.includes(e.name)) : results

  const Row = ({ e, last }) => (
    <button
      key={e.name}
      onClick={() => {
        onPick(e.name)
        onClose()
      }}
      aria-pressed={current === e.name}
      data-exercise={e.name}
      className={`w-full flex items-center gap-3 px-3.5 py-3 min-h-[56px] text-left ${
        last ? '' : 'border-b border-line'
      } active:bg-panel-2`}
    >
      <span
        className="w-1.5 h-8 shrink-0 rounded-full"
        style={{ background: MUSCLES.find((m) => m.id === e.muscle)?.tone ?? 'var(--color-line-hot)' }}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[15px] text-ink truncate">{e.name}</span>
        <span className="block label text-ink-faint mt-1">
          {MUSCLES.find((m) => m.id === e.muscle)?.name ?? 'Other'} · {e.gear}
          {e.custom ? ' · yours' : ''}
        </span>
      </span>
      {current === e.name && <Icon name="check" size={13} color="var(--color-go)" />}
    </button>
  )

  if (!open) return null

  return (
    <Modal open onClose={onClose} title="EXERCISE" wide>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search 140+ exercises"
        aria-label="Search exercises"
        className="w-full min-h-[48px] px-3 text-[15px] text-ink bg-panel-2 border border-line rounded-[var(--radius-sm)] placeholder:text-ink-faint focus:border-neon focus:ring-2 focus:ring-[var(--color-neon)] outline-none"
      />

      {/* Two rows of filters, both optional, both clearing themselves when
          tapped again — a filter you cannot get out of is a trap. */}
      <div className="flex gap-1.5 mt-2.5 overflow-x-auto scroll-thin pb-1">
        {MUSCLES.map((m) => {
          const on = muscle === m.id
          return (
            <button
              key={m.id}
              onClick={() => setMuscle(on ? null : m.id)}
              aria-pressed={on}
              className="shrink-0 label px-3 min-h-[44px] rounded-full border transition-colors"
              style={{
                borderColor: on ? m.tone : 'var(--color-line)',
                background: on ? alpha(m.tone, 14) : 'transparent',
                color: on ? 'var(--color-ink)' : 'var(--color-ink-faint)',
              }}
            >
              {m.name}
            </button>
          )
        })}
      </div>
      <div className="flex gap-1.5 mt-1 overflow-x-auto scroll-thin pb-1">
        {GEAR.map((g) => {
          const on = gear === g
          return (
            <button
              key={g}
              onClick={() => setGear(on ? null : g)}
              aria-pressed={on}
              className="shrink-0 label px-3 min-h-[44px] rounded-full border transition-colors"
              style={{
                borderColor: on ? 'var(--color-line-hot)' : 'var(--color-line)',
                background: on ? 'var(--color-panel-2)' : 'transparent',
                color: on ? 'var(--color-ink)' : 'var(--color-ink-faint)',
              }}
            >
              {g}
            </button>
          )
        })}
      </div>

      {recents.length > 0 && (
        <div className="mt-3">
          <SectionTitle>What you have been doing</SectionTitle>
          <Panel>
            {recents.map((name, i) => {
              const e = exerciseByName(name, custom) ?? { name, muscle: 'full', gear: 'other' }
              return <Row key={name} e={e} last={i === recents.length - 1} />
            })}
          </Panel>
        </div>
      )}

      <div className="mt-3">
        <SectionTitle right={<span className="label text-ink-faint">{rest.length}</span>}>
          {q || muscle || gear ? 'Matches' : 'Everything'}
        </SectionTitle>
        {rest.length ? (
          <Panel>
            {rest.map((e, i) => (
              <Row key={e.name} e={e} last={i === rest.length - 1} />
            ))}
          </Panel>
        ) : (
          <Panel className="p-4">
            <div className="text-[14px] text-ink-dim text-center leading-snug">
              Nothing matches that. Add it and it is on your list from now on.
            </div>
          </Panel>
        )}
      </div>

      <Btn full variant="ghost" className="mt-3" onClick={() => setAdding(true)}>
        <Icon name="plus" size={12} color="currentColor" /> Add your own exercise
      </Btn>

      {adding && (
        <AddExercise
          initial={q}
          onClose={() => setAdding(false)}
          onAdd={(name, m, g) => {
            addExercise(name, m, g)
            setAdding(false)
            setQ('')
            setMuscle(null)
            setGear(null)
            onPick(name)
            onClose()
          }}
        />
      )}
    </Modal>
  )
}

/** Naming one the catalogue does not have. */
function AddExercise({ initial = '', onAdd, onClose }) {
  const [name, setName] = useState(initial)
  const [muscle, setMuscle] = useState('chest')
  const [gear, setGear] = useState('barbell')
  const ok = name.trim().length > 1

  return (
    <Modal open onClose={onClose} title="ADD AN EXERCISE">
      <p className="text-[14px] text-ink-dim leading-relaxed">
        It joins your list permanently, and it counts towards the muscle you put it under — so the coverage chart
        keeps telling the truth.
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={40}
        placeholder="Name it"
        aria-label="Exercise name"
        className="w-full min-h-[48px] px-3 mt-3 text-[15px] text-ink bg-panel-2 border border-line rounded-[var(--radius-sm)] placeholder:text-ink-faint focus:border-neon focus:ring-2 focus:ring-[var(--color-neon)] outline-none"
      />

      <SectionTitle>Trains</SectionTitle>
      <div className="grid grid-cols-3 gap-1.5">
        {MUSCLES.map((m) => {
          const on = muscle === m.id
          return (
            <button
              key={m.id}
              onClick={() => setMuscle(m.id)}
              aria-pressed={on}
              className="label px-2 min-h-[44px] rounded-[var(--radius-sm)] border transition-colors"
              style={{
                borderColor: on ? m.tone : 'var(--color-line)',
                background: on ? alpha(m.tone, 14) : 'transparent',
                color: on ? 'var(--color-ink)' : 'var(--color-ink-faint)',
              }}
            >
              {m.name}
            </button>
          )
        })}
      </div>

      <SectionTitle>Needs</SectionTitle>
      <div className="grid grid-cols-3 gap-1.5">
        {GEAR.map((g) => {
          const on = gear === g
          return (
            <button
              key={g}
              onClick={() => setGear(g)}
              aria-pressed={on}
              className="label px-2 min-h-[44px] rounded-[var(--radius-sm)] border transition-colors"
              style={{
                borderColor: on ? 'var(--color-line-hot)' : 'var(--color-line)',
                background: on ? 'var(--color-panel-2)' : 'transparent',
                color: on ? 'var(--color-ink)' : 'var(--color-ink-faint)',
              }}
            >
              {g}
            </button>
          )
        })}
      </div>

      <Btn full variant="go" className="mt-4" disabled={!ok} onClick={() => onAdd(name.trim(), muscle, gear)}>
        ADD IT
      </Btn>
    </Modal>
  )
}
