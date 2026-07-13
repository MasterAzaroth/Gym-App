import { PageTitle, Card, Stub } from '../components/ui'
import { useAuth } from '../context/AuthContext'

const MODULES = [
  { n: 1, title: 'How muscle is actually built', lessons: 4, tier: 'free' },
  { n: 2, title: 'Technique before load', lessons: 6, tier: 'free' },
  { n: 3, title: 'Progressive overload in practice', lessons: 5, tier: 'plus' },
  { n: 4, title: 'Programming your week', lessons: 5, tier: 'plus' },
  { n: 5, title: 'Energy balance and body fat', lessons: 4, tier: 'plus' },
  { n: 6, title: 'Recovery, sleep, and injury', lessons: 3, tier: 'coached' }
]

const RANK = { free: 1, plus: 2, coached: 3 }

export default function Learn() {
  const { tier } = useAuth()
  const unlocked = RANK[tier] ?? 1

  return (
    <>
      <PageTitle eyebrow="Curriculum">Learn</PageTitle>

      <ul className="space-y-3">
        {MODULES.map((m) => {
          const locked = RANK[m.tier] > unlocked
          return (
            <li key={m.n}>
              <Card className={`flex items-center gap-4 ${locked ? 'opacity-55' : ''}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-soft text-[15px] font-semibold text-violet tnum">
                  {m.n}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[17px] font-semibold leading-snug tracking-[-0.01em]">
                    {m.title}
                  </h2>
                  <p className="mt-0.5 text-[13px] text-label2">
                    {m.lessons} lessons{locked && ` · ${m.tier} plan`}
                  </p>
                </div>
                {locked && <LockIcon />}
              </Card>
            </li>
          )
        })}
      </ul>

      <Stub note="Module titles are placeholders for your outline. Lesson bodies will render from a Supabase lessons table." />
    </>
  )
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="2" className="shrink-0">
      <rect x="4" y="10" width="16" height="10" rx="3" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}
