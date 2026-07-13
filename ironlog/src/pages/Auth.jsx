import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button, Field } from '../components/ui'
import PlateStrip from '../components/PlateStrip'

export default function Auth() {
  const { signIn, signUp, isConfigured } = useAuth()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit() {
    if (!isConfigured) {
      setStatus('Add your Supabase keys in .env.local first.')
      return
    }
    setBusy(true)
    setStatus(null)
    const fn = mode === 'signin' ? signIn : signUp
    const { error } = await fn(email, password)
    setBusy(false)
    if (error) setStatus(error.message)
    else if (mode === 'signup') setStatus('Account created. Check your email if confirmation is on.')
  }

  return (
    <div
      className="flex min-h-full flex-col justify-center bg-iron px-6"
      style={{ paddingTop: 'env(safe-area-inset-top,0px)', paddingBottom: 'env(safe-area-inset-bottom,0px)' }}
    >
      <div className="mx-auto w-full max-w-sm">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-plate-yellow">
          Hypertrophy, logged
        </p>
        <h1 className="mt-2 font-display text-5xl uppercase leading-[0.9] tracking-tight text-chalk">
          Iron<br />log
        </h1>

        <div className="mt-6 rounded-lg bg-graphite/60 p-3">
          <PlateStrip weightKg={100} />
        </div>

        <div className="mt-8 space-y-4 rounded-xl bg-paper p-5">
          <Field
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />

          {status && (
            <p className="font-mono text-xs leading-relaxed text-plate-red">{status}</p>
          )}

          <Button onClick={handleSubmit} disabled={busy || !email || !password}>
            {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>

          <button
            type="button"
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setStatus(null) }}
            className="w-full text-center text-xs font-medium text-steel underline underline-offset-4"
          >
            {mode === 'signin'
              ? 'No account yet? Create one'
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
