import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppShell from './components/AppShell'
import Auth from './pages/Auth'
import Insights from './pages/Insights'
import Learn from './pages/Learn'
import Training from './pages/Training'
import RoutineBuilder from './pages/RoutineBuilder'
import WorkoutDetail from './pages/WorkoutDetail'
import Nutrition from './pages/Nutrition'
import Profile from './pages/Profile'

/* Without this, switching tabs keeps the old scroll offset and you land
   halfway down a page you've never seen. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  const { user, loading, isConfigured } = useAuth()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-fill">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-separator border-t-violet" />
      </div>
    )
  }

  const signedIn = user || !isConfigured

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/signin" element={signedIn ? <Navigate to="/" replace /> : <Auth />} />
        <Route element={signedIn ? <AppShell /> : <Navigate to="/signin" replace />}>
          <Route index element={<Insights />} />
          <Route path="learn" element={<Learn />} />
          <Route path="train" element={<Training />} />
          <Route path="train/routine/:id" element={<RoutineBuilder />} />
          <Route path="train/workout/:id" element={<WorkoutDetail />} />
          <Route path="nutrition" element={<Nutrition />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
