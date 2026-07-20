import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from './BottomNav'
import SetupBanner from './SetupBanner'

export default function AppShell() {
  const { pathname } = useLocation()

  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return (
    <div className="min-h-full bg-fill">
      <SetupBanner />
      <main
        className="mx-auto max-w-md px-5"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)',
          paddingBottom: 'calc(var(--nav-h) + 1.5rem)'
        }}
      >
        <div key={pathname} className="page-enter">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
