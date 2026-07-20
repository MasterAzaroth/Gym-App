import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from './BottomNav'
import SetupBanner from './SetupBanner'

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
