import { useState } from 'react'
import { PageTitle, Card, Button, Field, FieldGroup, Stub } from '../components/ui'
import PlateStrip from '../components/PlateStrip'
import { roundToLoadable, epley1RM } from '../lib/plates'

export default function Train() {
  const [weight, setWeight] = useState(100)
  const [reps, setReps] = useState(8)

  const loadable = roundToLoadable(Number(weight) || 0)
  const oneRM = epley1RM(Number(weight) || 0, Number(reps) || 0)

  return (
    <>
      <PageTitle eyebrow="Session">Train</PageTitle>

      <FieldGroup>
        <Field
          label="Weight"
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
      </FieldGroup>

      <Card className="mt-4">
        <p className="text-[13px] font-medium text-label2">Load the bar</p>
        <div className="mt-3">
          <PlateStrip weightKg={Number(weight) || 0} />
        </div>

        <div className="my-4 h-px bg-separator" />

        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-[13px] text-label2">Nearest loadable</dt>
            <dd className="mt-0.5 text-[20px] font-semibold tnum">{loadable} kg</dd>
          </div>
          <div>
            <dt className="text-[13px] text-label2">Estimated 1RM</dt>
            <dd className="mt-0.5 text-[20px] font-semibold tnum">{oneRM} kg</dd>
          </div>
        </dl>
      </Card>

      <div className="mt-4">
        <Button disabled>Log set</Button>
      </div>

      <Stub note="Next build: exercise library, routine builder, live session with rest timer, sets saved to Supabase." />
    </>
  )
}
