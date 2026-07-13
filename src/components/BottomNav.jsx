import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Today', end: true, icon: IconToday },
  { to: '/train', label: 'Train', icon: IconTrain },
  { to: '/learn', label: 'Learn', icon: IconLearn },
  { to: '/progress', label: 'Progress', icon: IconProgress },
  { to: '/you', label: 'You', icon: IconYou }
]

export default function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-iron/10 bg-paper/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Main"
    >
      <ul className="mx-auto flex max-w-md">
        {TABS.map(({ to, label, end, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold uppercase tracking-wide transition-colors',
                  isActive ? 'text-plate-red' : 'text-steel hover:text-iron'
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon active={isActive} />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/* Icons are inline SVG so there's no icon-library dependency to keep in sync. */
const base = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

function IconToday() {
  return (
    <svg {...base} stroke="currentColor"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/></svg>
  )
}
function IconTrain() {
  // A barbell — the app's own vernacular
  return (
    <svg {...base} stroke="currentColor"><path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/></svg>
  )
}
function IconLearn() {
  return (
    <svg {...base} stroke="currentColor"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/></svg>
  )
}
function IconProgress() {
  return (
    <svg {...base} stroke="currentColor"><path d="M4 19V5M4 19h16"/><path d="M8 15l3.5-4.5L15 14l4-6"/></svg>
  )
}
function IconYou() {
  return (
    <svg {...base} stroke="currentColor"><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>
  )
}
