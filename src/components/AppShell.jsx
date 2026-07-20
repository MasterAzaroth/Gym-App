import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from './BottomNav'
import SetupBanner from './SetupBanner'

export default function AppShell() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-full bg-fill">
      <SetupBanner />
      <main
        className="mx-auto max-w-md px-5"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)',
          // Derived from the bar's real height, so nothing hides behind it.
          paddingBottom: 'calc(var(--nav-h) + 1.5rem)'
        }}
      >
        {/* Keying on the path remounts the subtree each navigation, which
            restarts the entrance animation. */}
        <div key={pathname} className="page-enter">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
