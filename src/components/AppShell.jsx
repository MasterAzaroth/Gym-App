import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from './BottomNav'
import SetupBanner from './SetupBanner'

export default function AppShell() {
  const { pathname } = useLocation()
  const scroller = useRef(null)

  // Scroll lives on <main>, not the document, so reset that element.
  useEffect(() => { scroller.current?.scrollTo(0, 0) }, [pathname])

  return (
    <div className="app-shell flex flex-col bg-fill">
      <SetupBanner />

      <main
        ref={scroller}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div
          className="mx-auto max-w-md px-5 pb-6"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)' }}
        >
          <div key={pathname} className="page-enter">
            <Outlet />
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
