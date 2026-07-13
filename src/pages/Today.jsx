import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageTitle, Card, Button, Empty, Stub } from '../components/ui'
import PlateStrip from '../components/PlateStrip'

export default function Today() {
  const { user } = useAuth()
  const name = user?.email?.split('@')[0] ?? 'lifter'
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <>
      <PageTitle eyebrow={today}>Today</PageTitle>

      <Card className="mb-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-steel">Next session</p>
        <h2 className="mt-1 font-display text-xl uppercase tracking-tight">Upper A</h2>
        <p className="mt-1 text-sm text-steel">5 exercises · roughly 55 min</p>

        <div className="my-4 h-px bg-iron/10" />

        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-steel">
          Opening set · Bench press
        </p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-mono text-3xl font-bold tnum">80</span>
          <span className="font-mono text-sm text-steel">kg × 8</span>
        </div>
        <div className="mt-3">
          <PlateStrip weightKg={80} />
        </div>

        <Link to="/train" className="mt-5 block">
          <Button>Start session</Button>
        </Link>
        <Stub note="Hardcoded. Will read the next scheduled session from the user's active routine." />
      </Card>

      <Empty
        title="This week"
        body="Log a session and your weekly volume shows up here."
        action={<Link to="/train"><Button variant="dark">Go to Train</Button></Link>}
      />

      <p className="mt-6 text-center text-xs text-steel">
        Signed in as {name}
      </p>
    </>
  )
}
