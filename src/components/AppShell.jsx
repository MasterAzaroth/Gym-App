import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import BottomNav from './BottomNav'
import SetupBanner from './SetupBanner'
import { useAuth } from '../context/AuthContext'
import { getActiveWorkout } from '../lib/db'
import { isConfigured } from '../lib/supabase'
import { usePeekRestTimer, formatClock, useElapsedSeconds } from '../lib/restTimer'

// Routes that take over the whole screen — no tab bar, no setup banner. A
// live workout session is meant to read like MacroFactor's logging screens,
// not like another tab of the app.
const IMMERSIVE_PREFIXES = ['/train/session/']

export default function AppShell() {
  const { pathname } = useLocation()
  const scroller = useRef(null)
  const immersive = IMMERSIVE_PREFIXES.some((p) => pathname.startsWith(p))

  // Scroll lives on <main>, not the document, so reset that element.
  useEffect(() => { scroller.current?.scrollTo(0, 0) }, [pathname])

  return (
    <div className="app-shell flex flex-col bg-fill">
      {!immersive && <SetupBanner />}
      {!immersive && <ResumeWorkoutBar />}

      <main
        ref={scroller}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div
          className="mx-auto max-w-md px-5"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)',
            // Nav normally absorbs the home-indicator inset at the bottom —
            // without it, the page has to claim that space itself.
            paddingBottom: immersive
              ? 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)'
              : '1.5rem'
          }}
        >
          <div key={pathname} className="page-enter">
            <Outlet />
          </div>
        </div>
      </main>

      {!immersive && <BottomNav />}
    </div>
  )
}

/** A workout stays "active" (unfinished) until it's finished or cancelled,
    regardless of what page you wander off to — so this is pinned above the
    scrollable content on every non-immersive route, not just Training,
    to make it just as easy to jump back in from anywhere. */
function ResumeWorkoutBar() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [active, setActive] = useState(null)
  const restPeek = usePeekRestTimer()
  const elapsedSeconds = useElapsedSeconds(active?.started_at)

  useEffect(() => {
    if (!user?.id) { setActive(null); return }
    let cancelled = false
    getActiveWorkout(user.id)
      .then((w) => { if (!cancelled) setActive(w) })
      .catch(() => {})
    return () => { cancelled = true }
    // Re-checked on every navigation — cheapest way to notice a workout
    // was just started, finished, or cancelled from wherever that happened.
  }, [user?.id, pathname])

  if (!active) return null

  return (
    <button
      onClick={() => navigate(`/train/session/${active.id}`)}
      className="flex w-full shrink-0 items-center gap-3 bg-violet px-5 py-2.5 text-left text-white"
      style={!isConfigured ? undefined : { paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.625rem)' }}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
        <Play size={14} fill="white" strokeWidth={0} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold leading-tight">
          {active.name ?? active.routine?.name ?? 'Workout in progress'}
        </span>
        <span className="block text-[11px] leading-tight text-white/80 tnum">
          {restPeek.active && restPeek.workoutId === active.id
            ? `Resting · ${formatClock(restPeek.remaining)}`
            : formatClock(elapsedSeconds)}
        </span>
      </span>
      <span className="shrink-0 text-[13px] font-semibold">Resume</span>
    </button>
  )
}
