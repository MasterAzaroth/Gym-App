import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/* iOS grammar: grouped background, white cards, generous radii, one accent,
   hairline separators, almost no borders. */

export function PageTitle({ eyebrow, children, action }) {
  return (
    <header className="mb-5 flex items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="mb-0.5 text-[13px] font-medium text-label2">{eyebrow}</p>}
        <h1 className="truncate text-[34px] font-bold leading-tight tracking-[-0.022em]">
          {children}
        </h1>
      </div>
      {action}
    </header>
  )
}

export function Card({ children, className = '', ...rest }) {
  return (
    <div className={`rounded-2xl bg-surface shadow-card ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function Section({ title, action, children }) {
  return (
    <section className="mb-6">
      {(title || action) && (
        <div className="mb-2 flex items-center justify-between px-1">
          {title && (
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-label2">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  const styles = {
    primary:   'bg-violet text-white hover:bg-violet-hover',
    secondary: 'bg-violet-soft text-violet hover:bg-violet-soft/70',
    subtle:    'bg-fill text-label hover:bg-separator',
    danger:    'bg-danger/10 text-danger hover:bg-danger/15',
    ghost:     'bg-transparent text-label2 hover:text-label'
  }[variant]

  const sizes = {
    md: 'w-full rounded-xl px-4 py-3.5 text-[17px]',
    sm: 'rounded-lg px-3.5 py-2 text-[15px]'
  }[size]

  return (
    <button
      className={`font-semibold tracking-[-0.01em] transition-all duration-150 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${sizes} ${className}`}
      {...props}
    />
  )
}

/** iOS Settings pattern: one rounded block, hairline-separated rows. */
export function Group({ children, className = '' }) {
  return (
    <div className={`divide-y divide-separator overflow-hidden rounded-2xl bg-surface shadow-card ${className}`}>
      {children}
    </div>
  )
}

export function Field({ label, suffix, ...props }) {
  return (
    <label className="flex items-center gap-3 px-4">
      <span className="w-[104px] shrink-0 py-3.5 text-[17px]">{label}</span>
      <input
        className="min-w-0 flex-1 bg-transparent py-3.5 text-[17px] placeholder:text-label3 focus:outline-none"
        {...props}
      />
      {suffix && <span className="shrink-0 text-[15px] text-label3">{suffix}</span>}
    </label>
  )
}

export function SelectField({ label, options, ...props }) {
  return (
    <label className="flex items-center gap-3 px-4">
      <span className="w-[104px] shrink-0 py-3.5 text-[17px]">{label}</span>
      <select
        className="min-w-0 flex-1 appearance-none bg-transparent py-3.5 text-right text-[17px] text-label2 focus:outline-none"
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <Chevron />
    </label>
  )
}

/** A tappable row. `value` sits right-aligned, iOS style. */
export function Row({ label, value, sub, onClick, danger, trailing }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${onClick ? 'hover:bg-fill' : ''}`}
    >
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[17px] ${danger ? 'text-danger' : ''}`}>{label}</p>
        {sub && <p className="mt-0.5 truncate text-[13px] text-label2">{sub}</p>}
      </div>
      {value && <span className="shrink-0 text-[17px] text-label2 tnum">{value}</span>}
      {trailing ?? (onClick && !danger ? <Chevron /> : null)}
    </Tag>
  )
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="mb-5 flex gap-1 rounded-xl bg-separator/60 p-1">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded-lg py-2 text-[15px] font-medium transition-all ${
              active ? 'bg-surface text-label shadow-sm' : 'text-label2'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Empty({ icon, title, body, action }) {
  return (
    <Card className="px-6 py-10 text-center">
      {icon && <div className="mx-auto mb-4 w-fit text-label3">{icon}</div>}
      <h2 className="text-[17px] font-semibold">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-[30ch] text-[15px] leading-relaxed text-label2">{body}</p>
      {action && <div className="mx-auto mt-5 max-w-[240px]">{action}</div>}
    </Card>
  )
}

export function Spinner({ label = 'Loading' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-[15px] text-label3">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-separator border-t-violet" />
      {label}
    </div>
  )
}

export function ErrorNote({ error, onRetry }) {
  if (!error) return null
  return (
    <Card className="p-4">
      <p className="text-[15px] text-danger">{error}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 text-[15px] font-medium text-violet">
          Try again
        </button>
      )}
    </Card>
  )
}

/** Bottom sheet. Slides up, dismisses on backdrop tap or Escape. */
export function Sheet({ open, onClose, title, children, footer }) {
  // iOS keeps position:fixed elements sized to the layout viewport when the
  // keyboard opens — it doesn't shrink to the visible area the way the
  // keyboard-avoiding content does. That left the top of the sheet (the
  // search field, in practice) shifted off-screen until the keyboard closed.
  // Tracking visualViewport and sizing the sheet to it keeps it matched to
  // whatever's actually visible above the keyboard.
  const [viewportHeight, setViewportHeight] = useState(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'

    const vv = window.visualViewport
    const updateHeight = () => vv && setViewportHeight(vv.height)
    updateHeight()
    vv?.addEventListener('resize', updateHeight)
    vv?.addEventListener('scroll', updateHeight)

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      vv?.removeEventListener('resize', updateHeight)
      vv?.removeEventListener('scroll', updateHeight)
      setViewportHeight(null)
    }
  }, [open, onClose])

  if (!open) return null

  // Portaled straight to <body>, outside <main>'s overflow-y-auto — iOS Safari
  // clips/contains position:fixed descendants to a scrolling ancestor instead
  // of the real screen, which left the sheet's footer sitting under the nav.
  return createPortal(
    <div
      className="fixed inset-x-0 top-0 z-50 flex flex-col justify-end"
      style={{ height: viewportHeight ? `${viewportHeight}px` : '100dvh' }}
    >
      <div
        className="backdrop-enter absolute inset-0 bg-label/30 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="sheet-enter relative mx-auto flex max-h-[88vh] w-full max-w-md flex-col rounded-t-3xl bg-fill"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        role="dialog"
        aria-modal="true"
      >
        {/* Grabber. Signals "this drags away" even though it dismisses by tap. */}
        <div className="flex justify-center pt-2.5">
          <div className="h-1 w-9 rounded-full bg-separator" />
        </div>
        <div className="flex items-center justify-between px-5 pb-2 pt-2">
          <button onClick={onClose} className="text-[17px] text-violet">Cancel</button>
          <h2 className="text-[17px] font-semibold">{title}</h2>
          <span className="w-[54px]" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {footer && <div className="border-t border-separator px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

/** A macro bar. Overshoot is shown, not hidden — going over is information. */
export function MacroBar({ label, value, goal, unit = 'g', color = '#6E56CF' }) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0
  const over = goal > 0 && value > goal
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-label2">{label}</span>
        <span className="text-[13px] tnum text-label2">
          <span className={`font-semibold ${over ? 'text-danger' : 'text-label'}`}>
            {Math.round(value)}
          </span>
          {' / '}{goal}{unit}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-separator">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, backgroundColor: over ? '#D93843' : color }}
        />
      </div>
    </div>
  )
}

export function Chevron() {
  return (
    <svg width="8" height="13" viewBox="0 0 8 13" fill="none" className="shrink-0">
      <path d="M1.5 1.5L6.5 6.5L1.5 11.5" stroke="#C7C7CC" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Stub({ note }) {
  return (
    <p className="mt-5 rounded-xl bg-violet-soft px-4 py-3 text-[13px] leading-relaxed text-violet">
      {note}
    </p>
  )
}

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
