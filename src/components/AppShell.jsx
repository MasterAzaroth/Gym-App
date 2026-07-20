import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from './BottomNav'
import SetupBanner from './SetupBanner'

/**
 * The shell is a flex column pinned to the dynamic viewport height, with the
 * scroll living INSIDE <main> rather than on the document.
 *
 * The tab bar used to be position:fixed over a height:100% document. That works
 * until it doesn't — iOS resolves fixed elements against a viewport that shifts
 * with its own chrome, so the bar landed in a different place depending on
 * whether the page's content overflowed. Making the bar an ordinary flex child
 * removes the guesswork: it's the last row of a full-height column, so it is
 * always exactly at the bottom.
 */
export default function AppShell() {
  const { pathname } = useLocation()
  const scroller = useRef(null)

  // Scroll lives on <main> now, so resetting it means resetting that element.
  useEffect(() => {
    scroller.current?.scrollTo(0, 0)
  }, [pathname])

  return (
    <div
      className="flex flex-col overflow-hidden bg-fill"
      style={{ height: '100dvh' }}   // falls back to the CSS rule below on older iOS
    >
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
