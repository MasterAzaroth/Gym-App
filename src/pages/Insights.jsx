import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Trophy, Dumbbell, TrendingUp, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Card, Empty, Spinner, ErrorNote, Button, MacroBar, Segmented } from '../components/ui'
import { LineChart, StackedBarChart, RankedBars, RadialGauge } from '../components/charts'
import { listWorkoutsSince, listSetsSince, listBodyMetrics, listNutritionSince } from '../lib/db'
import { sumEntries, toISODate } from '../lib/nutrition'
import {
  daysAgoISO, computeWeekSummary, computeWeightSnapshot, getTodayEntries, getRecentSessions,
  computeDailyStreak, computeMuscleGroupWeeklyAvg, rankTrainedExercises, computeStrengthDevelopment,
  computeDailyMacros, computeMacroAverages, computeBodyweightSeries, computeWeightRate
} from '../lib/insights'

// App-violet plus a few more hues validated for both light and dark surfaces
// — no Tailwind token for these yet (same "hardcoded hex" tradeoff MacroBar
// already makes for its carb/fat colors), but arbitrary-value + dark:
// classes still adapt.
const LIFT_COLORS = ['text-violet', 'text-[#eb6834] dark:text-[#d95926]', 'text-[#1baf7a] dark:text-[#199e70]']

// One color per ranked row in the muscle-group breakdown — assigned by rank,
// not by muscle identity, so the highest-volume group always reads first.
const MUSCLE_COLORS = [
  'text-violet',
  'text-[#eb6834] dark:text-[#d95926]',
  'text-[#1baf7a] dark:text-[#199e70]',
  'text-[#3b9edb] dark:text-[#2f8bc4]',
  'text-[#d9498c] dark:text-[#c73f7c]',
  'text-[#e8a33d] dark:text-[#d4922f]',
  'text-[#8a63d2] dark:text-[#7952c4]',
  'text-[#5ec2c2] dark:text-[#4aabab]'
]

export default function Insights() {
  const { user, profile } = useAuth()
  const [tab, setTab] = useState('overview')
  const [data, setData] = useState({ workouts: [], sets: [], metrics: [], nutrition: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const [workouts, sets, metrics, nutrition] = await Promise.all([
        listWorkoutsSince(user.id, daysAgoISO(90)),
        listSetsSince(user.id, daysAgoISO(90)),
        listBodyMetrics(user.id, 120),
        listNutritionSince(user.id, daysAgoISO(30))
      ])
      setData({ workouts, sets, metrics, nutrition })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { load() }, [load])

  const greeting = new Date().getHours() < 12 ? 'Good morning'
    : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'

  if (loading) return <Spinner />
  if (error) return <ErrorNote error={error} onRetry={load} />

  const nothingYet = data.workouts.length === 0 && data.nutrition.length === 0 && data.metrics.length === 0

  return (
    <>
      <header className="mb-6">
        <p className="text-[13px] font-medium text-label2">{greeting}</p>
        <h1 className="text-[34px] font-bold leading-tight tracking-[-0.022em]">Insights</h1>
      </header>

      {nothingYet ? (
        <Empty
          title="Nothing to show yet"
          body="Log a workout or a meal and this page starts filling in on its own."
          action={<Link to="/train"><Button>Build a routine</Button></Link>}
        />
      ) : (
        <>
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'overview', label: 'Overview' },
              { value: 'training', label: 'Training' },
              { value: 'nutrition', label: 'Nutrition' }
            ]}
          />

          {tab === 'overview' && (
            <OverviewTab workouts={data.workouts} metrics={data.metrics} nutrition={data.nutrition} profile={profile} />
          )}
          {tab === 'training' && <TrainingTab workouts={data.workouts} sets={data.sets} />}
          {tab === 'nutrition' && (
            <NutritionBodyTab nutrition={data.nutrition} metrics={data.metrics} profile={profile} />
          )}
        </>
      )}
    </>
  )
}

/* ----------------------------------------------------------------- overview */

