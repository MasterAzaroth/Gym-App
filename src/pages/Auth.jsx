import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button, Field, FieldGroup, Logo } from '../components/ui'

export default function Auth() {
  const { signIn, signUp, isConfigured } = useAuth()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState(false)

  const isSignIn = mode === 'signin'
  const canSubmit = email.includes('@') && password.length >= 6 && !busy

  async function handleSubmit() {
    if (!isConfigured) {
      setError('Supabase keys are missing. Add them and redeploy.')
      return
    }
    setBusy(true)
    setError(null)
    setNotice(null)

    const { error: err } = isSignIn
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password)

    setBusy(false)

    // Errors say what happened and what to do. They don't apologise.
    if (err) {
      setError(humanise(err.message))
      return
    }
    if (!isSignIn) {
      setNotice('Account created. You can sign in now.')
    }
  }

  function switchMode() {
    setMode(isSignIn ? 'signup' : 'signin')
    setError(null)
    setNotice(null)
  }

  return (
    <div
      className="flex min-h-full flex-col bg-fill px-6"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 3.5rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)'
      }}
    >
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 w-fit">
              <Logo size={56} />
            </div>
            <h1 className="text-[28px] font-bold tracking-[-0.02em] text-label">
              {isSignIn ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="mx-auto mt-2 max-w-[30ch] text-[15px] leading-relaxed text-label2">
              {isSignIn
                ? 'Sign in to pick up where your last session left off.'
                : 'Track every set, follow the lessons, and watch the numbers move.'}
            </p>
          </div>

          <FieldGroup>
            <Field
              label="Email"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Field
              label="Password"
              type="password"
              autoComplete={isSignIn ? 'current-password' : 'new-password'}
              placeholder={isSignIn ? 'Your password' : '6 characters or more'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleSubmit()}
            />
          </FieldGroup>

          {error && (
            <p className="mt-3 px-1 text-[13px] leading-relaxed text-danger">{error}</p>
          )}
          {notice && (
            <p className="mt-3 px-1 text-[13px] leading-relaxed text-violet">{notice}</p>
          )}

          <div className="mt-5">
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {busy ? 'One moment…' : isSignIn ? 'Sign in' : 'Create account'}
            </Button>
          </div>

          <button
            type="button"
            onClick={switchMode}
            className="mt-5 w-full text-center text-[15px] font-medium text-violet"
          >
            {isSignIn ? 'Create an account' : 'I already have an account'}
          </button>
        </div>

        <p className="mt-10 text-center text-[13px] text-label3">
          By continuing you agree to the terms and privacy policy.
        </p>
      </div>
    </div>
  )
}

/* Supabase's raw messages are written for developers. Rewrite them for lifters. */
function humanise(message = '') {
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return 'That email and password don’t match. Try again.'
  if (m.includes('already registered')) return 'That email already has an account. Sign in instead.'
  if (m.includes('password')) return 'Passwords need at least 6 characters.'
  if (m.includes('invalid path') || m.includes('failed to fetch')) {
    return 'Can’t reach the server. VITE_SUPABASE_URL must be just https://your-project.supabase.co — no path after it.'
  }
  return message
}
