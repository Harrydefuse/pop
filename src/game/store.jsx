import { useEffect, useMemo, useReducer, useRef } from 'react'
import { GameContext } from './context'
import { BOSS, CATALOG, INITIAL_STATE, freshDailies } from './data'
import { DAILY_SLOTS, RARITY } from './config'
import { bestLoadout, grantPetXp, grantXp, minutesOf, resolveActivity, rollChest, stoneProgress } from './engine'

const SAVE_KEY = 'lvl100.save.v3' // v3: three fixed daily slots

let uid = 0
const nextId = (p) => `${p}${Date.now().toString(36)}${(uid++).toString(36)}`

function baseState() {
  return {
    ...structuredClone(INITIAL_STATE),
    world: { bossKm: BOSS.startKm },
    liked: [],
    purchased: [],
    lastReward: null,
  }
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return baseState()
    const parsed = JSON.parse(raw)
    // Shallow-merge onto a fresh base so new fields appear for old saves.
    return { ...baseState(), ...parsed, player: { ...baseState().player, ...parsed.player } }
  } catch {
    return baseState()
  }
}

function toast(state, t) {
  return { ...state, toasts: [...state.toasts, { id: nextId('t'), ...t }] }
}

/**
 * Credits a logged activity to whichever slot accepts it. Everything is
 * measured in minutes so one slot can hold one honest minimum regardless of
 * whether it was filled by a walk, a run or a ride.
 */
function bumpDailies(dailies, act, amount) {
  const mins = minutesOf(act, amount)
  return dailies.map((d) => {
    const slot = DAILY_SLOTS.find((s) => s.id === d.id)
    if (!slot || !slot.accepts.includes(act.id)) return d
    const minutes = Math.round((d.minutes + mins) * 10) / 10
    return {
      ...d,
      minutes,
      done: d.done || minutes >= slot.minMinutes,
      loggedAs: d.loggedAs ?? act.name,
    }
  })
}

function applyLog(state, { activityId, amount, verified, source }) {
  const player = state.player
  const result = resolveActivity(player, { activityId, amount, verified })
  const act = result.activity

  // XP + levels
  const { level, xp, levelsGained } = grantXp(player.level, player.xp, result.xp)

  // Stats
  const stats = { ...player.stats }
  for (const [k, v] of Object.entries(result.statGains)) stats[k] = (stats[k] ?? 0) + v

  // Lifetime counters feed the stones
  const lifetime = { ...player.lifetime }
  if (act.id === 'lift') lifetime.volume += amount
  if (act.id === 'run' || act.id === 'ride') lifetime.distance += amount
  if (verified) lifetime.sessions += 1
  lifetime.bossKm = Math.round((lifetime.bossKm + result.bossDamage) * 10) / 10

  // Pet rides along on your sessions
  let pets = player.pets
  let petLeveled = null
  if (player.activePetId) {
    pets = player.pets.map((p) => {
      if (p.id !== player.activePetId) return p
      const grown = grantPetXp(p, level, Math.round(result.xp * 0.4))
      if (grown.leveled) petLeveled = grown
      const { leveled: _ignored, ...rest } = grown
      return rest
    })
  }

  const week = {
    ...player.week,
    activeMinutes: player.week.activeMinutes + (act.unit === 'min' ? amount : act.id === 'run' ? amount * 6 : 25),
    km: Math.round((player.week.km + (act.id === 'run' || act.id === 'ride' ? amount : 0)) * 10) / 10,
    sessions: player.week.sessions + 1,
  }

  let next = {
    ...state,
    player: {
      ...player,
      level,
      xp,
      stats,
      lifetime,
      pets,
      week,
      cores: player.cores + result.cores,
    },
    dailies: bumpDailies(state.dailies, act, amount),
    world: { ...state.world, bossKm: state.world.bossKm + result.bossDamage },
    log: [
      {
        id: nextId('l'),
        activityId,
        amount,
        verified,
        at: Date.now(),
        xp: result.xp,
        source: source ?? (verified ? 'Health app' : 'Manual'),
      },
      ...state.log,
    ].slice(0, 40),
  }

  next = toast(next, {
    kind: 'xp',
    title: `+${result.xp} XP`,
    body: `${act.name} · ${amount}${act.unit === 'kg volume' ? ' kg' : ` ${act.unit}`}${verified ? '' : ' · unverified, half rate'}`,
    stats: result.statGains,
  })
  for (const lv of levelsGained) {
    next = toast(next, { kind: 'level', title: `LEVEL ${lv}`, body: 'New level reached. Power recalculated.' })
  }
  if (petLeveled) {
    next = toast(next, { kind: 'pet', title: `${petLeveled.name} → LV ${petLeveled.level}`, body: 'Your pet levelled up' })
  }

  // The MOVE slot is the gate: move today and the chest gains a day. The other
  // two pay XP but are not a toll on the reward loop.
  const moveDone = next.dailies.find((d) => d.id === 'move')?.done
  if (moveDone && !next.chest.fedToday) {
    const sealedDays = Math.min(7, next.chest.sealedDays + 1)
    next = { ...next, chest: { ...next.chest, sealedDays, fedToday: true } }
    next = toast(next, {
      kind: 'chest',
      title: 'CHEST SEALED',
      body: `Day ${sealedDays}. Leave it shut and it climbs a tier.`,
    })
  }

  const allDone = next.dailies.every((d) => d.done)
  if (allDone && !next.perfectToday) {
    next = { ...next, perfectToday: true, player: { ...next.player, cores: next.player.cores + 250 } }
    next = toast(next, { kind: 'level', title: 'ALL THREE DONE', body: '+250 cores for a full day' })
  }

  // Stones are checked last so a single session can complete one
  const earned = stoneProgress(next.player).filter((s) => s.pct >= 1 && !s.earned)
  if (earned.length) {
    next = {
      ...next,
      player: { ...next.player, stones: [...next.player.stones, ...earned.map((s) => s.key)] },
    }
    for (const s of earned) {
      next = toast(next, { kind: 'stone', title: `${s.name} STONE`, body: s.reward, color: s.color })
    }
  }
  return next
}

