import { isConfigured } from '../lib/supabase'

export default function SetupBanner() {
  if (isConfigured) return null
  return (
    <div
      className="bg-danger px-5 py-2 text-center text-[13px] font-medium text-white"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)' }}
    >
      Demo mode — add your Supabase keys to save anything.
    </div>
  )
}
