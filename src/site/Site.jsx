import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './site.css'
import { PetView, BossArt } from '../components/Sprites'
import { ACTIVITIES, DAILY_CHEST, RARITY, RARITY_ORDER, STATS } from '../game/config'
import { grantXp, resolveActivity, statLevel, xpToNext } from '../game/engine'
import { BOSS } from '../game/data'

/* The demo below runs the app's real engine rather than a mock of it, so the
   numbers a visitor sees are the numbers they'd earn. */
const DEMO_PLAYER = {
  level: 12,
  xp: 220,
  streak: 6,
  classId: 'strider',
  stats: { STR: 1400, END: 2600, AGI: 1100, VIT: 1900, FOCUS: 700 },
  pets: [],
  activePetId: null,
  stones: [],
  equipped: {},
  inventory: [],
}

const DEMO_PICKS = ['run', 'lift', 'hiit', 'sleep', 'aim']

function useReveal() {
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('js-motion')
    const nodes = Array.from(document.querySelectorAll('.reveal'))
    const show = (el) => el.classList.add('in')

    if (!('IntersectionObserver' in window)) {
      nodes.forEach(show)
      return () => root.classList.remove('js-motion')
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            show(e.target)
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    )
    nodes.forEach((n) => io.observe(n))

    // Safety net: anything still hidden after a beat gets shown regardless, so
    // a headless render or an observer that never fires can't ship a blank page.
    const t = setTimeout(() => nodes.forEach(show), 1400)
    return () => {
      clearTimeout(t)
      io.disconnect()
      root.classList.remove('js-motion')
    }
  }, [])
}

/* ------------------------------------------------------------------ hero --- */

