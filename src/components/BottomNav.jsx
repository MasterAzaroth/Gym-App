import { NavLink } from 'react-router-dom'

/* Left to right: Learning · Training · Insights · Nutrition · Profile.
   Insights sits centre because it's the glance-at-it overview. */
const TABS = [
  { to: '/learn',     label: 'Learning',  icon: IconLearn },
  { to: '/train',     label: 'Training',  icon: IconTrain },
  { to: '/',          label: 'Insights',  icon: IconInsights, end: true },
  { to: '/nutrition', label: 'Nutrition', icon: IconNutrition },
  { to: '/profile',   label: 'Profile',   icon: IconProfile }
]

/**
 * Not fixed — the last row of the shell's flex column. It can't drift, because
 * it isn't positioned against the viewport at all.
 */
export default function BottomNav() {
  return (
    <nav
      className="shrink-0 border-t border-separator bg-surface"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Main"
    >
      <ul className="mx-auto flex max-w-md" style={{ height: 'var(--nav-row)' }}>
        {TABS.map(({ to, label, end, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex h-full flex-col items-center justify-center gap-[2px]',
                  'text-[10px] font-medium leading-none',
                  'transition-[color,transform] duration-200 active:scale-[0.92]',
                  isActive ? 'text-violet' : 'text-label3'
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon active={isActive} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

const base = {
  width: 23, height: 23, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round'
}

/* Active tab thickens its stroke instead of swapping to a filled glyph, so the
   silhouette stays put and the change reads as emphasis. */
const w = (active) => ({ ...base, strokeWidth: active ? 2.2 : 1.7 })

function IconLearn({ active }) {
  return <svg {...w(active)}><path d="M12 6.5C10.8 5.2 9 4.5 6.5 4.5H4v14h2.5c2.5 0 4.3.7 5.5 2 1.2-1.3 3-2 5.5-2H20v-14h-2.5c-2.5 0-4.3.7-5.5 2z"/><path d="M12 6.5v13"/></svg>
}
function IconTrain({ active }) {
  return <svg {...w(active)}><path d="M4 9.5v5M7 7v10M17 7v10M20 9.5v5M7 12h10"/></svg>
}
function IconInsights({ active }) {
  return <svg {...w(active)}><path d="M4 19V5M4 19h16"/><path d="M8 15l3.5-4.5L15 14l4-6"/></svg>
}
function IconNutrition({ active }) {
  return <svg {...w(active)}><path d="M12 8c0-2.2 1.8-4 4-4 .6 0 1 .4 1 1 0 2.2-1.8 4-4 4"/><path d="M12 20c-3.3 0-6-3.1-6-7 0-2.8 2-4.5 4-4.5 1 0 1.6.4 2 .8.4-.4 1-.8 2-.8 2 0 4 1.7 4 4.5 0 3.9-2.7 7-6 7z"/></svg>
}
function IconProfile({ active }) {
  return <svg {...w(active)}><circle cx="12" cy="8" r="3.75"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>
}
