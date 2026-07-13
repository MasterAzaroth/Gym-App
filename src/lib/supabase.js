import { createClient } from '@supabase/supabase-js'

// Strip any trailing slash — a stray one produces "Invalid path specified in
// request URL" because every call ends up hitting a double slash.
const rawUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const url = rawUrl.trim().replace(/\/+$/, '')
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

export const isConfigured = Boolean(url && anonKey)

export const supabase = isConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true }
    })
  : null
