import { useState } from 'react'
import { PageTitle, Card, Button, Field, Stub } from '../components/ui'
import PlateStrip from '../components/PlateStrip'
import { roundToLoadable, epley1RM } from '../lib/plates'

/**
 * Tracker is stubbed — but the plate strip is live, so you can feel the core
 * interaction on your phone right now. Type a weight, see the bar load.
 */
export default function Train() {
  const [weight, setWeight] = useState(100)
  const [reps, setReps] = useState(8)

  const loadable = roundToLoadable(Number(weight) || 0)
  const oneRM = epley1RM(Number(weight) || 0, Number(reps) || 0)

  return (
    <>
      <PageTitle eyebrow="Session">Train</PageTitle>

      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Weight (kg)"
            type="number"
            inputMode="decimal"
            step="2.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <Field
            label="Reps"
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
          />
        </div>

        <div className="mt-5 rounded-lg bg-iron p-4">
          <PlateStrip weightKg={Number(weight) || 0} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 font-mono text-xs">
          <div>
            <dt className="uppercase tracking-wider text-steel">Nearest loadable</dt>
            <dd className="mt-0.5 text-base font-bold tnum">{loadable} kg</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wider text-steel">Est. 1RM</dt>
            <dd className="mt-0.5 text-base font-bold tnum">{oneRM} kg</dd>
          </div>
        </dl>

        <div className="mt-5">
          <Button disabled>Log set</Button>
        </div>
      </Card>

      <Stub note="Next build: exercise library, routine builder, live session with rest timer, sets written to Supabase." />
    </>
  )
}
