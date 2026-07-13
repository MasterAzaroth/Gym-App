import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import SetupBanner from './SetupBanner'

export default function AppShell() {
  return (
    <div className="min-h-full bg-chalk">
      <SetupBanner />
      <main
        className="mx-auto max-w-md px-5 pb-28"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.25rem)' }}
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
