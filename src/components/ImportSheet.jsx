import { useRef, useState } from 'react'
import { Btn, Modal, Panel } from './ui'
import Icon from './Icon'
import { useGame } from '../game/useGame'
import { readWorkout, spanMetres } from '../game/workout'
import { TRACKED } from '../game/session'
import { ACTIVITIES } from '../game/config'
import { fmtFull } from '../game/engine'

/**
 * Bringing in a workout that happened somewhere else.
 *
 * This screen exists in the shape it does because of a limitation worth being
 * straight about, and it says so on the screen rather than only in a comment:
 * neither Apple Health nor Android's Health Connect can be read by a web app.
 * Both are native-only by design. So the honest version is a file, and both
 * platforms — and every watch and running app — will give you one.
 *
 * The instructions are on the screen for the same reason. "Import a GPX" is
 * not an instruction to somebody who has never heard of GPX, and a feature
 * nobody can find the input for is a feature that does not exist.
 */

/** Where the file comes from, and how to get one out. */
const SOURCES = [
  {
    id: 'apple',
    name: 'Apple Health / Fitness',
    how: 'Open a workout in Fitness, tap the share button, and choose Export Route. That is the GPX.',
    note: 'Apple exports the route, not the whole history. One workout at a time.',
  },
  {
    id: 'android',
    name: 'Android / Health Connect',
    how: 'Health Connect has no share button of its own — export from whichever app recorded the run: Strava, Adidas, Nike, Samsung Health.',
    note: 'Google Takeout will give you the raw Health Connect data too, as a much bigger file.',
  },
  {
    id: 'watch',
    name: 'Garmin, Polar, Suunto, Coros',
    how: 'Open the activity on the web dashboard and use Export, then pick GPX or TCX.',
    note: 'TCX carries the distance the watch measured itself, which is the better of the two.',
  },
  {
    id: 'strava',
    name: 'Strava, Runkeeper, Nike',
    how: 'Open the activity, then Export GPX from the menu on the page.',
    note: 'Strava calls it Export GPX under the three dots.',
  },
]

