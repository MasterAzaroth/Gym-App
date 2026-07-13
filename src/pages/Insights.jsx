import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Card, Empty, Spinner, ErrorNote, Button, MacroBar } from '../components/ui'
import { listWorkouts, listBodyMetrics, listNutrition } from '../lib/db'
import { sumEntries, toISODate } from '../lib/nutrition'

export default function Insights() {
  const { user, profile } = useAuth()
  const [data, setData] = useState({ workouts: [], metrics: [], today: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const [workouts, metrics, today] = await Promise.all([
        listWorkouts(user.id, 30),
        listBodyMetrics(user.id, 30),
        listNutrition(user.id, toISODate(new Date()))
      ])
      setData({ workouts, metrics, today })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { load() }, [load])

  const week = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)
    const recent = data.workouts.filter((w) => new Date(w.started_at) >= cutoff)
    return {
      sessions: recent.length,
      sets: recent.reduce((s, w) => s + w.set_count, 0),
      volume: recent.reduce((s, w) => s + w.volume_kg, 0)
    }
  }, [data.workouts])

  const weightTrend = useMemo(() => {
    const withWeight = data.metrics.filter((m) => m.weight_kg != null)
    if (withWeight.length < 2) return null
    const newest = withWeight[0]
    const oldest = withWeight[withWeight.length - 1]
    const delta = Number(newest.weight_kg) - Number(oldest.weight_kg)
    const days = Math.max(
      1,
      Math.round((new Date(newest.measured_on) - new Date(oldest.measured_on)) / 86400000)
    )
    return { current: Number(newest.weight_kg), delta: Math.round(delta * 10) / 10, days }
  }, [data.metrics])

  const todayTotals = useMemo(() => sumEntries(data.today), [data.today])
  const goals = {
    kcal:    profile?.goal_kcal ?? 2500,
    protein: profile?.goal_protein_g ?? 180,
    carbs:   profile?.goal_carbs_g ?? 280,
    fat:     profile?.goal_fat_g ?? 80
  }

  const greeting = new Date().getHours() < 12 ? 'Good morning'
    : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'

  if (loading) return <Spinner />
  if (error) return <ErrorNote error={error} onRetry={load} />

  const nothingYet = data.workouts.length === 0 && data.today.length === 0 && data.metrics.length === 0

  return (
    <>
      <header className="mb-6">
        <p className="text-[13px] font-medium text-label2">{greeting}</p>
        <h1 className="text-[34px] font-bold leading-tight tracking-[-0.022em]">Insights</h1>
      </header>

      {nothingYet && (
        <div className="mb-6">
          <Empty
            title="Nothing to show yet"
            body="Log a workout or a meal and this page starts filling in on its own."
            action={<Link to="/train"><Button>Build a routine</Button></Link>}
          />
        </div>
      )}

      {/* Last 7 days */}
      <section className="mb-6">
        <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-[0.04em] text-label2">
          Last 7 days
        </h2>
        <Card className="grid grid-cols-3 divide-x divide-separator p-0">
          <Stat value={week.sessions} label="Sessions" />
          <Stat value={week.sets} label="Working sets" />
          <Stat value={week.volume ? `${(week.volume / 1000).toFixed(1)}t` : '0'} label="Volume" />
        </Card>
      </section>

      {/* Today's nutrition */}
      <section className="mb-6">
        <div className="mb-2 flex items-baseline justify-between px-1">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-label2">
            Today's nutrition
          </h2>
          <Link to="/nutrition" className="text-[13px] font-medium text-violet">Open</Link>
        </div>
        <Card className="p-5">
          {data.today.length === 0 ? (
            <p className="py-2 text-[15px] leading-relaxed text-label2">
              Nothing logged today.{' '}
              <Link to="/nutrition" className="font-medium text-violet">Add your first meal.</Link>
            </p>
          ) : (
            <>
              <p className="text-[32px] font-bold tracking-[-0.02em] tnum">
                {Math.round(todayTotals.kcal)}
                <span className="text-[17px] font-medium text-label2"> / {goals.kcal} kcal</span>
              </p>
              <div className="mt-4 space-y-3.5">
                <MacroBar label="Protein" value={todayTotals.protein_g} goal={goals.protein} color="#6E56CF" />
                <MacroBar label="Carbs"   value={todayTotals.carbs_g}   goal={goals.carbs}   color="#3B9EDB" />
                <MacroBar label="Fat"     value={todayTotals.fat_g}     goal={goals.fat}     color="#E8A33D" />
              </div>
            </>
          )}
        </Card>
      </section>

      {/* Bodyweight */}
      <section className="mb-6">
        <div className="mb-2 flex items-baseline justify-between px-1">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-label2">
            Bodyweight
          </h2>
          <Link to="/profile" className="text-[13px] font-medium text-violet">Log</Link>
        </div>
        <Card className="p-5">
          {!weightTrend ? (
            <p className="py-2 text-[15px] leading-relaxed text-label2">
              Log your weight twice and a trend appears here. Single readings tell you nothing.
            </p>
          ) : (
            <>
              <div className="flex items-baseline gap-3">
                <p className="text-[32px] font-bold tracking-[-0.02em] tnum">
                  {weightTrend.current}
                  <span className="text-[17px] font-medium text-label2"> kg</span>
                </p>
                <span className={`text-[15px] font-semibold tnum ${
                  weightTrend.delta > 0 ? 'text-violet' : weightTrend.delta < 0 ? 'text-danger' : 'text-label2'
                }`}>
                  {weightTrend.delta > 0 ? '+' : ''}{weightTrend.delta} kg
                </span>
              </div>
              <p className="mt-1 text-[13px] text-label2">
                Over the last {weightTrend.days} days
              </p>
              <Sparkline metrics={data.metrics} />
            </>
          )}
        </Card>
      </section>

      {/* Recent sessions */}
      {data.workouts.length > 0 && (
        <section className="mb-6">
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-label2">
              Recent sessions
            </h2>
            <Link to="/train" className="text-[13px] font-medium text-violet">All</Link>
          </div>
          <Card className="divide-y divide-separator p-0">
            {data.workouts.slice(0, 3).map((w) => (
              <Link key={w.id} to={`/train/workout/${w.id}`}
                    className="flex items-center justify-between px-4 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-[17px]">{w.name ?? 'Session'}</p>
                  <p className="text-[13px] text-label2">
                    {new Date(w.started_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    {' · '}{w.set_count} sets
                  </p>
                </div>
                <span className="shrink-0 text-[15px] text-label2 tnum">
                  {w.volume_kg.toLocaleString()} kg
                </span>
              </Link>
            ))}
          </Card>
        </section>
      )}
    </>
  )
}

function Stat({ value, label }) {
  return (
    <div className="px-2 py-5 text-center">
      <p className="text-[26px] font-bold tracking-[-0.02em] tnum">{value}</p>
      <p className="mt-0.5 text-[12px] text-label2">{label}</p>
    </div>
  )
}

/** Bodyweight line, drawn straight from the data. No chart library needed. */
function Sparkline({ metrics }) {
  const points = metrics
    .filter((m) => m.weight_kg != null)
    .slice(0, 30)
    .reverse()
    .map((m) => Number(m.weight_kg))

  if (points.length < 2) return null

  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const w = 300
  const h = 64

  const path = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * w
      const y = h - ((v - min) / range) * (h - 8) - 4
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 w-full" preserveAspectRatio="none" aria-hidden="true">
      <path d={path} fill="none" stroke="#6E56CF" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
