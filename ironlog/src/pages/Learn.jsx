import { PageTitle, Card, Stub } from '../components/ui'
import { useAuth } from '../context/AuthContext'

// The curriculum skeleton. Numbering is used here because the content genuinely
// is a sequence — you can't sensibly do progressive overload before you can
// hold a technical position.
const MODULES = [
  { n: '01', title: 'How muscle is actually built', lessons: 4, tier: 'free' },
  { n: '02', title: 'Technique before load', lessons: 6, tier: 'free' },
  { n: '03', title: 'Progressive overload in practice', lessons: 5, tier: 'plus' },
  { n: '04', title: 'Programming your week', lessons: 5, tier: 'plus' },
  { n: '05', title: 'Energy balance and body fat', lessons: 4, tier: 'plus' },
  { n: '06', title: 'Recovery, sleep, and injury', lessons: 3, tier: 'coached' }
]

export default function Learn() {
  const { tier } = useAuth()
  const unlocked = { free: 1, plus: 2, coached: 3 }[tier] ?? 1

  return (
    <>
      <PageTitle eyebrow="Curriculum">Learn</PageTitle>

      <ul className="space-y-3">
        {MODULES.map((m) => {
          const rank = { free: 1, plus: 2, coached: 3 }[m.tier]
          const locked = rank > unlocked
          return (
            <li key={m.n}>
              <Card className={locked ? 'opacity-60' : ''}>
                <div className="flex items-start gap-4">
                  <span className="font-display text-2xl leading-none text-plate-red">{m.n}</span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold leading-snug">{m.title}</h2>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-steel">
                      {m.lessons} lessons {locked && `· ${m.tier} tier`}
                    </p>
                  </div>
                  {locked && <LockIcon />}
                </div>
              </Card>
            </li>
          )
        })}
      </ul>

      <Stub note="Module titles are placeholders for your outline. Lesson bodies will render from MDX or a Supabase 'lessons' table." />
    </>
  )
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A5058" strokeWidth="2" className="mt-1 shrink-0">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}
