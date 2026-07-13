import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppShell from './components/AppShell'
import Auth from './pages/Auth'
import Today from './pages/Today'
import Train from './pages/Train'
import Learn from './pages/Learn'
import Progress from './pages/Progress'
import You from './pages/You'

export default function App() {
  const { user, loading, isConfigured } = useAuth()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-iron">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-steel">Loading</p>
      </div>
    )
  }

  // Without keys there's no auth to do — go straight in so you can browse the shell.
  const signedIn = user || !isConfigured

  return (
    <Routes>
      <Route path="/signin" element={signedIn ? <Navigate to="/" replace /> : <Auth />} />
      <Route element={signedIn ? <AppShell /> : <Navigate to="/signin" replace />}>
        <Route index element={<Today />} />
        <Route path="train" element={<Train />} />
        <Route path="learn" element={<Learn />} />
        <Route path="progress" element={<Progress />} />
        <Route path="you" element={<You />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
