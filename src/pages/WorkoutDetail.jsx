import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageTitle, Card, Spinner, ErrorNote } from '../components/ui'
import { getWorkout } from '../lib/db'
import { epley1RM } from '../lib/plates'

export default function WorkoutDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [workout, setWorkout] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getWorkout(id).then(setWorkout).catch((e) => setError(e.message))
  }, [id])

  const byExercise = useMemo(() => {
    if (!workout?.sets) return []
    const map = new Map()
    for (const s of workout.sets) {
      const key = s.exercise_id
      if (!map.has(key)) map.set(key, { name: s.exercise?.name ?? 'Exercise', sets: [] })
      map.get(key).sets.push(s)
    }
    return [...map.values()]
  }, [workout])

  if (error) return <ErrorNote error={error} />
  if (!workout) return <Spinner />

  return (
    <>
      <button onClick={() => navigate('/train')} className="mb-3 text-[17px] text-violet">
        ‹ Training
      </button>

      <PageTitle
        eyebrow={new Date(workout.started_at).toLocaleDateString(undefined, {
          weekday: 'long', day: 'numeric', month: 'long'
        })}
      >
        {workout.name ?? 'Session'}
      </PageTitle>

      <div className="space-y-3">
        {byExercise.map((ex) => (
          <Card key={ex.name} className="p-4">
            <h3 className="text-[17px] font-semibold">{ex.name}</h3>
            <table className="mt-3 w-full text-[15px] tnum">
              <thead>
                <tr className="text-[13px] text-label2">
                  <th className="w-8 pb-1 text-left font-medium">#</th>
                  <th className="pb-1 text-right font-medium">kg</th>
                  <th className="pb-1 text-right font-medium">reps</th>
                  <th className="pb-1 text-right font-medium">e1RM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator">
                {ex.sets.map((s, i) => (
                  <tr key={s.id} className={s.is_warmup ? 'text-label3' : ''}>
                    <td className="py-1.5">{s.is_warmup ? 'W' : i + 1}</td>
                    <td className="py-1.5 text-right font-medium">{s.weight_kg}</td>
                    <td className="py-1.5 text-right">{s.reps}</td>
                    <td className="py-1.5 text-right text-label2">
                      {s.is_warmup ? '—' : epley1RM(s.weight_kg, s.reps)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
      </div>

      {workout.notes && (
        <Card className="mt-3 p-4">
          <p className="text-[13px] font-medium text-label2">Notes</p>
          <p className="mt-1 text-[15px] leading-relaxed">{workout.notes}</p>
        </Card>
      )}
    </>
  )
}
