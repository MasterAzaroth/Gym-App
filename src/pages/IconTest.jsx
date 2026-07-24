import {
  ChevronRight, X, Check, Pencil, Trash2, Play, Plus, Dumbbell, ChartNoAxesCombined, Apple, User, Weight
} from 'lucide-react'
import { PageTitle, Card } from '../components/ui'

/**
 * TEMPORARY — side-by-side comparison of every custom hand-drawn icon
 * currently in the app against its closest lucide-react equivalent, to
 * evaluate a full switch to lucide. Delete this page (and its nav entry
 * in BottomNav.jsx + route in App.jsx) once the decision is made.
 */

const ENTRIES = [
  {
    name: 'Chevron (row disclosure)',
    where: 'components/ui.jsx — Chevron',
    current: <CurrentChevron />,
    Lucide: ChevronRight,
    lucideName: 'ChevronRight'
  },
  {
    name: 'Close / dismiss',
    where: 'ActiveWorkout.jsx — XIcon',
    current: <CurrentX />,
    Lucide: X,
    lucideName: 'X'
  },
  {
    name: 'Confirm / log set',
    where: 'ActiveWorkout.jsx — CheckIcon',
    current: <CurrentCheck />,
    Lucide: Check,
    lucideName: 'Check'
  },
  {
    name: 'Edit',
    where: 'RoutineBuilder.jsx / Nutrition.jsx — EditIcon',
    current: <CurrentEdit />,
    Lucide: Pencil,
    lucideName: 'Pencil'
  },
  {
    name: 'Delete',
    where: 'RoutineBuilder.jsx / Training.jsx — TrashIcon',
    current: <CurrentTrash />,
    Lucide: Trash2,
    lucideName: 'Trash2'
  },
  {
    name: 'Start / play',
    where: 'Training.jsx — PlayIcon',
    current: <CurrentPlay />,
    Lucide: Play,
    lucideName: 'Play'
  },
  {
    name: 'Add',
    where: 'BottomNav.jsx / Nutrition.jsx — IconPlus / PlusIcon',
    current: <CurrentPlus />,
    Lucide: Plus,
    lucideName: 'Plus'
  },
  {
    name: 'Training (nav tab + quick add)',
    where: 'BottomNav.jsx — IconTrain / IconWorkoutAction',
    current: <CurrentTrain />,
    Lucide: Dumbbell,
    lucideName: 'Dumbbell'
  },
  {
    name: 'Insights (nav tab)',
    where: 'BottomNav.jsx — IconInsights',
    current: <CurrentInsights />,
    Lucide: ChartNoAxesCombined,
    lucideName: 'ChartNoAxesCombined'
  },
  {
    name: 'Nutrition (nav tab + quick add)',
    where: 'BottomNav.jsx — IconNutrition / IconFoodAction',
    current: <CurrentNutrition />,
    Lucide: Apple,
    lucideName: 'Apple'
  },
  {
    name: 'Profile (nav tab)',
    where: 'BottomNav.jsx — IconProfile',
    current: <CurrentProfile />,
    Lucide: User,
    lucideName: 'User'
  },
  {
    name: 'Weight (quick add)',
    where: 'BottomNav.jsx — IconWeightAction',
    current: <CurrentWeight />,
    Lucide: Weight,
    lucideName: 'Weight'
  }
]

export default function IconTest() {
  return (
    <>
      <PageTitle eyebrow="Temporary">Icon audit</PageTitle>
      <p className="mb-5 text-[13px] leading-relaxed text-label2">
        Current hand-drawn icon on the left, lucide-react's closest match on the right — at the
        same size the icon is actually used at in the app.
      </p>

      <div className="space-y-3">
        {ENTRIES.map((e) => (
          <Card key={e.name} className="p-4">
            <p className="text-[15px] font-semibold">{e.name}</p>
            <p className="mt-0.5 text-[12px] text-label2">{e.where}</p>
            <div className="mt-3 flex items-stretch gap-3">
              <IconTile label="Current">{e.current}</IconTile>
              <IconTile label={`lucide: ${e.lucideName}`}>
                <e.Lucide size={23} strokeWidth={1.8} />
              </IconTile>
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}

function IconTile({ label, children }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2 rounded-xl bg-tile py-4">
      <span className="flex h-9 w-9 items-center justify-center text-label">{children}</span>
      <span className="text-[11px] font-medium text-label2">{label}</span>
    </div>
  )
}

/* ------------------------------------------------ current icons, verbatim */

function CurrentChevron() {
  return (
    <svg width="10" height="16" viewBox="0 0 8 13" fill="none">
      <path d="M1.5 1.5L6.5 6.5L1.5 11.5" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CurrentX() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
      <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CurrentCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
      <path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CurrentEdit() {
  return (
    <svg width="19" height="19" viewBox="0 0 16 16" fill="none">
      <path d="M11.3 2.3a1 1 0 0 1 1.4 0l1 1a1 1 0 0 1 0 1.4l-7 7-3 .7.7-3 7-7.1Z"
            stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CurrentTrash() {
  return (
    <svg width="19" height="19" viewBox="0 0 16 16" fill="none">
      <path d="M3 4.5h10M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5M4.5 4.5l.6 8.4a1 1 0 0 0 1 .93h3.8a1 1 0 0 0 1-.93l.6-8.4"
            stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 7v4M9.5 7v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function CurrentPlay() {
  return (
    <svg width="19" height="19" viewBox="0 0 16 16" fill="none">
      <path d="M4 2.8v10.4a.8.8 0 0 0 1.22.68l8.3-5.2a.8.8 0 0 0 0-1.36l-8.3-5.2A.8.8 0 0 0 4 2.8Z"
            fill="currentColor" />
    </svg>
  )
}

function CurrentPlus() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

const navBase = {
  width: 23, height: 23, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round'
}

function CurrentTrain() {
  return <svg {...navBase}><path d="M4 9.5v5M7 7v10M17 7v10M20 9.5v5M7 12h10" /></svg>
}
function CurrentInsights() {
  return <svg {...navBase}><path d="M4 19V5M4 19h16" /><path d="M8 15l3.5-4.5L15 14l4-6" /></svg>
}
function CurrentNutrition() {
  return (
    <svg {...navBase}>
      <path d="M12 8c0-2.2 1.8-4 4-4 .6 0 1 .4 1 1 0 2.2-1.8 4-4 4" />
      <path d="M12 20c-3.3 0-6-3.1-6-7 0-2.8 2-4.5 4-4.5 1 0 1.6.4 2 .8.4-.4 1-.8 2-.8 2 0 4 1.7 4 4.5 0 3.9-2.7 7-6 7z" />
    </svg>
  )
}
function CurrentProfile() {
  return <svg {...navBase}><circle cx="12" cy="8" r="3.75" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>
}
function CurrentWeight() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M12 16v-5M12 11l2.5-2.5" />
    </svg>
  )
}
