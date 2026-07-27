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

/** Working-set volume grouped by muscle group over the trailing `sinceDays`
    days, sorted descending. `sets` is the flat listSetsSince array, which may
    span a wider window than `sinceDays` — this re-filters down to it. */
export function computeMuscleGroupBreakdown(sets, { sinceDays = 28 } = {}) {
  const cutoff = addDays(new Date(), -sinceDays)
  const totals = new Map()
  for (const s of sets) {
    if (s.is_warmup) continue
    const started = s.workout?.started_at
    if (!started || new Date(started) < cutoff) continue
    const label = s.exercise?.muscle_group || 'Other'
    const volume = (Number(s.weight_kg) || 0) * (Number(s.reps) || 0)
    totals.set(label, (totals.get(label) || 0) + volume)
  }
  return Array.from(totals, ([label, value]) => ({ label, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
}

/** Consecutive Mon–Sun weeks containing at least one finished workout.
    `currentWeeks` counts back from this week, but treats a week still in
    progress as "not yet broken" if it has no session yet — only a fully
    missed week ends the streak. `longestWeeks` scans the whole dataset. */
export function computeStreak(workouts) {
  const weekKeys = new Set(
    workouts.map((w) => toISODate(startOfWeek(new Date(w.started_at))))
  )
  if (weekKeys.size === 0) return { currentWeeks: 0, longestWeeks: 0 }

  const thisWeekStart = startOfWeek(new Date())
  const hasWeek = (weekStart) => weekKeys.has(toISODate(weekStart))

  let currentWeeks = 0
  let cursor = hasWeek(thisWeekStart) ? thisWeekStart : addDays(thisWeekStart, -7)
  while (hasWeek(cursor)) {
    currentWeeks += 1
    cursor = addDays(cursor, -7)
  }

  const sortedKeys = Array.from(weekKeys).sort()
  let longestWeeks = 0
  let runLength = 0
  let prevKey = null
  for (const key of sortedKeys) {
    runLength = prevKey && toISODate(addDays(new Date(prevKey), 7)) === key ? runLength + 1 : 1
    longestWeeks = Math.max(longestWeeks, runLength)
    prevKey = key
  }

  return { currentWeeks, longestWeeks }
}

/** Estimated 1RM (Epley: weight * (1 + reps/30)) trend for the exercises
    trained most often in the trailing `sinceDays` days. Ranks by distinct
    training days (frequency), tie-broken by total volume, and drops any
    exercise with fewer than 2 qualifying days since a single point isn't a
    trend. One point per day: that day's best working-set estimate. */
export function computeEstimated1RmTrend(sets, { topN = 3, sinceDays = 90 } = {}) {
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
      byExercise.set(exerciseId, { label: s.exercise?.name ?? 'Exercise', volume: 0, dayMax: new Map() })
    }
    const entry = byExercise.get(exerciseId)
    entry.volume += weight * reps

    const dayISO = toISODate(new Date(started))
    const e1rm = weight * (1 + reps / 30)
    const prev = entry.dayMax.get(dayISO)
    if (!prev || e1rm > prev.e1rm) entry.dayMax.set(dayISO, { date: new Date(started), e1rm })
  }

  return Array.from(byExercise, ([id, e]) => ({ id, ...e }))
    .filter((e) => e.dayMax.size >= 2)
    .sort((a, b) => b.dayMax.size - a.dayMax.size || b.volume - a.volume)
    .slice(0, topN)
    .map((e) => ({
      id: e.id,
      label: e.label,
      points: Array.from(e.dayMax.values())
        .sort((a, b) => a.date - b.date)
        .map((d) => ({ x: d.date, y: Math.round(d.e1rm) }))
    }))
}

/* ---------------------------------------------------------- nutrition & body */

/** Zero-filled daily calorie totals over the trailing `days` days, oldest
    first — a day with nothing logged still shows a zero bar. */
export function computeDailyCalories(nutrition, { days = 14 } = {}) {
  const byDate = new Map()
  for (const e of nutrition) {
    byDate.set(e.entry_date, (byDate.get(e.entry_date) || 0) + Number(e.kcal || 0))
  }
  const today = new Date()
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i)
    const iso = toISODate(date)
    out.push({
      date: iso,
      label: date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      kcal: Math.round(byDate.get(iso) ?? 0)
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
