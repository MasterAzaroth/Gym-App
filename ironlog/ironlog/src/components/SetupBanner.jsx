import { isConfigured } from '../lib/supabase'

// Empty states are direction, not mood: say what's missing and how to fix it.
export default function SetupBanner() {
  if (isConfigured) return null
  return (
    <div
      className="bg-plate-red px-5 py-2 text-center text-xs font-semibold text-white"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)' }}
    >
      Demo mode — add your Supabase keys to save anything.
    </div>
  )
}