/** Fabricates the kind of payload a real health provider would push over. */
function syntheticSync(links) {
  const pool = [
    { activityId: 'run', amount: +(3 + Math.random() * 6).toFixed(1) },
    { activityId: 'lift', amount: Math.round((3 + Math.random() * 4) * 1000) },
    { activityId: 'hiit', amount: 10 + Math.round(Math.random() * 4) * 5 },
    { activityId: 'walk', amount: 15 + Math.round(Math.random() * 6) * 5 },
    { activityId: 'sleep', amount: +(6 + Math.random() * 2.5).toFixed(1) },
    { activityId: 'mobility', amount: 10 + Math.round(Math.random() * 4) * 5 },
    { activityId: 'ride', amount: Math.round(8 + Math.random() * 24) },
  ]
  const source = links.length ? links[Math.floor(Math.random() * links.length)] : 'Health app'
  const count = 1 + Math.floor(Math.random() * 2)
  const picks = []
  for (let i = 0; i < count; i++) {
    const p = pool[Math.floor(Math.random() * pool.length)]
    if (!picks.some((x) => x.activityId === p.activityId)) picks.push({ ...p, verified: true, source })
  }
  return picks
}

function reducer(state, action) {
  switch (action.type) {
    case 'onboard': {
      const { name, handle, classId, avatar, health, games } = action
      return toast(
        {
          ...state,
          onboarded: true,
          player: { ...state.player, name, handle, classId, avatar: { ...state.player.avatar, ...avatar } },
          links: { health, games },
        },
        { kind: 'level', title: `WELCOME, ${name.toUpperCase()}`, body: 'Character created. Go earn something.' },
      )
    }

    case 'log':
      return applyLog(state, action)

    case 'sync': {
      const picks = syntheticSync(state.links.health)
      if (!picks.length) return state
      let next = state
      for (const p of picks) next = applyLog(next, p)
      return next
    }

    case 'openChest': {
      const days = Math.max(1, state.chest.sealedDays)
      const result = rollChest(days, CATALOG)
      let next = { ...state, player: { ...state.player, cores: state.player.cores + result.cores } }

      const inventory = [...next.player.inventory]
      const pets = [...next.player.pets]
      for (const d of result.drops) {
        if (d.kind === 'gear') {
          const base = CATALOG.gear.find((g) => g.id === d.ref)
          inventory.push({
            id: nextId('i'),
            ref: base.id,
            name: base.name,
            slot: base.slot,
            rarity: d.rarity,
            level: 1,
            stats: base.stats,
          })
        } else {
          const base = CATALOG.pets.find((p) => p.id === d.ref)
          const owned = pets.find((p) => p.ref === base.id)
          if (owned) {
            // Duplicate pets convert to cores rather than clutter the roster.
            next = { ...next, player: { ...next.player, cores: next.player.cores + 300 } }
            d.duplicate = true
          } else {
            pets.push({
              id: nextId('p_'),
              ref: base.id,
              name: base.name,
              rarity: base.rarity,
              stat: base.stat,
              level: 1,
              xp: 0,
            })
          }
        }
      }

      next = {
        ...next,
        player: { ...next.player, inventory, pets },
        chest: { sealedDays: 0, fedToday: false, lastOpened: Date.now() },
        lastReward: result,
      }
      return next
    }

    case 'dismissReward':
      return { ...state, lastReward: null }

    case 'equip': {
      const item = state.player.inventory.find((i) => i.id === action.itemId)
      if (!item) return state
      return {
        ...state,
        player: { ...state.player, equipped: { ...state.player.equipped, [item.slot]: item.id } },
      }
    }

    case 'equipBest': {
      const equipped = { ...state.player.equipped, ...bestLoadout(state.player.inventory) }
      return toast(
        { ...state, player: { ...state.player, equipped } },
        { kind: 'gear', title: 'BEST GEAR ON', body: 'Highest-scoring item in every slot' },
      )
    }

    case 'unequip':
      return {
        ...state,
        player: { ...state.player, equipped: { ...state.player.equipped, [action.slot]: null } },
      }

    case 'upgrade': {
      const item = state.player.inventory.find((i) => i.id === action.itemId)
      if (!item || state.player.cores < action.cost) return state
      return toast(
        {
          ...state,
          player: {
            ...state.player,
            cores: state.player.cores - action.cost,
            inventory: state.player.inventory.map((i) => (i.id === item.id ? { ...i, level: i.level + 1 } : i)),
          },
        },
        {
          kind: 'gear',
          title: `${item.name} → LV ${item.level + 1}`,
          body: `${RARITY[item.rarity].label} upgraded`,
          color: RARITY[item.rarity].color,
        },
      )
    }

    case 'setPet':
      return { ...state, player: { ...state.player, activePetId: action.petId } }

    case 'toggleHealth': {
      const has = state.links.health.includes(action.id)
      const health = has ? state.links.health.filter((h) => h !== action.id) : [...state.links.health, action.id]
      return { ...state, links: { ...state.links, health } }
    }

    case 'toggleGame': {
      const has = state.links.games.includes(action.id)
      const games = has ? state.links.games.filter((g) => g !== action.id) : [...state.links.games, action.id]
      return { ...state, links: { ...state.links, games } }
    }

    case 'post': {
      const post = {
        id: nextId('p'),
        channel: action.channel,
        author: {
          id: 'me',
          name: state.player.name,
          handle: state.player.handle,
          level: state.player.level,
          avatar: state.player.avatar,
          classId: state.player.classId,
        },
        at: Date.now(),
        body: action.body,
        tags: action.tags,
        likes: 0,
        replies: 0,
        mine: true,
      }
      return { ...state, feed: [post, ...state.feed] }
    }

    case 'like': {
      const liked = state.liked.includes(action.postId)
      return {
        ...state,
        liked: liked ? state.liked.filter((p) => p !== action.postId) : [...state.liked, action.postId],
        feed: state.feed.map((p) => (p.id === action.postId ? { ...p, likes: p.likes + (liked ? -1 : 1) } : p)),
      }
    }

    case 'buyCoaching':
      if (state.purchased.includes(action.id)) return state
      return toast(
        { ...state, purchased: [...state.purchased, action.id] },
        { kind: 'gear', title: 'SESSION UNLOCKED', body: `${action.name} · lifetime access` },
      )

    case 'bossTick':
      return { ...state, world: { ...state.world, bossKm: state.world.bossKm + action.km } }

    case 'dismissToast':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }

    case 'newDay':
      return {
        ...state,
        dailies: freshDailies(),
        perfectToday: false,
        chest: { ...state.chest, fedToday: false },
        player: { ...state.player, streak: state.player.streak + 1 },
      }

    case 'reset':
      return baseState()

    default:
      return state
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, load)
  const saveRef = useRef(0)

  // Persist, but not on every keystroke-fast dispatch.
  useEffect(() => {
    clearTimeout(saveRef.current)
    saveRef.current = setTimeout(() => {
      try {
        const { toasts: _t, lastReward: _r, ...persist } = state
        localStorage.setItem(SAVE_KEY, JSON.stringify(persist))
      } catch {
        /* storage full or blocked — the session still works, it just won't persist */
      }
    }, 400)
    return () => clearTimeout(saveRef.current)
  }, [state])

  // The world boss is a live event: other players keep chipping at it.
  useEffect(() => {
    const t = setInterval(() => dispatch({ type: 'bossTick', km: 40 + Math.random() * 180 }), 3200)
    return () => clearInterval(t)
  }, [])

  const api = useMemo(
    () => ({
      log: (payload) => dispatch({ type: 'log', ...payload }),
      sync: () => dispatch({ type: 'sync' }),
      openChest: () => dispatch({ type: 'openChest' }),
      dismissReward: () => dispatch({ type: 'dismissReward' }),
      equip: (itemId) => dispatch({ type: 'equip', itemId }),
      equipBest: () => dispatch({ type: 'equipBest' }),
      unequip: (slot) => dispatch({ type: 'unequip', slot }),
      upgrade: (itemId, cost) => dispatch({ type: 'upgrade', itemId, cost }),
      setPet: (petId) => dispatch({ type: 'setPet', petId }),
      toggleHealth: (id) => dispatch({ type: 'toggleHealth', id }),
      toggleGame: (id) => dispatch({ type: 'toggleGame', id }),
      post: (payload) => dispatch({ type: 'post', ...payload }),
      like: (postId) => dispatch({ type: 'like', postId }),
      buyCoaching: (id, name) => dispatch({ type: 'buyCoaching', id, name }),
      onboard: (payload) => dispatch({ type: 'onboard', ...payload }),
      dismissToast: (id) => dispatch({ type: 'dismissToast', id }),
      newDay: () => dispatch({ type: 'newDay' }),
      reset: () => dispatch({ type: 'reset' }),
    }),
    [],
  )

  const value = useMemo(() => ({ state, ...api }), [state, api])
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
