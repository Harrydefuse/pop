import { useEffect, useState } from 'react'
import { Btn, Panel } from './ui'
import Icon from './Icon'
import { canInstall, isIOS, isStandalone, promptInstall, subscribeInstall } from '../pwa'

// A per-device convenience, not part of the save: a phone that has been told
// "not now" should stay told, and a second phone shouldn't inherit that.
const KEY = 'lvl100.install.dismissed'

const dismissed = () => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Offers to put LVL100 on the home screen, where it opens full screen and
 * runs with no signal. Chrome and friends hand us a real prompt; iOS has none,
 * so all we can do there is point at the share sheet.
 */
export default function InstallCard() {
  const [ready, setReady] = useState(canInstall)
  const [gone, setGone] = useState(dismissed)

  useEffect(() => subscribeInstall(() => setReady(canInstall())), [])

  const ios = isIOS() && !isStandalone()
  if (gone || isStandalone() || (!ready && !ios)) return null

  const hide = () => {
    setGone(true)
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      /* private mode — it just comes back next launch */
    }
  }

  return (
    <Panel className="p-4" accent="var(--color-cyan)">
      <div className="flex items-start gap-3">
        <span
          className="grid place-items-center w-10 h-10 shrink-0 rounded-[var(--radius-sm)]"
          style={{ background: 'color-mix(in srgb, var(--color-cyan) 14%, transparent)' }}
        >
          <Icon name="plus" size={19} color="var(--color-cyan)" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="label text-ink-faint">Keep it</div>
          <div className="font-display text-[17px] text-ink mt-1 leading-tight">
            Install LVL100 on your phone
          </div>
          <div className="text-[13px] text-ink-dim mt-1.5 leading-snug">
            {ios
              ? 'Tap Share, then Add to Home Screen. It opens full screen and keeps working in a basement gym with no signal.'
              : 'Opens full screen from your home screen, launches instantly, and keeps working with no signal — basement gyms, planes, the lot.'}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-3.5">
        {!ios && (
          <Btn
            size="sm"
            className="flex-1"
            onClick={async () => {
              if (await promptInstall()) hide()
            }}
          >
            Add to home screen
          </Btn>
        )}
        <Btn size="sm" variant="ghost" className={ios ? 'w-full' : ''} onClick={hide}>
          {ios ? 'Got it' : 'Not now'}
        </Btn>
      </div>
    </Panel>
  )
}
