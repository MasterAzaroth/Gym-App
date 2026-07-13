import { NavLink } from 'react-router-dom'

/* Left to right: Learning · Training · Insights · Nutrition · Profile.
   Insights sits at the centre because it's the overview you glance at. */
const TABS = [
  { to: '/learn',     label: 'Learning',  icon: IconLearn },
  { to: '/train',     label: 'Training',  icon: IconTrain },
  { to: '/',          label: 'Insights',  icon: IconInsights, end: true },
  { to: '/nutrition', label: 'Nutrition', icon: IconNutrition },
  { to: '/profile',   label: 'Profile',   icon: IconProfile }
]

export default function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-separator bg-surface/85 backdrop-blur-xl"
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
                  'flex flex-col items-center gap-[3px] pb-1.5 pt-2 text-[10px] font-medium transition-colors',
                  isActive ? 'text-violet' : 'text-label3'
                ].join(' ')
              }
            >
              <Icon />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

const base = {
  width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.7,
  strokeLinecap: 'round', strokeLinejoin: 'round'
}

function IconLearn() {
  return <svg {...base}><path d="M12 6.5C10.8 5.2 9 4.5 6.5 4.5H4v14h2.5c2.5 0 4.3.7 5.5 2 1.2-1.3 3-2 5.5-2H20v-14h-2.5c-2.5 0-4.3.7-5.5 2z"/><path d="M12 6.5v13"/></svg>
}
function IconTrain() {
  return <svg {...base}><path d="M4 9.5v5M7 7v10M17 7v10M20 9.5v5M7 12h10"/></svg>
}
function IconInsights() {
  return <svg {...base}><path d="M4 19V5M4 19h16"/><path d="M8 15l3.5-4.5L15 14l4-6"/></svg>
}
function IconNutrition() {
  return <svg {...base}><path d="M12 8c0-2.2 1.8-4 4-4 .6 0 1 .4 1 1 0 2.2-1.8 4-4 4"/><path d="M12 20c-3.3 0-6-3.1-6-7 0-2.8 2-4.5 4-4.5 1 0 1.6.4 2 .8.4-.4 1-.8 2-.8 2 0 4 1.7 4 4.5 0 3.9-2.7 7-6 7z"/></svg>
}
function IconProfile() {
  return <svg {...base}><circle cx="12" cy="8" r="3.75"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>
}
