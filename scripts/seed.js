// One-off script: fills your Supabase project with realistic training,
// nutrition, and bodyweight history so the Insights tab has something to
// show. Signs in as a real user (same auth flow the app uses, just from
// Node) and inserts rows under that account through the normal anon-key
// client — RLS applies exactly as it does in the app.
//
// Setup:
//   1. Fill in .env.local: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
//      SEED_EMAIL, SEED_PASSWORD.
//   2. npm run seed
//
// Re-running: bodyweight logs upsert cleanly (one per day). Workouts/sets
// and nutrition entries don't, so the script refuses to run if it finds
// existing workouts in the seed window — delete them first, or set
// SEED_FORCE=true to insert on top anyway.

import { readFileSync, existsSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

loadEnvLocal()

// Supabase wants the bare project origin — https://xxxx.supabase.co — and
// appends its own paths (/auth/v1/..., /rest/v1/...). Mirrors the same
// normalization src/lib/supabase.js does for the browser client.
function toOrigin(value) {
  const raw = (value ?? '').trim()
  if (!raw) return ''
  try {
    return new URL(raw).origin
  } catch {
    return raw.replace(/\/+$/, '')
  }
}

const SUPABASE_URL = toOrigin(process.env.VITE_SUPABASE_URL)
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const EMAIL = process.env.SEED_EMAIL
const PASSWORD = process.env.SEED_PASSWORD
const FORCE = process.env.SEED_FORCE === 'true'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !EMAIL || !PASSWORD) {
  console.error(
    'Missing config. Fill in .env.local: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SEED_EMAIL, SEED_PASSWORD.'
  )
  process.exit(1)
}

function loadEnvLocal() {
  const path = new URL('../.env.local', import.meta.url)
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (!(key in process.env)) process.env[key] = value
  }
}

const WEEKS = 5
const DAYS = WEEKS * 7

const rand = (min, max) => Math.random() * (max - min) + min
const randInt = (min, max) => Math.round(rand(min, max))

function daysAgo(n, hour = 18, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, minute, 0, 0)
  return d
}

function isoDate(d) {
  return d.toISOString().slice(0, 10)
}

/* --------------------------------------------------------- training plan */

// Keys map to exercise names already seeded in supabase/schema.sql's shared
// library (user_id null) — the script looks these up rather than creating
// its own exercises.
const EXERCISES = {
  squat: 'Barbell back squat',
  bench: 'Barbell bench press',
  deadlift: 'Conventional deadlift',
  ohp: 'Overhead press',
  row: 'Barbell row',
  rdl: 'Romanian deadlift',
  pullup: 'Pull-up',
  dip: 'Dip',
  incline: 'Incline dumbbell press',
  lateral: 'Lateral raise',
  legpress: 'Leg press',
  legcurl: 'Leg curl',
  latpulldown: 'Lat pulldown',
  cablefly: 'Cable fly',
  facepull: 'Face pull',
  curl: 'Barbell curl',
  pushdown: 'Triceps pushdown',
  calfraise: 'Standing calf raise'
}

// Starting weight (kg) and per-week progression for each lift in the plan.
const PROGRESSION = {
  squat: { start: 80, perWeek: 2.5, reps: [5, 8] },
  bench: { start: 60, perWeek: 1.25, reps: [6, 9] },
  deadlift: { start: 110, perWeek: 2.5, reps: [4, 6] },
  ohp: { start: 40, perWeek: 1.25, reps: [6, 9] },
  row: { start: 55, perWeek: 1.25, reps: [8, 10] },
  rdl: { start: 70, perWeek: 1.25, reps: [8, 10] },
  pullup: { start: 5, perWeek: 1.25, reps: [6, 10] },
  dip: { start: 10, perWeek: 1.25, reps: [8, 12] },
  incline: { start: 22, perWeek: 1, reps: [8, 12] },
  lateral: { start: 8, perWeek: 0.5, reps: [12, 15] },
  legpress: { start: 140, perWeek: 5, reps: [8, 12] },
  legcurl: { start: 35, perWeek: 1.25, reps: [10, 12] },
  latpulldown: { start: 50, perWeek: 1.25, reps: [8, 12] },
  cablefly: { start: 15, perWeek: 0.5, reps: [10, 15] },
  facepull: { start: 20, perWeek: 0.5, reps: [12, 15] },
  curl: { start: 30, perWeek: 1, reps: [8, 12] },
  pushdown: { start: 25, perWeek: 1, reps: [10, 12] },
  calfraise: { start: 60, perWeek: 2.5, reps: [12, 15] }
}

