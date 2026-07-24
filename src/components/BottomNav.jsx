import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sheet } from './ui'
import FoodAddSheet from './FoodAddSheet'
import WeightLogSheet from './WeightLogSheet'
import { dayWindow, defaultLoggedTime, toISODate } from '../lib/nutrition'

const LEFT_TABS = [
  // TEMPORARY — icon audit page, remove this tab (and its route in
  // App.jsx) once the lucide-react comparison is done.
  { to: '/icons', label: 'Icons',    icon: IconTest },
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
        <div className="mt-2 grid grid-cols-3 gap-3">
          <QuickAddOption
            icon={<IconFoodAction />}
            label="Log food"
            onClick={() => { setQuickAddOpen(false); setFoodOpen(true) }}
          />
          <QuickAddOption
            icon={<IconWeightAction />}
            label="Log weight"
            onClick={() => { setQuickAddOpen(false); setWeightOpen(true) }}
          />
          {/* No live workout-logging flow exists yet — closest useful spot is
              the routines list, so this one still navigates. */}
          <QuickAddOption
            icon={<IconWorkoutAction />}
            label="Start workout"
            onClick={() => { setQuickAddOpen(false); navigate('/train', { state: { quickAdd: 'workout' } }) }}
          />
        </div>
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

/** A tappable tile, not a list row — three big targets read faster than a
    stack of text at a glance, and match the sheet's spirit of "pick one and
    go" rather than "read then choose". */
function QuickAddOption({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-2xl bg-surface p-4 text-center shadow-card transition-transform active:scale-[0.96]"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-soft text-violet">
        {icon}
      </span>
      <span className="text-[13px] font-medium leading-tight">{label}</span>
    </button>
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

function IconTest({ active }) {
  return <svg {...w(active)}><path d="M9 3h6M10 3v5.5L5.5 17a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 8.5V3" /><path d="M8 14h8" /></svg>
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
function IconFoodAction() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8c0-2.2 1.8-4 4-4 .6 0 1 .4 1 1 0 2.2-1.8 4-4 4"/>
      <path d="M12 20c-3.3 0-6-3.1-6-7 0-2.8 2-4.5 4-4.5 1 0 1.6.4 2 .8.4-.4 1-.8 2-.8 2 0 4 1.7 4 4.5 0 3.9-2.7 7-6 7z"/>
    </svg>
  )
}
function IconWeightAction() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M12 16v-5M12 11l2.5-2.5" />
    </svg>
  )
}
function IconWorkoutAction() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9.5v5M7 7v10M17 7v10M20 9.5v5M7 12h10"/>
    </svg>
  )
}
function IconPlus() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
