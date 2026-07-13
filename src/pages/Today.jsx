import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageTitle, Card, Button, Empty, Stub } from '../components/ui'
import PlateStrip from '../components/PlateStrip'

export default function Today() {
  const { user } = useAuth()
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  return (
    <>
      <PageTitle eyebrow={today}>Today</PageTitle>

      <Card className="mb-4">
        <p className="text-[13px] font-medium text-label2">Next session</p>
        <h2 className="mt-0.5 text-[22px] font-semibold tracking-[-0.02em]">Upper A</h2>
        <p className="mt-1 text-[15px] text-label2">5 exercises · about 55 min</p>

        <div className="my-4 h-px bg-separator" />

        <p className="text-[13px] font-medium text-label2">Opening set · Bench press</p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-[32px] font-semibold tracking-[-0.02em] tnum">80</span>
          <span className="text-[15px] text-label2">kg × 8</span>
        </div>

        <div className="mt-3">
          <PlateStrip weightKg={80} />
        </div>

        <Link to="/train" className="mt-5 block">
          <Button>Start session</Button>
        </Link>
      </Card>

      <Empty
        title="This week"
        body="Log a session and your weekly volume shows up here."
        action={<Link to="/train"><Button variant="secondary">Go to Train</Button></Link>}
      />

      <Stub note="Placeholder session. Will read the next scheduled workout from your active routine." />

      <p className="mt-6 text-center text-[13px] text-label3">{user?.email}</p>
    </>
  )
}
