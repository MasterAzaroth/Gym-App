import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sheet, Group, Row } from './ui'
import FoodAddSheet from './FoodAddSheet'
import WeightLogSheet from './WeightLogSheet'
import { dayWindow, defaultLoggedTime, toISODate } from '../lib/nutrition'

const LEFT_TABS = [
  { to: '/',      label: 'Insights', icon: IconInsights, end: true },
  { to: '/train', label: 'Training', icon: IconTrain }
]

const RIGHT_TABS = [
  { to: '/nutrition', label: 'Nutrition', icon: IconNutrition },
  { to: '/profile',   label: 'Profile',   icon: IconProfile }
]

/* Last row of the shell's flex column. Not positioned, so nothing can shift it. */
export default function BottomNav() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [foodOpen, setFoodOpen] = useState(false)
  const [weightOpen, setWeightOpen] = useState(false)

  const [dayStart, dayEnd] = dayWindow(profile)

  return (
    <nav
      className="relative z-10 shrink-0 border-t border-separator bg-surface"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Main"
    >
      <ul className="mx-auto flex max-w-md" style={{ height: 'var(--nav-row)' }}>
        {LEFT_TABS.map((tab) => <NavTab key={tab.to} {...tab} />)}

        <li className="flex-1">
          <div className="flex h-full flex-col items-center justify-center">
            <button
              onClick={() => setQuickAddOpen(true)}
              aria-label="Quick add"
              className="-mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet text-white shadow-card transition-transform active:scale-[0.92]"
            >
              <IconPlus />
            </button>
          </div>
        </li>

        {RIGHT_TABS.map((tab) => <NavTab key={tab.to} {...tab} />)}
      </ul>

      <Sheet open={quickAddOpen} onClose={() => setQuickAddOpen(false)} title="Quick add">
        <Group className="mt-2">
          <Row label="Log food" onClick={() => { setQuickAddOpen(false); setFoodOpen(true) }} />
          <Row label="Log weight" onClick={() => { setQuickAddOpen(false); setWeightOpen(true) }} />
          {/* No live workout-logging flow exists yet — closest useful spot is
              the routines list, so this one still navigates. */}
          <Row
            label="Start a workout"
            onClick={() => { setQuickAddOpen(false); navigate('/train', { state: { quickAdd: 'workout' } }) }}
          />
        </Group>
      </Sheet>

      {/* Logs directly, from wherever you are — no navigation, no page to visit first. */}
      <FoodAddSheet
        open={foodOpen}
        presetTime={defaultLoggedTime(dayStart, dayEnd)}
        userId={user?.id}
        isoDate={toISODate(new Date())}
        dayStart={dayStart}
        dayEnd={dayEnd}
        onClose={() => setFoodOpen(false)}
        onSaved={() => setFoodOpen(false)}
      />
      <WeightLogSheet
        open={weightOpen}
        userId={user?.id}
        onClose={() => setWeightOpen(false)}
        onSaved={() => setWeightOpen(false)}
      />
    </nav>
  )
}

function NavTab({ to, label, end, icon: Icon }) {
  return (
    <li className="flex-1">
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
  )
}

const base = {
  width: 23, height: 23, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round'
}
const w = (active) => ({ ...base, strokeWidth: active ? 2.2 : 1.7 })

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
function IconPlus() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
