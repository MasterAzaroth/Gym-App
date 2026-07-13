import { createClient } from '@supabase/supabase-js'

/**
 * Supabase wants the bare project origin — https://xxxx.supabase.co — and appends
 * its own paths (/auth/v1/..., /rest/v1/...). Pasting the "Data API" URL instead,
 * which already ends in /rest/v1, produces 404s on every auth call. So we reduce
 * whatever is given to just the origin.
 */
function toOrigin(value) {
  const raw = (value ?? '').trim()
  if (!raw) return ''
  try {
    return new URL(raw).origin          // drops any path, query, or trailing slash
  } catch {
    return raw.replace(/\/+$/, '')      // not a parseable URL — do what we can
  }
}

const url = toOrigin(import.meta.env.VITE_SUPABASE_URL)
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

export const isConfigured = Boolean(url && anonKey)

if (import.meta.env.DEV && isConfigured) {
  console.info('[supabase] using', url)
}

export const supabase = isConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true }
    })
  : null