function LiveRig() {
  const [player, setPlayer] = useState(DEMO_PLAYER)
  const [bumped, setBumped] = useState(null)
  const [lastGain, setLastGain] = useState(null)
  const [leveled, setLeveled] = useState(false)
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const picks = useMemo(
    () => DEMO_PICKS.map((id) => ACTIVITIES.find((a) => a.id === id)).filter(Boolean),
    [],
  )

  const doActivity = useCallback((act) => {
    setPlayer((prev) => {
      const result = resolveActivity(prev, {
        activityId: act.id,
        amount: act.default,
        verified: true,
      })
      const { level, xp, levelsGained } = grantXp(prev.level, prev.xp, result.xp)
      const stats = { ...prev.stats }
      for (const [k, v] of Object.entries(result.statGains)) stats[k] = (stats[k] ?? 0) + v

      setLastGain({ xp: result.xp, stats: result.statGains, name: act.name })
      setBumped(Object.keys(result.statGains))
      if (levelsGained.length) setLeveled(true)

      const t1 = setTimeout(() => setBumped(null), 900)
      const t2 = setTimeout(() => setLeveled(false), 1600)
      timers.current.push(t1, t2)

      return { ...prev, level, xp, stats }
    })
  }, [])

  const need = xpToNext(player.level)
  const pct = Math.min(100, (player.xp / need) * 100)

  return (
    <div className="rig">
      <div className="rig-head">
        <div>
          <div className="pix" style={{ color: 'var(--ink-3)' }}>Your level</div>
          <div className="rig-lv" aria-live="polite">
            LV <span>{player.level}</span>
            {leveled && (
              <span style={{ fontSize: '0.9rem', marginLeft: '0.5rem', color: 'var(--lime-ink)' }}>
                levelled up
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="pix" style={{ color: 'var(--ink-3)' }}>XP</div>
          <div style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
            {Math.round(player.xp).toLocaleString()} / {need.toLocaleString()}
          </div>
        </div>
      </div>

      <div>
        <div className="meter">
          <div className="meter-fill" style={{ width: `${pct}%` }} />
          <div className="meter-ticks" />
        </div>
        <p style={{ fontSize: '0.85rem', marginTop: '0.6rem', color: 'var(--ink-3)' }}>
          {lastGain
            ? `${lastGain.name} logged — +${lastGain.xp} XP`
            : 'Log something and watch what it pays.'}
        </p>
      </div>

      <div className="picks">
        {picks.map((a) => (
          <button key={a.id} className="pick" onClick={() => doActivity(a)}>
            {a.name}
            <span className="gain">
              {a.default}
              {a.unit === 'kg volume' ? 'kg' : a.unit === 'hours' ? 'h' : a.unit === 'min' ? 'm' : ` ${a.unit}`}
            </span>
          </button>
        ))}
      </div>

      <div className="rig-stats">
        {STATS.map((s) => {
          const lv = statLevel(player.stats[s.key])
          const hit = bumped?.includes(s.key)
          return (
            <div className="stat-row" key={s.key}>
              <span className="k">{s.key}</span>
              <span className="stat-val">
                <span className={`v${hit ? ' bumped' : ''}`}>{lv}</span>
                {/* Stat *levels* climb slowly by design, so the points a session
                    actually paid are shown too — otherwise the demo looks inert. */}
                {hit && <span className="gained">+{lastGain.stats[s.key]}</span>}
              </span>
              <span className="stat-bar">
                <i style={{ width: `${Math.min(100, lv * 3)}%` }} />
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- chest --- */

function ChestOdds() {
  return (
    <div className="stack wide" style={{ width: '100%' }}>
      <div className="readout" style={{ width: '100%' }}>
        <span className="pix" style={{ color: 'var(--on-deep-2)' }}>
          {DAILY_CHEST.name}
        </span>
        <span className="big">{DAILY_CHEST.rolls} pulls a day</span>
        <span style={{ color: 'var(--on-deep-2)' }}>{DAILY_CHEST.note}</span>
      </div>

      <div className="odds">
        {RARITY_ORDER.map((k) => (
          <div className="odd" key={k}>
            <span className="odd-bar" style={{ background: RARITY[k].color, height: `${18 + RARITY[k].weight * 1.1}px` }} />
            <span className="odd-pct" style={{ color: RARITY[k].color }}>
              {RARITY[k].weight}%
            </span>
            <span className="odd-name">{RARITY[k].label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ page --- */

export default function Site({ onEnterApp }) {
  useReveal()

  const go = (e) => {
    e.preventDefault()
    onEnterApp()
  }

  return (
    <div className="site">
      <header className="site-nav">
        <div className="wrap bar">
          <a className="mark" href="#top">
            LVL<span className="hundred">100</span>
          </a>
          <span className="spacer" />
          <a className="btn sm" href="#/app" onClick={go}>
            Try the prototype
          </a>
        </div>
      </header>

      <main id="top">
        {/* ------------------------------------------------------------ hero */}
        <section className="hero">
          <div className="wrap hero-grid">
            <div className="stack wide reveal">
              <h1>
                Don&rsquo;t quit gaming
                <span className="soft">to get fit.</span>
              </h1>
              <p className="lede">
                LVL100 is an RPG you play by moving. Ten bosses, three acts and an ending — and the
                only way through is real workouts, timed by the app, on a map of the city you live in.
              </p>
              <div className="hero-actions">
                <a className="btn" href="#/app" onClick={go}>
                  Try the prototype
                </a>
                <a className="btn ghost" href="#campaign">
                  See the game
                </a>
              </div>
              <span className="hero-note">
                No account, no download — it runs right here in your browser.
              </span>
            </div>

            <div className="reveal">
              <LiveRig />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ permission */}
        <section className="sink">
          <div className="wrap split">
            <div className="stack reveal">
              <h2>Nobody here thinks your hobby is the problem.</h2>
            </div>
            <div className="stack reveal">
              <p className="lede">
                Most fitness apps are built on guilt. Miss a day and they let you know. Play games
                instead of training and the message is that you picked wrong.
              </p>
              <p>
                We think that&rsquo;s both unkind and ineffective. Games are good. The thing worth
                changing isn&rsquo;t what you enjoy — it&rsquo;s that moving your body currently pays
                you nothing you can feel. So we made it pay.
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- how */}
        <section id="how">
          <div className="wrap stack wide">
            <div className="stack reveal">
              <h2>Three things happen every time you move.</h2>
              <p className="lede">In this order, every session, whether it&rsquo;s a 5k or a walk to the shops.</p>
            </div>

            <div className="steps reveal">
              <div className="step">
                <span className="bar" />
                <h3>You start it in the app</h3>
                <p>
                  Walk, run, ride, swim, gym, HIIT, calisthenics, sport, mobility — thirteen kinds, and
                  none of them require a gym. Pick one and the clock starts.
                </p>
              </div>
              <div className="step">
                <span className="bar" />
                <h3>The app does the counting</h3>
                <p>
                  Nothing is typed in, so nothing can be made up. Outdoors it follows your route, so
                  distance and pace are measured rather than claimed — and the XP costs exactly the time
                  it says it does.
                </p>
              </div>
              <div className="step">
                <span className="bar" />
                <h3>You get paid</h3>
                <p>
                  XP toward your level, points into five stats, damage on whatever boss is in front of
                  you, ground cleared on the map, and a chest at the end of the day.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- campaign */}
        <section id="campaign" className="deep">
          <div className="wrap stack wide">
            <div className="stack reveal">
              <h2>It has an ending.</h2>
              <p className="lede">
                Ten bosses across three acts, each one standing at a real place in the city, each one
                gated behind a level you have to earn. The Warden waits at Circular Quay from level
                five. LVL100 is at the Heads, and almost nobody will get there.
              </p>
              <p>
                Every boss is weak to something — a distance, a discipline, a habit — and hitting it
                with what it hates does double damage. Which is a polite way of saying the game will
                keep asking you to do the training you have been avoiding.
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- map */}
        <section id="map">
          <div className="wrap split">
            <div className="stack reveal">
              <h2>Your city, drawn as a world map.</h2>
            </div>
            <div className="stack reveal">
              <p className="lede">
                Eighteen kilometres of Sydney, hand-drawn a hundred metres at a time: the harbour, the
                Bridge, the beaches, the bush, every suburb named. It opens under haze.
              </p>
              <p>
                Walking clears it. Track a run outdoors and the ground you actually covered lights up
                and stays lit — and zoom in far enough and the drawing gives way to the streets. It is
                the one thing in the game that only grows, and only by having been somewhere.
              </p>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------- character fold */}
        <section className="deep">
          <div className="wrap stack wide">
            <div className="split">
              <div className="stack reveal">
                <h2>Your body, as a character sheet.</h2>
                <p className="lede">
                  Five stats that only move when you do. Strength climbs from what you lift, endurance
                  from distance, vitality from sleep and steps. Nothing decorative — every number has a
                  behaviour behind it.
                </p>
                <ul className="plain-list">
                  <li>
                    <span className="tick">✓</span>
                    <span>A hundred levels and eight ranks, earned on power rather than on turning up recently.</span>
                  </li>
                  <li>
                    <span className="tick">✓</span>
                    <span>Gear you upgrade, and a companion that levels alongside you and never outgrows you.</span>
                  </li>
                  <li>
                    <span className="tick">✓</span>
                    <span>Six long-horizon milestones measured in months. None of them purchasable.</span>
                  </li>
                </ul>
              </div>
              <div className="reveal" style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="device">
                  <img
                    src="/shots/sheet.webp"
                    width="760"
                    height="1634"
                    alt="The character sheet: five stat bars — strength, endurance, agility, vitality and focus — each with a level and the activities that raise it."
                  />
                </div>
              </div>
            </div>

            <div className="shots reveal" role="group" aria-label="Screens from the prototype">
              <div className="device">
                <img
                  src="/shots/home.webp"
                  width="760"
                  height="1634"
                  alt="The home screen: level and power, a six-day streak, three daily quests and a sealed chest."
                  loading="lazy"
                />
              </div>
              <div className="device">
                <img
                  src="/shots/pets.webp"
                  width="760"
                  height="1634"
                  alt="The companion screen, showing a pet's five evolution stages from level one to a hundred."
                  loading="lazy"
                />
              </div>
              <div className="device">
                <img
                  src="/shots/guild.webp"
                  width="760"
                  height="1634"
                  alt="The community feed, where players share training routines and verified personal bests."
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------- chest */}
        <section className="deep" style={{ background: 'var(--deep-2)' }}>
          <div className="wrap split flip">
            <div className="reveal">
              <ChestOdds />
            </div>
            <div className="stack reveal">
              <h2>Every day is a real chance at something great.</h2>
              <p className="lede">
                Get your twenty minutes in and a chest unlocks. Open it and anything can come out —
                there is no tier to climb first and no bad-luck floor to grind past.
              </p>
              <p>
                The rates are fixed and published: 60% common through 1% legendary, the same on your
                first day as your five hundredth. There is no way to pay for a better roll, because
                there is no shop.
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- integrity */}
        <section>
          <div className="wrap stack wide">
            <div className="stack reveal">
              <h2>A leaderboard you can&rsquo;t type your way up.</h2>
              <p className="lede">
                Anyone can claim a 10k. So there is nowhere to claim one: there is no box to type a
                number into and no slider to drag. A workout is a session the app timed, which means the
                only way to spend XP&rsquo;s currency is to spend the hour.
              </p>
            </div>
            <div className="facts reveal">
              <div className="fact">
                <span className="n">5</span>
                <p>
                  Health services it reads from — Apple Health, Health Connect, Strava, Garmin and
                  WHOOP. If none of them recorded it, it doesn&rsquo;t score.
                </p>
              </div>
              <div className="fact">
                <span className="n">50%</span>
                <p>
                  What a manual entry pays. It still builds your character, because your training is
                  yours — it just can&rsquo;t climb past anyone.
                </p>
              </div>
              <div className="fact">
                <span className="n">0</span>
                <p>
                  Ways to buy progress. No loot boxes for sale, no premium currency, no paid rolls.
                  Coaching is a flat five pounds, and that&rsquo;s the whole shop.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- raid fold */}
        <section className="deep">
          <div className="wrap stack wide">
            <div className="split">
              <div className="reveal" style={{ display: 'flex', justifyContent: 'center' }}>
                <BossArt size={280} />
              </div>
              <div className="stack reveal">
                <h2>Everybody&rsquo;s kilometres hit the same health bar.</h2>
                <p className="lede">
                  Once a season the whole app fights one thing. The Couch Titan has{' '}
                  {BOSS.goalKm.toLocaleString()} kilometres of health, and every verified kilometre
                  anyone runs takes a piece off it.
                </p>
                <p>
                  Nobody clears it alone, which is the point — on the days you can only manage a walk,
                  that walk still lands. Miss the deadline and the last reward is gone for the season.
                </p>
                <a className="btn on-deep" href="#/app" onClick={go}>
                  Take a swing at it
                </a>
              </div>
            </div>

            <div className="stack reveal" style={{ width: '100%' }}>
              <h3>And you&rsquo;re not doing it on your own.</h3>
              <p>
                Five companions, from the pup everyone starts with to a storm lion one player in a
                hundred sees. They gain XP from your sessions, and they cannot out-level you.
              </p>
              <div className="pet-row">
                {[
                  ['pup', 20, 'Pup', 'Common'],
                  ['turbo', 40, 'Turbo', 'Uncommon'],
                  ['frost', 60, 'Frost', 'Rare'],
                  ['ember', 80, 'Ember', 'Epic'],
                  ['zeus', 100, 'Zeus', 'Legendary'],
                ].map(([ref, lv, name, tier]) => (
                  <figure className="pet-cell" key={ref}>
                    {/* Sprites scale up with evolution stage, so the frame is
                        taller than the sprite to keep the caption clear. */}
                    <span className="pet-art">
                      <PetView refId={ref} level={lv} size={84} />
                    </span>
                    <figcaption>
                      <span className="pix">{name}</span>
                      <span className="pet-tier">{tier}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ for anyone */}
        <section className="sink">
          <div className="wrap split">
            <div className="stack reveal">
              <h2>You don&rsquo;t have to play anything to use this.</h2>
            </div>
            <div className="stack reveal">
              <p className="lede">
                Half the people this is built for already train and just want their effort to add up to
                something. The other half haven&rsquo;t moved much in a while and need a reason that
                isn&rsquo;t a lecture.
              </p>
              <p>
                Both get the same app. Link a game account if you have one and it&rsquo;ll track the
                balance between your training and your play time — but nothing is locked behind it, and
                every screen explains itself without assuming you know what a ranked queue is.
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ close */}
        <section className="close-cta">
          <div className="wrap stack wide" style={{ alignItems: 'center' }}>
            <h2 className="reveal">It&rsquo;s already built. Go and poke at it.</h2>
            <p className="lede reveal" style={{ textAlign: 'center' }}>
              The whole thing runs in your browser — make a character, time a session, open a chest,
              walk some of the map clear. No sign-up, and nothing leaves your device.
            </p>
            <a className="btn reveal" href="#/app" onClick={go}>
              Try the prototype
            </a>
          </div>
        </section>
      </main>

      <footer className="site-foot">
        <div className="wrap">
          <p style={{ maxWidth: '60ch' }}>
            LVL100 is an early prototype. Everything on this page is the real thing — the screenshots
            are the running app, and the level meter above uses the same progression code the app
            does.{' '}
            <a href="#/app" onClick={go} style={{ display: 'inline-block', padding: '0.65rem 0' }}>
              Open it
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  )
}
