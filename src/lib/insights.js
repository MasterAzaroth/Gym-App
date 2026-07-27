import { toISODate, addDays, startOfWeek } from './nutrition'

/** ISO date N days before today — the window-start bound the insights
    dashboards pass to the *Since db.js queries. */
export function daysAgoISO(n) {
  return toISODate(addDays(new Date(), -n))
}

/* --------------------------------------------------------------- overview */

export function computeWeekSummary(workouts) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  const recent = workouts.filter((w) => new Date(w.started_at) >= cutoff)
  return {
    sessions: recent.length,
    sets: recent.reduce((s, w) => s + w.set_count, 0),
    volume: recent.reduce((s, w) => s + w.volume_kg, 0)
  }
}

/** Assumes `metrics` is sorted newest-first, as listBodyMetrics returns it. */
export function computeWeightSnapshot(metrics) {
  const withWeight = metrics.filter((m) => m.weight_kg != null)
  if (withWeight.length < 2) return null
  const newest = withWeight[0]
  const oldest = withWeight[withWeight.length - 1]
  const delta = Number(newest.weight_kg) - Number(oldest.weight_kg)
  const days = Math.max(
    1,
    Math.round((new Date(newest.measured_on) - new Date(oldest.measured_on)) / 86400000)
  )
  return { current: Number(newest.weight_kg), delta: Math.round(delta * 10) / 10, days }
}

export function getTodayEntries(nutrition, todayISO) {
  return nutrition.filter((e) => e.entry_date === todayISO)
}

/** Assumes `workouts` is sorted newest-first, as listWorkoutsSince returns it. */
export function getRecentSessions(workouts, n = 3) {
  return workouts.slice(0, n)
}

/* ---------------------------------------------------------------- training */

function weekLabel(date) {
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

/** Zero-filled Mon-start weekly buckets over the trailing `weeks` weeks,
    oldest first — a week with no sessions still shows up as a zero bar
    rather than disappearing from the axis. */
export function computeWeeklyVolumeTrend(workouts, weeks = 8) {
  const thisWeekStart = startOfWeek(new Date())
  const buckets = new Map()
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = addDays(thisWeekStart, -7 * i)
    buckets.set(toISODate(weekStart), {
      weekStart, label: weekLabel(weekStart), volume: 0, sets: 0, sessions: 0
    })
  }
  for (const w of workouts) {
    const key = toISODate(startOfWeek(new Date(w.started_at)))
    const bucket = buckets.get(key)
    if (!bucket) continue // outside the requested window
    bucket.sessions += 1
    bucket.sets += w.set_count
    bucket.volume += w.volume_kg
  }
  return Array.from(buckets.values())
}

/** Working-set count grouped by muscle group over the trailing `sinceDays`
    days, sorted descending. Counted in sets rather than tonnage (weight ×
    reps) — a heavy compound lift otherwise dwarfs everything else and the
    number stops reflecting how much a muscle group is actually being
    trained. Warm-up sets don't count toward the total. `sets` is the flat
    listSetsSince array, which may span a wider window than `sinceDays` —
    this re-filters down to it. */
