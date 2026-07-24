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
  // A tick counter just forces a re-render every 250ms — the countdown
  // itself is always computed from a fresh Date.now() below, never from a
  // timestamp cached in state. Reading "now" from state meant that right
  // after start()/reset() set a brand new endAt, remaining was computed
  // against whatever stale "now" the last interval tick had left behind
  // (up to 250ms old), which rounds up to one extra second — reset looked
  // like it added a second instead of restoring the exact duration.
  const [, tick] = useState(0)
  const firedRef = useRef(false)

  // Kept around even after the rest ends, is skipped, or is wound down by
  // -15s — Reset needs `duration` to restore the last rest length, and
  // should never grey out again once a rest has run at all this workout.
  const record = stored?.workoutId === workoutId ? stored : null
  const endAt = record?.endAt ?? null

  useEffect(() => {
    if (!endAt) return
    firedRef.current = false
    const id = setInterval(() => {
      tick((n) => n + 1)
      // Self-terminating: once the rest has actually elapsed there's
      // nothing left to count down, so stop polling every 250ms for the
      // remainder of the workout instead of ticking forever.
      if (Date.now() >= endAt) clearInterval(id)
    }, 250)
    return () => clearInterval(id)
  }, [endAt])

  const remaining = endAt ? Math.max(0, Math.ceil((endAt - Date.now()) / 1000)) : 0
  const running = remaining > 0

  useEffect(() => {
    if (endAt && remaining === 0 && !firedRef.current) {
      firedRef.current = true
      navigator.vibrate?.(200)
    }
  }, [remaining, endAt])

  return {
    // True only while actually counting down — drives -15s/Skip.
    running,
    // True once a rest has ever been started for this workout, even after
    // it finishes or is skipped — drives Reset.
    started: Boolean(record),
    remaining,
    start: (seconds) => {
      const next = { workoutId, endAt: Date.now() + seconds * 1000, duration: seconds }
      write(next)
      setStored(next)
    },
    stop: () => {
      setStored((s) => {
        if (!s || s.workoutId !== workoutId) return s
        const next = { ...s, endAt: Date.now() }
        write(next)
        return next
      })
    },
    // Positive deltas also work with no timer running yet — the button
    // doubles as "start a rest" when tapped from idle, which is how the
    // rest bar stays usable before the first set of the workout is logged.
    addTime: (delta) => {
      setStored((s) => {
        if (!s || s.workoutId !== workoutId) {
          if (delta <= 0) return s
          const next = { workoutId, endAt: Date.now() + delta * 1000, duration: delta }
          write(next)
          return next
        }
        const remainingMs = Math.max(0, s.endAt - Date.now() + delta * 1000)
        const next = { ...s, endAt: Date.now() + remainingMs }
        write(next)
        return next
      })
    },
    // Back to the full length of the current rest, undoing any +/-15s taps.
    reset: () => {
      setStored((s) => {
        if (!s || s.workoutId !== workoutId) return s
        const next = { ...s, endAt: Date.now() + (s.duration ?? 0) * 1000 }
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

  useEffect(() => {
    const id = setInterval(() => setStored(read()), 1000)
    return () => clearInterval(id)
  }, [])

  const remaining = stored ? Math.max(0, Math.ceil((stored.endAt - Date.now()) / 1000)) : 0
  return { active: Boolean(stored) && remaining > 0, remaining, workoutId: stored?.workoutId ?? null }
}

export function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Live seconds-since-start, ticking every second — the workout duration
    clock, both inside the session and on the "Resume" card outside it. */
export function useElapsedSeconds(since) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!since) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [since])

  if (!since) return 0
  return Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000))
}
