import { useEffect, useRef, useState } from 'react'

/**
 * The rest timer is persisted to localStorage, not just held in a component's
 * state — leaving the workout screen (the nav bar's X, or backgrounding the
 * app) must not stop the clock. Anything that knows the workout id can ask
 * for a live countdown, which is how the Training tab's "Resume workout"
 * banner shows the same running timer without being inside the session.
 */
const KEY = 'ironlog.rest_timer'

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function write(state) {
  try {
    if (state) localStorage.setItem(KEY, JSON.stringify(state))
    else localStorage.removeItem(KEY)
  } catch {
    // Storage unavailable (private mode, etc.) — the timer just won't survive navigation.
  }
}

/** Full control — start/stop/extend — scoped to one workout. */
export function useRestTimer(workoutId) {
  const [stored, setStored] = useState(() => read())
  const [now, setNow] = useState(Date.now())
  const firedRef = useRef(false)

  const endAt = stored?.workoutId === workoutId ? stored.endAt : null

  useEffect(() => {
    if (!endAt) return
    firedRef.current = false
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [endAt])

  const remaining = endAt ? Math.max(0, Math.ceil((endAt - now) / 1000)) : 0

  useEffect(() => {
    if (endAt && remaining === 0 && !firedRef.current) {
      firedRef.current = true
      navigator.vibrate?.(200)
    }
  }, [remaining, endAt])

  return {
    active: Boolean(endAt),
    remaining,
    start: (seconds) => {
      const next = { workoutId, endAt: Date.now() + seconds * 1000 }
      write(next)
      setStored(next)
    },
    stop: () => {
      write(null)
      setStored(null)
    },
    addTime: (delta) => {
      setStored((s) => {
        if (!s || s.workoutId !== workoutId) return s
        const next = { ...s, endAt: s.endAt + delta * 1000 }
        write(next)
        return next
      })
    }
  }
}

/** Read-only — for showing a live countdown outside the session screen,
    without knowing in advance which workout it belongs to. */
export function usePeekRestTimer() {
  const [stored, setStored] = useState(() => read())
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => {
      setStored(read())
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const remaining = stored ? Math.max(0, Math.ceil((stored.endAt - now) / 1000)) : 0
  return { active: Boolean(stored) && remaining > 0, remaining, workoutId: stored?.workoutId ?? null }
}

export function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
