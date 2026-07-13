/* Small shared primitives. Everything else stays quiet so the plate strip is the loud thing. */

export function PageTitle({ eyebrow, children }) {
  return (
    <header className="mb-6">
      {eyebrow && (
        <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-steel">
          {eyebrow}
        </p>
      )}
      <h1 className="font-display text-3xl uppercase leading-none tracking-tight text-iron">
        {children}
      </h1>
    </header>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl border border-iron/8 bg-paper p-4 shadow-card ${className}`}>
      {children}
    </div>
  )
}

export function Button({ variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-plate-red text-white hover:bg-plate-red/90 active:scale-[0.99]',
    dark: 'bg-iron text-chalk hover:bg-graphite active:scale-[0.99]',
    ghost: 'bg-transparent text-steel hover:text-iron'
  }[variant]

  return (
    <button
      className={`w-full rounded-lg px-4 py-3 text-sm font-semibold uppercase tracking-wide transition ${styles} disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  )
}

export function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-steel">
        {label}
      </span>
      <input
        className="w-full rounded-lg border border-iron/15 bg-paper px-3.5 py-3 text-base text-iron placeholder:text-steel/50 focus:border-iron focus:outline-none"
        {...props}
      />
    </label>
  )
}

/* An empty screen is an invitation to act. */
export function Empty({ title, body, action }) {
  return (
    <Card className="text-center">
      <h2 className="font-display text-lg uppercase tracking-tight">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-[26ch] text-sm text-steel">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </Card>
  )
}

export function Stub({ note }) {
  return (
    <p className="mt-4 border-l-2 border-plate-yellow pl-3 font-mono text-[11px] leading-relaxed text-steel">
      STUB — {note}
    </p>
  )
}