function OverviewTab({ workouts, metrics, nutrition, profile }) {
  const week = useMemo(() => computeWeekSummary(workouts), [workouts])
  const weightTrend = useMemo(() => computeWeightSnapshot(metrics), [metrics])
  const today = useMemo(() => getTodayEntries(nutrition, toISODate(new Date())), [nutrition])
  const todayTotals = useMemo(() => sumEntries(today), [today])
  const recent = useMemo(() => getRecentSessions(workouts, 3), [workouts])

  const goals = {
    kcal:    profile?.goal_kcal ?? 2500,
    protein: profile?.goal_protein_g ?? 180,
    carbs:   profile?.goal_carbs_g ?? 280,
    fat:     profile?.goal_fat_g ?? 80
  }

  return (
    <>
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
          {today.length === 0 ? (
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
              <Sparkline metrics={metrics} />
            </>
          )}
        </Card>
      </section>

      {/* Recent sessions */}
      {recent.length > 0 && (
        <section className="mb-6">
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-label2">
              Recent sessions
            </h2>
            <Link to="/train" className="text-[13px] font-medium text-violet">All</Link>
          </div>
          <Card className="divide-y divide-separator p-0">
            {recent.map((w) => (
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

/* ----------------------------------------------------------------- training */

function TrainingTab({ workouts, sets }) {
  const streak = useMemo(() => computeDailyStreak(workouts), [workouts])
  const muscleVolume = useMemo(() => computeMuscleGroupWeeklyAvg(sets, { weeks: 4 }), [sets])
  const trainedExercises = useMemo(() => rankTrainedExercises(sets), [sets])

  const [selectedExerciseId, setSelectedExerciseId] = useState(null)
  useEffect(() => {
    setSelectedExerciseId((current) =>
      trainedExercises.some((e) => e.id === current) ? current : (trainedExercises[0]?.id ?? null)
    )
  }, [trainedExercises])

  const strength = useMemo(
    () => (selectedExerciseId ? computeStrengthDevelopment(sets, selectedExerciseId) : null),
    [sets, selectedExerciseId]
  )

  if (workouts.length === 0) {
    return (
      <Empty
        title="No training data yet"
        body="Log a few sessions and streaks, muscle volume, and strength trends show up here."
      />
    )
  }

  return (
    <>
      <section className="mb-6">
        <h2 className="mb-2 flex items-center gap-1.5 px-1 text-[13px] font-semibold uppercase tracking-[0.04em] text-label2">
          <Flame size={14} strokeWidth={2.2} /> Streak
        </h2>
        <Card className="grid grid-cols-2 divide-x divide-separator p-0">
          <Stat
            icon={<Flame size={20} strokeWidth={2} className="text-[#eb6834] dark:text-[#d95926]" />}
            value={streak.currentDays}
            label={streak.currentDays === 1 ? 'Day streak' : 'Day streak'}
          />
          <Stat
            icon={<Trophy size={20} strokeWidth={2} className="text-violet" />}
            value={streak.longestDays}
            label="Best streak"
          />
        </Card>
      </section>

      <section className="mb-6">
        <div className="mb-2 flex items-baseline justify-between px-1">
          <h2 className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.04em] text-label2">
            <Dumbbell size={14} strokeWidth={2.2} /> Weekly muscle volume
          </h2>
          <span className="text-[13px] text-label2">Last 4 weeks avg</span>
        </div>
        <Card className="p-5">
          {muscleVolume.length === 0 ? (
            <p className="py-2 text-[15px] leading-relaxed text-label2">
              Nothing logged in the last 4 weeks.
            </p>
          ) : (
            <RankedBars
              items={muscleVolume.slice(0, 8).map((m, i) => ({
                ...m, colorClassName: MUSCLE_COLORS[i % MUSCLE_COLORS.length]
              }))}
              formatValue={(v) => `${Math.round(v).toLocaleString()} kg/wk`}
            />
          )}
        </Card>
      </section>

      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between gap-3 px-1">
          <h2 className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.04em] text-label2">
            <TrendingUp size={14} strokeWidth={2.2} /> Strength development
          </h2>
          {trainedExercises.length > 0 && (
            <ExercisePicker
              value={selectedExerciseId}
              onChange={setSelectedExerciseId}
              options={trainedExercises}
            />
          )}
        </div>
        <Card className="p-5">
          {!strength || strength.actual.length === 0 ? (
            <p className="py-2 text-[15px] leading-relaxed text-label2">
              Log the same lift on two different days to see a strength trend.
            </p>
          ) : (
            <LineChart
              series={[
                { id: 'actual', label: 'Actual', colorClassName: 'text-label3', style: 'dots', points: strength.actual },
                { id: 'average', label: 'Avg', colorClassName: 'text-violet', points: strength.average },
                { id: 'estimate', label: 'Est. 1RM', colorClassName: LIFT_COLORS[1], points: strength.estimate }
              ]}
              formatY={(v) => `${Math.round(v)} kg`}
            />
          )}
        </Card>
      </section>
    </>
  )
}

/** A compact select dropdown for choosing which lift the strength-development
    chart plots — a native <select> rather than a Segmented control since the
    option list (every exercise with enough history) can run well past what
    a row of pills can hold. */
function ExercisePicker({ value, onChange, options }) {
  return (
    <div className="relative shrink-0">
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg bg-fill py-1.5 pl-3 pr-7 text-[13px] font-medium text-label focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
      <ChevronDown
        size={14} strokeWidth={2}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-label3"
      />
    </div>
  )
}

/* ---------------------------------------------------------- nutrition & body */

function NutritionBodyTab({ nutrition, metrics, profile }) {
  const dailyMacros = useMemo(() => computeDailyMacros(nutrition, { days: 14 }), [nutrition])
  const macroAverages = useMemo(() => computeMacroAverages(nutrition, { days: 14 }), [nutrition])
  const bodyweight = useMemo(() => computeBodyweightSeries(metrics, { movingAverageDays: 7 }), [metrics])
  const rate = useMemo(() => computeWeightRate(metrics), [metrics])

  const goals = {
    kcal:    profile?.goal_kcal ?? 2500,
    protein: profile?.goal_protein_g ?? 180,
    carbs:   profile?.goal_carbs_g ?? 280,
    fat:     profile?.goal_fat_g ?? 80
  }

  const noNutrition = nutrition.length === 0
  const noWeight = bodyweight.raw.length === 0

  if (noNutrition && noWeight) {
    return (
      <Empty
        title="No data yet"
        body="Log a few meals and weigh-ins and trends show up here."
      />
    )
  }

  // Same three numbers (macro averages vs goal) feed the linear bars below
  // and the donut/pie rows further down — three shapes, one dataset, so they
  // can be compared side by side.
  const macroItems = [
    { label: 'Protein', value: macroAverages.protein_g, goal: goals.protein, color: '#6E56CF' },
    { label: 'Carbs',   value: macroAverages.carbs_g,   goal: goals.carbs,   color: '#3B9EDB' },
    { label: 'Fat',     value: macroAverages.fat_g,     goal: goals.fat,     color: '#E8A33D' }
  ]
  const formatGrams = (v) => `${Math.round(v)}g`

  return (
    <>
      <section className="mb-6">
        <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-[0.04em] text-label2">
          Calories &amp; macros
        </h2>
        <Card className="p-5">
          {noNutrition ? (
            <p className="py-2 text-[15px] leading-relaxed text-label2">
              Nothing logged in the last 2 weeks.
            </p>
          ) : (
            <>
              <StackedBarChart
                data={dailyMacros.map((d) => ({
                  x: d.label,
                  protein_g: d.protein_g,
                  carbs_g: d.carbs_g,
                  fat_g: d.fat_g,
                  segments: [
                    { value: d.protein_g * 4, color: '#6E56CF' },
                    { value: d.carbs_g * 4,   color: '#3B9EDB' },
                    { value: d.fat_g * 9,     color: '#E8A33D' }
                  ]
                }))}
                goalY={goals.kcal}
                formatY={(v) => `${Math.round(v)} kcal`}
                renderMeta={(d) => `P ${d.protein_g}g · C ${d.carbs_g}g · F ${d.fat_g}g`}
              />
              <MacroLegend />
            </>
          )}
        </Card>
      </section>

      <section className="mb-6">
        <div className="mb-2 flex items-baseline justify-between px-1">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-label2">
            Macro averages
          </h2>
          <span className="text-[13px] text-label2">Daily, last 14 days</span>
        </div>
        <Card className="p-5">
          {noNutrition ? (
            <p className="py-2 text-[15px] leading-relaxed text-label2">
              Nothing logged in the last 2 weeks.
            </p>
          ) : (
            <div className="space-y-3.5">
              <MacroBar label="Protein" value={macroAverages.protein_g} goal={goals.protein} color="#6E56CF" />
              <MacroBar label="Carbs"   value={macroAverages.carbs_g}   goal={goals.carbs}   color="#3B9EDB" />
              <MacroBar label="Fat"     value={macroAverages.fat_g}     goal={goals.fat}     color="#E8A33D" />
            </div>
          )}
        </Card>
      </section>

      {!noNutrition && (
        <>
          <section className="mb-6">
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-label2">
                Macro averages, as donuts
              </h2>
              <span className="text-[13px] text-label2">Same data, compared</span>
            </div>
            <Card className="flex justify-around p-5">
              {macroItems.map((item) => (
                <RadialGauge key={item.label} {...item} variant="donut" formatValue={formatGrams} />
              ))}
            </Card>
          </section>

          <section className="mb-6">
            <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-[0.04em] text-label2">
              Macro averages, as pies
            </h2>
            <Card className="flex justify-around p-5">
              {macroItems.map((item) => (
                <RadialGauge key={item.label} {...item} variant="pie" formatValue={formatGrams} />
              ))}
            </Card>
          </section>
        </>
      )}

      <section className="mb-6">
        <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-[0.04em] text-label2">
          Bodyweight trend
        </h2>
        <Card className="p-5">
          {noWeight ? (
            <p className="py-2 text-[15px] leading-relaxed text-label2">
              Log your weight a few times and a trend appears here.
            </p>
          ) : (
            <>
              {rate && (
                <p className="mb-3 tnum">
                  <span className={`text-[15px] font-semibold ${
                    rate.kgPerWeek > 0 ? 'text-violet' : rate.kgPerWeek < 0 ? 'text-danger' : 'text-label2'
                  }`}>
                    {rate.kgPerWeek > 0 ? '+' : ''}{rate.kgPerWeek} kg
                  </span>
                  <span className="ml-1 text-[13px] font-medium text-label2">/ week</span>
                </p>
              )}
              <LineChart
                series={[
                  { id: 'raw', colorClassName: 'text-label3', style: 'dots', points: bodyweight.raw },
                  { id: 'average', label: '7-day avg', colorClassName: 'text-violet', points: bodyweight.average }
                ].filter((s) => s.points.length > 0)}
                formatY={(v) => `${v} kg`}
              />
            </>
          )}
        </Card>
      </section>
    </>
  )
}

/* --------------------------------------------------------------- shared UI */

function Stat({ value, label, icon }) {
  return (
    <div className="px-2 py-5 text-center">
      {icon && <div className="mb-1.5 flex justify-center">{icon}</div>}
      <p className="text-[26px] font-bold tracking-[-0.02em] tnum">{value}</p>
      <p className="mt-0.5 text-[12px] text-label2">{label}</p>
    </div>
  )
}

/** Color key for the stacked calories/macros chart — a multi-color bar needs
    a legend the way a single-color one never did. */
function MacroLegend() {
  const items = [
    { label: 'Protein', color: '#6E56CF' },
    { label: 'Carbs', color: '#3B9EDB' },
    { label: 'Fat', color: '#E8A33D' }
  ]
  return (
    <div className="mt-3 flex gap-4">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-[12px] text-label2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
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
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 w-full text-violet" preserveAspectRatio="none" aria-hidden="true">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