// Weekly split — which lifts fall on which day-of-week (0=Sun..6=Sat).
const SPLIT = {
  1: ['bench', 'ohp', 'incline', 'lateral', 'pushdown'], // Mon: Push day
  2: ['row', 'pullup', 'latpulldown', 'facepull', 'curl'], // Tue: Pull day
  4: ['squat', 'rdl', 'legpress', 'legcurl', 'calfraise'], // Thu: Leg day
  6: ['deadlift', 'bench', 'row', 'cablefly', 'dip'] // Sat: Full body
}
const DAY_NAMES = { 1: 'Push day', 2: 'Pull day', 4: 'Leg day', 6: 'Full body' }

function weightForWeek(key, weekIndex) {
  const p = PROGRESSION[key]
  return Math.round((p.start + p.perWeek * weekIndex) * 4) / 4 // nearest 0.25kg
}

async function seedTraining(supabase, userId, exerciseIds) {
  const plannedWorkouts = []

  for (let dayOffset = DAYS; dayOffset >= 1; dayOffset--) {
    const date = daysAgo(dayOffset)
    const dow = date.getDay()
    const lifts = SPLIT[dow]
    if (!lifts) continue

    const weekIndex = Math.floor((DAYS - dayOffset) / 7)
    const started = daysAgo(dayOffset, randInt(17, 19), randInt(0, 59))

    const setsPayload = []
    let setIndex = 0
    for (const key of lifts) {
      const p = PROGRESSION[key]
      const weight = weightForWeek(key, weekIndex)
      const exerciseId = exerciseIds[EXERCISES[key]]
      if (!exerciseId) continue

      if (['squat', 'bench', 'deadlift', 'ohp'].includes(key)) {
        setsPayload.push({
          exercise_id: exerciseId,
          set_index: setIndex++,
          weight_kg: Math.round(weight * 0.5 * 4) / 4,
          reps: 5,
          rpe: 5,
          is_warmup: true
        })
      }

      for (let s = 0; s < 3; s++) {
        const reps = randInt(p.reps[0], p.reps[1])
        const rpe = Math.min(10, 6 + s + rand(-0.5, 1))
        setsPayload.push({
          exercise_id: exerciseId,
          set_index: setIndex++,
          weight_kg: weight,
          reps,
          rpe: Math.round(rpe * 2) / 2,
          is_warmup: false
        })
      }
    }

    const minutes = randInt(45, 75)
    const finished = new Date(started.getTime() + minutes * 60000)
    plannedWorkouts.push({ started, finished, name: DAY_NAMES[dow], sets: setsPayload })
  }

  for (const w of plannedWorkouts) {
    const { data: workout, error } = await supabase
      .from('workouts')
      .insert({
        user_id: userId,
        name: w.name,
        started_at: w.started.toISOString(),
        finished_at: w.finished.toISOString()
      })
      .select()
      .single()
    if (error) throw error

    const rows = w.sets.map((s) => ({ ...s, workout_id: workout.id }))
    const { error: setError } = await supabase.from('sets').insert(rows)
    if (setError) throw setError
  }

  return plannedWorkouts.length
}

/* --------------------------------------------------------------- nutrition */