function Found({ workout, activityId, onPick }) {
  const km = workout.metres / 1000
  const mins = Math.round(workout.ms / 60000)
  const when = workout.startedAt ? new Date(workout.startedAt) : null
  const far = spanMetres(workout.points)

  return (
    <>
      <Panel className="p-3.5 mt-4">
        <div className="font-display text-[14px] text-ink">What is in the file</div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            [km >= 1 ? km.toFixed(2) : String(workout.metres), km >= 1 ? 'km' : 'metres'],
            [mins ? String(mins) : '—', 'minutes'],
            [fmtFull(workout.points.length), 'points'],
          ].map(([n, label]) => (
            <div key={label}>
              <div className="figure text-[19px] text-ink leading-none">{n}</div>
              <div className="label text-ink-faint mt-1.5">{label}</div>
            </div>
          ))}
        </div>
        <div className="text-[14px] text-ink-dim leading-snug mt-3">
          {when
            ? `Recorded ${when.toLocaleDateString()} at ${when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
            : 'No timestamps in this file, so there is no duration to read. It will still count the distance.'}
          {far > 0 && ` Furthest point ${(far / 1000).toFixed(1)} km from the start.`}
        </div>
      </Panel>

      <div className="mt-4">
        <div className="label text-ink-faint">What was it</div>
        <div className="flex flex-wrap gap-2 mt-2">
          {TRACKED.filter((a) => a.unit === 'km' || a.unit === 'min').map((a) => (
            <button
              key={a.id}
              onClick={() => onPick(a.id)}
              aria-pressed={activityId === a.id}
              className="font-display text-[13px] px-3 min-h-[44px] border rounded-full transition-colors"
              style={{
                color: activityId === a.id ? 'var(--color-on-accent)' : 'var(--color-ink-dim)',
                background: activityId === a.id ? 'var(--color-cyan)' : 'transparent',
                borderColor: activityId === a.id ? 'var(--color-cyan)' : 'var(--color-line)',
              }}
            >
              {a.name}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

export default function ImportSheet({ onClose }) {
  const { importWorkout } = useGame()
  const file = useRef(null)
  const [workout, setWorkout] = useState(null)
  const [activityId, setActivityId] = useState(null)
  const [note, setNote] = useState(null)
  const [open, setOpen] = useState(null)

  const read = async (f) => {
    setNote(null)
    if (!f) return
    // Nothing is uploaded anywhere. The file is read by the browser, in the
    // browser, and the app makes no network request at any point in this.
    const text = await f.text().catch(() => null)
    const found = text && readWorkout(text)
    if (!found) {
      setWorkout(null)
      return setNote(
        'No track in that file. It needs to be a GPX or a TCX with positions in it — an Apple Health export zip is a different thing, and a screenshot is not one at all.',
      )
    }
    setWorkout(found)
    setActivityId(found.sport ?? 'run')
  }

  const bring = () => {
    const act = ACTIVITIES.find((a) => a.id === activityId)
    if (!workout || !act) return
    importWorkout(activityId, workout, 'File import')
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="BRING A WORKOUT IN" accent="var(--color-cyan)">
      {/* Said first, because somebody opening this is looking for a connect
          button and the kind thing is to tell them straight away that there
          is not one, and why. */}
      <p className="text-[15px] text-ink leading-relaxed">
        There is no connect button, and it is not an oversight. Apple Health and Health Connect can only be read by a
        native app installed from a store — neither one has a way in from a browser, on purpose. LVL100 runs in a
        browser.
      </p>
      <p className="text-[14px] text-ink-dim leading-relaxed mt-2">
        What they all do have is an export. Drop the file in and the workout counts for XP, fills in the map and lands
        on the day it actually happened.
      </p>

      <input
        ref={file}
        type="file"
        accept=".gpx,.tcx,.xml,application/gpx+xml,application/xml,text/xml"
        className="sr-only"
        onChange={(e) => read(e.target.files?.[0])}
      />
      <Btn full className="mt-4" onClick={() => file.current?.click()}>
        Choose a file
      </Btn>

      {note && (
        <p className="text-[14px] text-ink-dim leading-snug mt-3" role="status">
          {note}
        </p>
      )}

      {workout && <Found workout={workout} activityId={activityId} onPick={setActivityId} />}

      {workout && (
        <>
          <p className="text-[13px] text-ink-faint leading-snug mt-4">
            An old workout pays its XP and goes in your history. It will not move today&apos;s streak or today&apos;s
            three — those are about today, and importing last month cannot make you have trained last month.
          </p>
          <Btn full className="mt-3" onClick={bring}>
            Bring it in
          </Btn>
        </>
      )}

      {/* Folded away, because it is four screens of instructions and only one
          of them is yours. */}
      <div className="mt-5 pt-4 border-t border-line">
        <div className="label text-ink-faint">WHERE TO GET ONE</div>
        <div className="space-y-2 mt-2">
          {SOURCES.map((s) => (
            <div key={s.id} className="border border-line rounded-[var(--radius-sm)] overflow-hidden">
              <button
                onClick={() => setOpen(open === s.id ? null : s.id)}
                aria-expanded={open === s.id}
                className="w-full flex items-center gap-2 px-3 min-h-[48px] text-left active:bg-panel-2"
              >
                <span className="flex-1 font-display text-[14px] text-ink">{s.name}</span>
                <Icon
                  name="chevron"
                  size={11}
                  color="var(--color-ink-faint)"
                  className={open === s.id ? 'rotate-90' : ''}
                />
              </button>
              {open === s.id && (
                <div className="px-3 pb-3">
                  <p className="text-[14px] text-ink-dim leading-snug">{s.how}</p>
                  <p className="text-[13px] text-ink-faint leading-snug mt-1.5">{s.note}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Btn full variant="ghost" className="mt-5" onClick={onClose}>
        Close
      </Btn>
    </Modal>
  )
}
