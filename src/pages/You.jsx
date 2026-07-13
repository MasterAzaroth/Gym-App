import { useAuth } from '../context/AuthContext'
import { PageTitle, Card, Button, Stub } from '../components/ui'

const TIERS = [
  { id: 'free',    name: 'Free',    price: '€0',     lines: ['Full workout log', 'Modules 1–2'] },
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
              <Card className={current ? 'ring-2 ring-violet' : ''}>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-[20px] font-semibold tracking-[-0.02em]">{t.name}</h2>
                  <span className="text-[17px] font-semibold tnum text-label2">{t.price}</span>
                </div>
                <ul className="mt-2.5 space-y-1.5">
                  {t.lines.map((l) => (
                    <li key={l} className="flex gap-2 text-[15px] text-label2">
                      <span className="text-violet">✓</span>{l}
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  {current ? (
                    <p className="text-center text-[13px] font-medium text-violet">Your current plan</p>
                  ) : (
                    <Button variant="secondary" disabled>Choose {t.name}</Button>
                  )}
                </div>
              </Card>
            </li>
          )
        })}
      </ul>

      <div className="mt-6">
        <Button variant="ghost" onClick={signOut}>Sign out</Button>
      </div>

      <Stub note="Tiers read from profiles.tier. Checkout wires to Stripe later; check-in booking to Cal.com." />
    </>
  )
}