// Per-100g macros, matching entries already seeded in supabase/schema-v2.sql.
const FOODS = {
  oats: { name: 'Rolled oats, dry', kcal: 379, protein: 13.2, carbs: 67.7, fat: 6.5 },
  egg: { name: 'Whole egg', kcal: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  chicken: { name: 'Chicken breast, cooked', kcal: 165, protein: 31.0, carbs: 0.0, fat: 3.6 },
  rice: { name: 'White rice, cooked', kcal: 130, protein: 2.7, carbs: 28.2, fat: 0.3 },
  broccoli: { name: 'Broccoli, raw', kcal: 34, protein: 2.8, carbs: 6.6, fat: 0.4 },
  whey: { name: 'Whey protein powder', kcal: 380, protein: 78.0, carbs: 8.0, fat: 5.0 },
  banana: { name: 'Banana', kcal: 89, protein: 1.1, carbs: 22.8, fat: 0.3 },
  salmon: { name: 'Salmon fillet', kcal: 208, protein: 20.4, carbs: 0.0, fat: 13.4 },
  sweetpotato: { name: 'Sweet potato, raw', kcal: 86, protein: 1.6, carbs: 20.1, fat: 0.1 },
  almonds: { name: 'Almonds', kcal: 579, protein: 21.2, carbs: 21.6, fat: 49.9 }
}

const BASE_MEALS = [
  { time: '07:30', food: FOODS.oats, baseGrams: 70 },
  { time: '07:35', food: FOODS.egg, baseGrams: 110 },
  { time: '12:30', food: FOODS.chicken, baseGrams: 180 },
  { time: '12:30', food: FOODS.rice, baseGrams: 220 },
  { time: '12:35', food: FOODS.broccoli, baseGrams: 150 },
  { time: '16:00', food: FOODS.whey, baseGrams: 32 },
  { time: '16:00', food: FOODS.banana, baseGrams: 120 },
  { time: '19:30', food: FOODS.salmon, baseGrams: 160 },
  { time: '19:30', food: FOODS.sweetpotato, baseGrams: 200 },
  { time: '21:00', food: FOODS.almonds, baseGrams: 25 }
]

function macrosFor(food, grams) {
  const f = grams / 100
  return {
    kcal: Math.round(food.kcal * f),
    protein_g: Math.round(food.protein * f * 10) / 10,
    carbs_g: Math.round(food.carbs * f * 10) / 10,
    fat_g: Math.round(food.fat * f * 10) / 10
  }
}

async function seedNutrition(supabase, userId, goals) {
  const baselineKcal = BASE_MEALS.reduce(
    (s, m) => s + macrosFor(m.food, m.baseGrams).kcal,
    0
  )
  const scale = Math.min(1.6, Math.max(0.7, goals.kcal / baselineKcal))

  const rows = []
  for (let dayOffset = DAYS; dayOffset >= 0; dayOffset--) {
    if (Math.random() < 0.08) continue // the occasional day you forget to log
    const entryDate = isoDate(daysAgo(dayOffset))
    const dayVariance = rand(0.9, 1.1)

    for (const m of BASE_MEALS) {
      const grams = Math.round(m.baseGrams * scale * dayVariance)
      const macro = macrosFor(m.food, grams)
      rows.push({
        user_id: userId,
        entry_date: entryDate,
        logged_time: m.time,
        name: m.food.name,
        grams,
        ...macro
      })
    }
  }

  const { error } = await supabase.from('nutrition_entries').insert(rows)
  if (error) throw error
  return rows.length
}

/* ------------------------------------------------------------ bodyweight */

async function seedBodyMetrics(supabase, userId) {
  const startWeight = 84
  const endWeight = 81.5

  const rows = []
  for (let dayOffset = DAYS; dayOffset >= 0; dayOffset--) {
    if (Math.random() < 0.25) continue // logged most days, not every day
    const t = (DAYS - dayOffset) / DAYS
    const trend = startWeight + (endWeight - startWeight) * t
    const weight = Math.round((trend + rand(-0.4, 0.4)) * 10) / 10
    rows.push({
      user_id: userId,
      measured_on: isoDate(daysAgo(dayOffset)),
      weight_kg: weight
    })
  }

  const { error } = await supabase
    .from('body_metrics')
    .upsert(rows, { onConflict: 'user_id,measured_on' })
  if (error) throw error
  return rows.length
}

/* ----------------------------------------------------------------- main */

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD
  })
  if (signInError) {
    console.error('Sign-in failed:', signInError.message)
    process.exit(1)
  }
  const userId = signIn.user.id
  console.log(`Signed in as ${EMAIL}.`)

  if (!FORCE) {
    const since = daysAgo(DAYS).toISOString()
    const { count, error } = await supabase
      .from('workouts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('started_at', since)
    if (error) throw error
    if (count > 0) {
      console.error(
        `Found ${count} existing workout(s) in the last ${DAYS} days. Refusing to reseed on top ` +
          'of real data. Delete them first, or re-run with SEED_FORCE=true to insert anyway.'
      )
      process.exit(1)
    }
  }

  const names = Object.values(EXERCISES)
  const { data: exercises, error: exError } = await supabase
    .from('exercises')
    .select('id, name')
    .in('name', names)
    .is('user_id', null)
  if (exError) throw exError
  const exerciseIds = Object.fromEntries(exercises.map((e) => [e.name, e.id]))
  const missing = names.filter((n) => !exerciseIds[n])
  if (missing.length) {
    console.error(
      'Missing exercises in the shared library (run supabase/schema.sql first):',
      missing.join(', ')
    )
    process.exit(1)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  const goals = {
    kcal: profile?.goal_kcal ?? 2500,
    protein: profile?.goal_protein_g ?? 180,
    carbs: profile?.goal_carbs_g ?? 280,
    fat: profile?.goal_fat_g ?? 80
  }

  const workoutCount = await seedTraining(supabase, userId, exerciseIds)
  console.log(`Seeded ${workoutCount} workouts.`)

  const nutritionCount = await seedNutrition(supabase, userId, goals)
  console.log(`Seeded ${nutritionCount} nutrition entries.`)

  const bodyMetricCount = await seedBodyMetrics(supabase, userId)
  console.log(`Seeded ${bodyMetricCount} bodyweight logs.`)

  console.log('Done — open the Insights tab.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
