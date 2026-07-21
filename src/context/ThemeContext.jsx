import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'ironlog.theme' // 'light' | 'dark' | 'system'

function resolve(preference) {
  if (preference === 'light' || preference === 'dark') return preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Also run inline in index.html, before React mounts, so there's no flash of
// the wrong theme on load — this just keeps things in sync after that.
function apply(resolved) {
  document.documentElement.classList.toggle('dark', resolved === 'dark')
  document.documentElement.style.colorScheme = resolved
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', resolved === 'dark' ? '#101012' : '#F2F2F7')
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || 'system' } catch { return 'system' }
  })
  const [resolved, setResolved] = useState(() => resolve(preference))

  useEffect(() => {
    const next = resolve(preference)
    setResolved(next)
    apply(next)
    try { localStorage.setItem(STORAGE_KEY, preference) } catch {}
  }, [preference])

  // Only matters while "system" is selected — otherwise the OS can change
  // its mind without it affecting an explicit choice.
  useEffect(() => {
    if (preference !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => { const next = resolve('system'); setResolved(next); apply(next) }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [preference])

  const setTheme = useCallback((next) => setPreference(next), [])

  return (
    <ThemeContext.Provider value={{ preference, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
