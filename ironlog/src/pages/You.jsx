import { useAuth } from '../context/AuthContext'
import { PageTitle, Card, Button, Stub } from '../components/ui'

const TIERS = [
  { id: 'free',    name: 'Free',    price: '€0',     lines: ['Full workout log', 'Modules 01–02'] },
  { id: 'plus',    name: 'Plus',    price: '€9/mo',  lines: ['Everything in Free', 'All lessons', 'Progress charts'] },
  { id: 'coached', name: 'Coached', price: '€39/mo', lines: ['Everything in Plus', '15-min check-in each month', 'Programme review'] }
]

export default function You() {
  const { user, tier, signOut } = useAuth()

  return (
    <>
      <PageTitle eyebrow={user?.email ?? 'Not signed in'}>You</PageTitle>

      <ul className="space-y-3">
        {TIERS.map((t) => {
          const current = t.id === tier
          return (
            <li key={t.id}>
              <Card className={current ? 'border-plate-red/60 ring-1 ring-plate-red/30' : ''}>
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-lg uppercase tracking-tight">{t.name}</h2>
                  <span className="font-mono text-sm font-bold tnum">{t.price}</span>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-steel">
                  {t.lines.map((l) => <li key={l}>· {l}</li>)}
                </ul>
                {current ? (
                  <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-plate-red">
                    Your plan
                  </p>
                ) : (
                  <div className="mt-3">
                    <Button variant="dark" disabled>Choose {t.name}</Button>
                  </div>
                )}
              </Card>
            </li>
          )
        })}
      </ul>

      <div className="mt-6">
        <Button variant="ghost" onClick={signOut}>Sign out</Button>
      </div>

      <Stub note="Tiers are read from profiles.tier. Checkout wires to Stripe later; check-in booking wires to Cal.com." />
    </>
  )
}
