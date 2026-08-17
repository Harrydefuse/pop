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
import Train from './screens/Train'
import Arena from './screens/Arena'
import Guild from './screens/Guild'
import Hero from './screens/Hero'

const PITCH = [
  ['TRACK PROGRESS', 'Reps, kilometres, sleep and aim time all become stats you can watch climb.'],
  ['STAY MOTIVATED', 'Friends, leaderboards and a streak that notices when you go quiet.'],
  ['1% EVERY DAY', 'In the gym and in your queue. Small, boring, compounding.'],
  ['KEEP THE GAMES', 'You do not have to quit gaming to get your life on track. Do both, on purpose.'],
]

function DesktopPitch() {
  return (
    <aside className="hidden lg:flex flex-col justify-center max-w-[400px] pr-10">
      <div className="font-pixel text-[34px] leading-none">
        LEVEL <span className="text-neon">100</span>
      </div>
      <div className="font-pixel text-[9px] text-ink-faint mt-4 tracking-widest">FITNESS RPG FOR GAMERS</div>

      <p className="text-[15px] text-ink-dim mt-7 leading-relaxed">
        A fitness app that treats your body like a character sheet. Verified workouts pay out XP, stats, loot and pets —
        and your gaming stays in the picture instead of being the thing you feel guilty about.
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
  const [arenaTab, setArenaTab] = useState('friends')
  const [axis, setAxis] = useState(false)

  const questsOpen = state.dailies.some((q) => q.progress < q.goal)

  return (
    <div className="relative w-full sm:w-[400px] h-[100dvh] sm:h-[calc(100vh-64px)] sm:max-h-[860px] flex flex-col overflow-hidden bg-void border-line sm:border-2 scanlines">
      {!state.onboarded && <Onboarding />}

      <TopBar onOpenProfile={() => setTab('hero')} onOpenAxis={() => setAxis(true)} />

      <main className="flex-1 overflow-y-auto scroll-thin arcade-bg">
        {tab === 'home' && <Home setTab={setTab} setArenaTab={setArenaTab} />}
        {tab === 'train' && <Train setTab={setTab} />}
        {tab === 'arena' && <Arena tab={arenaTab} setTab={setArenaTab} />}
        {tab === 'guild' && <Guild />}
        {tab === 'hero' && <Hero />}
        <div className="h-4" />
      </main>

      <TabBar tab={tab} setTab={setTab} badges={{ home: questsOpen ? 1 : 0 }} />

      <Toasts />
      <RewardModal />
      <Axis open={axis} onClose={() => setAxis(false)} />
    </div>
  )
}

export default function App() {
  return (
    <GameProvider>
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-void sm:p-8">
        <DesktopPitch />
        <Device />
      </div>
    </GameProvider>
  )
}
