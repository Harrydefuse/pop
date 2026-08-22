import { useState } from 'react'
import { GameProvider } from './game/store'
import { useGame } from './game/useGame'
import TopBar from './components/TopBar'
import TabBar from './components/TabBar'
import Toasts from './components/Toasts'
import RewardModal from './components/RewardModal'
import Onboarding from './components/Onboarding'
import Axis from './components/Axis'
import Icon from './components/Icon'
import Home from './screens/Home'
import Friends from './screens/Friends'
import Hero from './screens/Hero'

const PITCH = [
  ['IT IS A GAME', 'Ten bosses, three acts, an ending. Fitness is the controller, not the point.'],
  ['MOVE TO LEVEL UP', 'Every session you log is XP, loot and damage on whatever is in your way.'],
  ['YOUR OWN RUN', 'Personal bosses gate your story. World raids are where everyone turns up at once.'],
  ['KEEP THE GAMES', 'You do not have to quit gaming to get your life on track. Do both, on purpose.'],
]

function DesktopPitch({ onExit }) {
  return (
    <aside className="hidden pitch:flex flex-col justify-center max-w-[400px] pr-10">
      {onExit && (
        <button
          onClick={onExit}
          className="font-pixel text-[9px] text-ink-faint hover:text-neon self-start mb-6 min-h-[44px] flex items-center"
        >
          ← BACK TO SITE
        </button>
      )}
      <div className="font-pixel text-[34px] leading-none">
        LEVEL <span className="text-neon">100</span>
      </div>
      <div className="font-pixel text-[9px] text-ink-faint mt-4 tracking-widest">FITNESS RPG</div>

      <p className="text-[15px] text-ink-dim mt-7 leading-relaxed">
        An RPG you play by moving. Verified workouts pay out XP, stats, loot and pets, and the whole thing runs as a
        story mode — so getting fitter is not the goal you grind towards, it is how you finish the game.
      </p>

      <div className="mt-8 space-y-4">
        {PITCH.map(([t, d]) => (
          <div key={t} className="flex gap-3">
            <span className="mt-1 shrink-0">
              <Icon name="spark" size={12} color="var(--color-neon)" />
            </span>
            <div>
              <div className="font-pixel text-[9px] text-ink">{t}</div>
              <div className="text-[13px] text-ink-dim mt-1.5 leading-relaxed">{d}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="font-mono text-[11px] text-ink-faint mt-9 border-t border-line pt-4">
        Prototype · all data lives in your browser
      </div>
    </aside>
  )
}

function Device() {
  const { state } = useGame()
  const [tab, setTab] = useState('home')
  const [axis, setAxis] = useState(false)

  const questsOpen = state.dailies.some((d) => !d.done)

  return (
    <div className="relative w-full device:w-[400px] h-[100dvh] device:h-[calc(100vh-64px)] device:max-h-[860px] flex flex-col overflow-hidden bg-void border-line device:border-2 scanlines">
      {!state.onboarded && <Onboarding />}

      <TopBar onOpenProfile={() => setTab('hero')} onOpenAxis={() => setAxis(true)} />

      <main className="flex-1 overflow-y-auto scroll-thin arcade-bg">
        {/* Caps the measure when the app runs full-bleed on a wide, short
            viewport (landscape phone) — cards stay readable instead of
            stretching edge to edge. No-op inside the 400px frame. */}
        <div className="mx-auto w-full max-w-[520px]">
          {tab === 'home' && <Home />}
          {tab === 'friends' && <Friends />}
          {tab === 'hero' && <Hero />}
          <div className="h-4" />
        </div>
      </main>

      <TabBar tab={tab} setTab={setTab} badges={{ home: questsOpen ? 1 : 0 }} />

      <Toasts />
      <RewardModal />
      <Axis open={axis} onClose={() => setAxis(false)} />
    </div>
  )
}

export default function App({ onExit }) {
  return (
    <GameProvider>
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-void device:p-8">
        <DesktopPitch onExit={onExit} />
        <Device />
      </div>
    </GameProvider>
  )
}
