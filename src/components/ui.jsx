/* Shared primitives. iOS grammar: soft grouped background, white cards,
   generous radii, one accent, almost no borders. */

export function PageTitle({ eyebrow, children }) {
  return (
    <header className="mb-6">
      {eyebrow && (
        <p className="mb-1 text-[13px] font-medium text-label2">{eyebrow}</p>
      )}
      <h1 className="text-[34px] font-bold leading-tight tracking-[-0.022em] text-label">
        {children}
      </h1>
    </header>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl bg-surface p-5 shadow-card ${className}`}>
      {children}
    </div>
  )
}

export function Button({ variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-violet text-white hover:bg-violet-hover active:scale-[0.985]',
    secondary: 'bg-violet-soft text-violet hover:bg-violet-soft/70 active:scale-[0.985]',
    dark: 'bg-label text-white hover:bg-label/90 active:scale-[0.985]',
    ghost: 'bg-transparent text-label2 hover:text-label'
  }[variant]

  return (
    <button
      className={`w-full rounded-xl px-4 py-3.5 text-[17px] font-semibold tracking-[-0.01em] transition-all duration-150 ${styles} disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      {...props}
    />
  )
}

/**
 * Grouped inset list — the iOS Settings pattern. Fields sit in one rounded
 * block separated by hairlines, not as individually boxed inputs.
 */
export function FieldGroup({ children }) {
  return (
    <div className="divide-y divide-separator overflow-hidden rounded-xl bg-surface">
      {children}
    </div>
  )
}

export function Field({ label, ...props }) {
  return (
    <label className="flex items-center gap-3 px-4">
      <span className="w-[76px] shrink-0 py-3.5 text-[17px] text-label">
        {label}
      </span>
      <input
        className="min-w-0 flex-1 bg-transparent py-3.5 text-[17px] text-label placeholder:text-label3 focus:outline-none"
        {...props}
      />
    </label>
  )
}

export function Empty({ title, body, action }) {
  return (
    <Card className="py-8 text-center">
      <h2 className="text-[17px] font-semibold">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-[28ch] text-[15px] leading-relaxed text-label2">
        {body}
      </p>
      {action && <div className="mx-auto mt-5 max-w-[240px]">{action}</div>}
    </Card>
  )
}

export function Stub({ note }) {
  return (
    <p className="mt-5 rounded-xl bg-violet-soft px-4 py-3 text-[13px] leading-relaxed text-violet">
      {note}
    </p>
  )
}

/** The mark. A stylised barbell — the only piece of ornament in the app. */
export function Logo({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <rect width="44" height="44" rx="11" fill="#6E56CF" />
      <rect x="9" y="21" width="26" height="2" rx="1" fill="white" fillOpacity="0.55" />
      <rect x="12" y="15" width="4" height="14" rx="2" fill="white" />
      <rect x="28" y="15" width="4" height="14" rx="2" fill="white" />
      <rect x="19" y="18.5" width="6" height="7" rx="2" fill="white" fillOpacity="0.75" />
    </svg>
  )
}
