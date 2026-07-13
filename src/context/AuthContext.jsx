import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!session?.user || !isConfigured) return setProfile(null)
    const { data } = await supabase
      .from('profiles').select('*').eq('id', session.user.id).maybeSingle()
    setProfile(data)
  }, [session?.user?.id])

  useEffect(() => { refreshProfile() }, [refreshProfile])

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    tier: profile?.tier ?? 'free',
    loading,
    isConfigured,
    refreshProfile,
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut()
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