export function computeMuscleGroupBreakdown(sets, { sinceDays = 28 } = {}) {
  const cutoff = addDays(new Date(), -sinceDays)
  const totals = new Map()
  for (const s of sets) {
    if (s.is_warmup) continue
    const started = s.workout?.started_at
    if (!started || new Date(started) < cutoff) continue
    const label = s.exercise?.muscle_group || 'Other'
    totals.set(label, (totals.get(label) || 0) + 1)
  }
  return Array.from(totals, ([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

/** Same breakdown as computeMuscleGroupBreakdown, expressed as an average
    per week rather than a raw total — replaces separately showing "total
    sets over 4 weeks" and "total sets this week" with the one number that
    answers both: how many working sets of each muscle you're doing per
    week, on average, right now. Kept to one decimal rather than rounded to
    a whole set, since a 4-week average of small set counts loses too much
    precision otherwise (14 sets over 4 weeks is 3.5/wk, not 4). */
export function computeMuscleGroupWeeklyAvg(sets, { weeks = 4 } = {}) {
  return computeMuscleGroupBreakdown(sets, { sinceDays: weeks * 7 })
    .map((t) => ({ ...t, value: Math.round((t.value / weeks) * 10) / 10 }))
}

// muscle_group is free text (users can add custom exercises with any label),
// so this is a best-effort classification of the labels this app ships with
// rather than an exhaustive enum. Unrecognized labels fall into 'other'.
const UPPER_BODY_GROUPS = new Set([
  'chest', 'back', 'lats', 'shoulders', 'rear delts', 'biceps', 'triceps', 'forearms', 'abs', 'core', 'traps'
])
const LOWER_BODY_GROUPS = new Set([
  'quads', 'hamstrings', 'glutes', 'calves', 'legs', 'posterior', 'adductors', 'abductors'
])

/** Classifies a muscle_group label as 'upper', 'lower', or 'other'
    (case-insensitive) — powers the upper/lower/comparison views of the
    weekly muscle volume chart. */
export function classifyBodyRegion(label) {
  const key = (label || '').trim().toLowerCase()
  if (UPPER_BODY_GROUPS.has(key)) return 'upper'
  if (LOWER_BODY_GROUPS.has(key)) return 'lower'
  return 'other'
}

/** Consecutive calendar days containing at least one finished workout.
    `currentDays` counts back from today, but treats today as "not yet
    broken" if it has no session yet — only a fully missed day ends the
    streak. `longestDays` scans the whole dataset. */
export function computeDailyStreak(workouts) {
  const dayKeys = new Set(workouts.map((w) => toISODate(new Date(w.started_at))))
  if (dayKeys.size === 0) return { currentDays: 0, longestDays: 0 }

  const today = new Date()
  const hasDay = (date) => dayKeys.has(toISODate(date))

  let currentDays = 0
  let cursor = hasDay(today) ? today : addDays(today, -1)
  while (hasDay(cursor)) {
    currentDays += 1
    cursor = addDays(cursor, -1)
  }

  const sortedKeys = Array.from(dayKeys).sort()
  let longestDays = 0
  let runLength = 0
  let prevKey = null
  for (const key of sortedKeys) {
    runLength = prevKey && toISODate(addDays(new Date(prevKey), 1)) === key ? runLength + 1 : 1
    longestDays = Math.max(longestDays, runLength)
    prevKey = key
  }

  return { currentDays, longestDays }
}

/** Exercises with at least 2 qualifying training days in the trailing
    `sinceDays` days, ranked by frequency (distinct days) then volume —
    powers the strength-development exercise picker with the lifts that
    actually have enough history to plot a trend. */
export function rankTrainedExercises(sets, { sinceDays = 90 } = {}) {
  const cutoff = addDays(new Date(), -sinceDays)
  const byExercise = new Map()

  for (const s of sets) {
    if (s.is_warmup) continue
    const started = s.workout?.started_at
    if (!started || new Date(started) < cutoff) continue
    const weight = Number(s.weight_kg) || 0
    const reps = Number(s.reps) || 0
    if (weight <= 0 || reps <= 0) continue
    const exerciseId = s.exercise?.id
    if (!exerciseId) continue

    if (!byExercise.has(exerciseId)) {
      byExercise.set(exerciseId, { id: exerciseId, name: s.exercise?.name ?? 'Exercise', volume: 0, days: new Set() })
    }
    const entry = byExercise.get(exerciseId)
    entry.volume += weight * reps
    entry.days.add(toISODate(new Date(started)))
  }

  return Array.from(byExercise.values())
    .filter((e) => e.days.size >= 2)
    .sort((a, b) => b.days.size - a.days.size || b.volume - a.volume)
    .map((e) => ({ id: e.id, name: e.name }))
}

/** Three views of one exercise's progression, one point per training day
    (that day's heaviest qualifying working set): the actual weight lifted,
    a trailing `averageWindow`-session moving average of it, and the Epley-
    estimated 1RM (weight * (1 + reps/30)) — which can come from a different,
    higher-rep set than the day's heaviest, since a lighter set for more reps
    sometimes implies more raw strength than the top single. */
export function computeStrengthDevelopment(sets, exerciseId, { sinceDays = 90, averageWindow = 3 } = {}) {
  const cutoff = addDays(new Date(), -sinceDays)
  const byDay = new Map()

  for (const s of sets) {
    if (s.is_warmup) continue
    if (s.exercise?.id !== exerciseId) continue
    const started = s.workout?.started_at
    if (!started || new Date(started) < cutoff) continue
    const weight = Number(s.weight_kg) || 0
    const reps = Number(s.reps) || 0
    if (weight <= 0 || reps <= 0) continue

    const dayISO = toISODate(new Date(started))
    const e1rm = weight * (1 + reps / 30)
    const entry = byDay.get(dayISO) ?? { date: new Date(started), weight: 0, e1rm: 0 }
    entry.weight = Math.max(entry.weight, weight)
    entry.e1rm = Math.max(entry.e1rm, e1rm)
    byDay.set(dayISO, entry)
  }

  const days = Array.from(byDay.values()).sort((a, b) => a.date - b.date)

  const actual = days.map((d) => ({ x: d.date, y: Math.round(d.weight * 4) / 4 }))
  const estimate = days.map((d) => ({ x: d.date, y: Math.round(d.e1rm) }))
  const average = days.map((d, i) => {
    const window = days.slice(Math.max(0, i - averageWindow + 1), i + 1)
    const avg = window.reduce((sum, w) => sum + w.weight, 0) / window.length
    return { x: d.date, y: Math.round(avg * 4) / 4 }
  })

  return { actual, average, estimate }
}

/* ---------------------------------------------------------- nutrition & body */

/** Zero-filled daily kcal + macro totals over the trailing `days` days,
    oldest first — a day with nothing logged still shows a zero bar rather
    than disappearing from the axis. Powers the stacked calories/macros
    chart, where each day's bar is split into its protein/carbs/fat
    contribution rather than shown as one flat total. */
export function computeDailyMacros(nutrition, { days = 14 } = {}) {
  const byDate = new Map()
  for (const e of nutrition) {
    const t = byDate.get(e.entry_date) || { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    t.kcal += Number(e.kcal || 0)
    t.protein_g += Number(e.protein_g || 0)
    t.carbs_g += Number(e.carbs_g || 0)
    t.fat_g += Number(e.fat_g || 0)
    byDate.set(e.entry_date, t)
  }
  const today = new Date()
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i)
    const iso = toISODate(date)
    const t = byDate.get(iso) ?? { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    out.push({
      date: iso,
      label: date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      kcal: Math.round(t.kcal),
      protein_g: Math.round(t.protein_g),
      carbs_g: Math.round(t.carbs_g),
      fat_g: Math.round(t.fat_g)
    })
  }
  return out
}

/** Average daily macros over the trailing `days` days, averaged only across
    days that actually have a logged entry — a day you forgot to log
    shouldn't drag the average toward zero. */
export function computeMacroAverages(nutrition, { days = 14 } = {}) {
  const cutoffISO = toISODate(addDays(new Date(), -(days - 1)))
  const byDate = new Map()
  for (const e of nutrition) {
    if (e.entry_date < cutoffISO) continue
    const t = byDate.get(e.entry_date) || { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    t.kcal += Number(e.kcal || 0)
    t.protein_g += Number(e.protein_g || 0)
    t.carbs_g += Number(e.carbs_g || 0)
    t.fat_g += Number(e.fat_g || 0)
    byDate.set(e.entry_date, t)
  }

  const dayTotals = Array.from(byDate.values())
  const n = dayTotals.length || 1
  const sum = dayTotals.reduce(
    (t, d) => ({
      kcal: t.kcal + d.kcal,
      protein_g: t.protein_g + d.protein_g,
      carbs_g: t.carbs_g + d.carbs_g,
      fat_g: t.fat_g + d.fat_g
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  )

  return {
    kcal: Math.round(sum.kcal / n),
    protein_g: Math.round(sum.protein_g / n),
    carbs_g: Math.round(sum.carbs_g / n),
    fat_g: Math.round(sum.fat_g / n),
    daysLogged: dayTotals.length
  }
}

/** Raw bodyweight points plus a trailing simple moving average, both
    ascending by date. The average only starts once `movingAverageDays` of
    history exists — an average of one or two points isn't a smoothed trend,
    it's noise wearing a trend's clothes. */
export function computeBodyweightSeries(metrics, { movingAverageDays = 7 } = {}) {
  const raw = metrics
    .filter((m) => m.weight_kg != null)
    .map((m) => ({ x: new Date(m.measured_on), y: Number(m.weight_kg) }))
    .sort((a, b) => a.x - b.x)

  const average = []
  for (let i = movingAverageDays - 1; i < raw.length; i++) {
    const window = raw.slice(i - movingAverageDays + 1, i + 1)
    const avg = window.reduce((s, p) => s + p.y, 0) / window.length
    average.push({ x: raw[i].x, y: Math.round(avg * 10) / 10 })
  }

  return { raw, average }
}

/** kg/week rate of change via least-squares slope over the smoothed series
    (falling back to raw points if there isn't enough history for one yet) —
    steadier than "newest minus oldest", which a single noisy reading at
    either end can throw off. */
export function computeWeightRate(metrics) {
  const { raw, average } = computeBodyweightSeries(metrics)
  const series = average.length >= 2 ? average : raw
  if (series.length < 2) return null

  const xs = series.map((p) => p.x.getTime())
  const ys = series.map((p) => p.y)
  const n = xs.length
  const meanX = xs.reduce((s, x) => s + x, 0) / n
  const meanY = ys.reduce((s, y) => s + y, 0) / n

  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY)
    den += (xs[i] - meanX) ** 2
  }
  if (den === 0) return null

  const kgPerWeek = (num / den) * 86400000 * 7
  const days = Math.round((xs[n - 1] - xs[0]) / 86400000)
  return { kgPerWeek: Math.round(kgPerWeek * 100) / 100, days }
}
