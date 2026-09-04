import { useState } from 'react'
import { Btn, Modal, Panel } from './ui'
import Icon from './Icon'
import { useGame } from '../game/useGame'
import { decodeSave, encodeSave } from '../game/save'

/**
 * Your character, as a string you can carry.
 *
 * There are no accounts yet, so nothing about you leaves this browser — which
 * also means nothing follows you to another one. A code is the honest version
 * of "log in on my phone": copy it here, paste it there, carry on.
 */
export default function SaveSheet({ onClose }) {
  const { state, restore, reset } = useGame()
  const [mode, setMode] = useState('copy')
  const [code, setCode] = useState('')
  const [note, setNote] = useState(null)
  const mine = encodeSave(state)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(mine)
      setNote('Copied. Paste it into RESTORE on the other device.')
    } catch {
      setNote('Could not reach the clipboard — select the code and copy it by hand.')
    }
  }

  const paste = () => {
    const next = decodeSave(code)
    if (!next) return setNote('That code did not read. Copy the whole thing, including the LVL100 at the front.')
    restore(next)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="YOUR CHARACTER" accent="var(--color-cyan)">
      <div className="grid grid-cols-2 gap-1.5">
        {[
          ['copy', 'MOVE IT'],
          ['restore', 'RESTORE'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => {
              setMode(id)
              setNote(null)
            }}
            aria-pressed={mode === id}
            className="font-pixel text-[8px] min-h-[44px] border transition-colors active:brightness-125"
            style={{
              color: mode === id ? 'var(--color-on-accent)' : 'var(--color-ink-dim)',
              background: mode === id ? 'var(--color-cyan)' : 'transparent',
              borderColor: mode === id ? 'var(--color-cyan)' : 'var(--color-line)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'copy' ? (
        <>
          <div className="text-[11px] text-ink-dim mt-3 leading-snug">
            This is your whole character — level, gear, streak, everything you have walked. Copy it, open the app on
            your phone, and paste it into RESTORE.
          </div>
          <textarea
            readOnly
            value={mine}
            onFocus={(e) => e.target.select()}
            className="w-full h-24 bg-panel border border-line p-2 mt-3 font-mono text-[10px] text-ink-dim scroll-thin"
            aria-label="Your character code"
          />
          <Btn full className="mt-2" onClick={copy}>
            COPY THE CODE
          </Btn>
        </>
      ) : (
        <>
          <div className="text-[11px] text-ink-dim mt-3 leading-snug">
            Paste a character code here. It replaces whatever is on this device, so copy this one out first if you want
            to keep it.
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="LVL100.1|..."
            className="w-full h-24 bg-panel border border-line p-2 mt-3 font-mono text-[10px] text-ink placeholder:text-ink-faint focus:border-cyan outline-none scroll-thin"
            aria-label="Paste a character code"
          />
          <Btn full className="mt-2" disabled={!code.trim()} onClick={paste}>
            RESTORE THIS CHARACTER
          </Btn>
        </>
      )}

      {note && <div className="text-[11px] text-cyan mt-2 leading-snug">{note}</div>}

      <Panel corners={false} className="p-3 mt-4">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0">
            <Icon name="spark" size={11} color="var(--color-ink-faint)" />
          </span>
          <p className="text-[10px] text-ink-faint leading-relaxed">
            Nothing here is sent anywhere — your character lives in this browser and nowhere else. Clearing your
            browsing data deletes it, so keep a code somewhere if you care about the streak.
          </p>
        </div>
        <button
          onClick={() => {
            if (note === 'confirm-reset') {
              reset()
              onClose()
            } else setNote('confirm-reset')
          }}
          className="font-pixel text-[7px] mt-3 min-h-[44px] w-full border border-line active:brightness-125"
          style={{ color: note === 'confirm-reset' ? 'var(--color-danger)' : 'var(--color-ink-faint)' }}
        >
          {note === 'confirm-reset' ? 'TAP AGAIN TO DELETE EVERYTHING' : 'START OVER'}
        </button>
      </Panel>
    </Modal>
  )
}
