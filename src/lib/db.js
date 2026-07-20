import { supabase } from './supabase'

/* Every function returns plain data or throws; pages own loading and error state.
   Nothing is mocked — an empty table yields an empty array, which is what the
   empty states are there for. */

const guard = () => {
  if (!supabase) throw new Error('Supabase is not configured.')
}

/* ------------------------------------------------------------------ profile */
export async function getProfile(userId) {
  guard()
  const { data, error } = await supabase
    .from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function updateProfile(userId, patch) {
  guard()
  const { data, error } = await supabase
    .from('profiles').update(patch).eq('id', userId).select().single()
  if (error) throw error
  return data
}

/* ---------------------------------------------------------------- exercises */
export async function listExercises() {
  guard()
  const { data, error } = await supabase.from('exercises').select('*').order('name')
  if (error) throw error
  return data ?? []
}

export async function createExercise(userId, payload) {
  guard()
  const { data, error } = await supabase
    .from('exercises').insert({ ...payload, user_id: userId }).select().single()
  if (error) throw error
  return data
}

/* ----------------------------------------------------------------- routines */
export async function listRoutines(userId) {
  guard()
  const { data, error } = await supabase
    .from('routines')
    .select('*, routine_exercises(id)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => ({
    ...r,
    exercise_count: r.routine_exercises?.length ?? 0
  }))
}

export async function getRoutine(routineId) {
  guard()
  const { data, error } = await supabase
    .from('routines')
    .select('*, routine_exercises(*, exercise:exercises(*), routine_sets(*))')
    .eq('id', routineId)
    .single()
  if (error) throw error
  data.routine_exercises?.sort((a, b) => a.position - b.position)
  for (const re of data.routine_exercises ?? []) {
    re.routine_sets?.sort((a, b) => a.set_index - b.set_index)
  }
  return data
}

export async function createRoutine(userId, name) {
  guard()
  const { data, error } = await supabase
    .from('routines').insert({ user_id: userId, name }).select().single()
  if (error) throw error
  return data
}

export async function renameRoutine(routineId, name) {
  guard()
  const { error } = await supabase.from('routines').update({ name }).eq('id', routineId)
  if (error) throw error
}

export async function deleteRoutine(routineId) {
  guard()
  const { error } = await supabase.from('routines').delete().eq('id', routineId)
  if (error) throw error
}

export async function addRoutineExercise(routineId, exerciseId, position, sets) {
  guard()
  const { data, error } = await supabase
    .from('routine_exercises')
    .insert({ routine_id: routineId, exercise_id: exerciseId, position })
    .select('*, exercise:exercises(*)')
    .single()
  if (error) throw error

  // Sets come from the confirm step the user just went through — see
  // RoutineBuilder's SetsSheet. Fall back to a plain default only if a caller
  // skips that step.
  await replaceRoutineSets(data.id, sets ?? [
    { rep_low: 8, rep_high: 12, rest_seconds: 120, is_warmup: false },
    { rep_low: 8, rep_high: 12, rest_seconds: 120, is_warmup: false },
    { rep_low: 8, rep_high: 12, rest_seconds: 120, is_warmup: false }
  ])

  return data
}

/**
 * Swap an exercise's planned sets wholesale. Simpler and safer than diffing:
 * the sheet edits a local array, then commits it in one go.
 */
export async function replaceRoutineSets(routineExerciseId, rows) {
  guard()
  const { error: delError } = await supabase
    .from('routine_sets').delete().eq('routine_exercise_id', routineExerciseId)
  if (delError) throw delError

  if (!rows.length) return []

  const payload = rows.map((r, i) => ({
    routine_exercise_id: routineExerciseId,
    set_index:        i,
    rep_low:          Number(r.rep_low) || 1,
    rep_high:         Number(r.rep_high) || 1,
    rest_seconds:     Number(r.rest_seconds) || 0,
    is_warmup:        Boolean(r.is_warmup),
    target_weight_kg: r.target_weight_kg === '' || r.target_weight_kg == null
      ? null
      : Number(r.target_weight_kg)
  }))

  const { data, error } = await supabase.from('routine_sets').insert(payload).select()
  if (error) throw error
  return data
}

export async function updateRoutineExercise(id, patch) {
  guard()
  const { error } = await supabase.from('routine_exercises').update(patch).eq('id', id)
  if (error) throw error
}

export async function removeRoutineExercise(id) {
  guard()
  const { error } = await supabase.from('routine_exercises').delete().eq('id', id)
  if (error) throw error
}

/* ----------------------------------------------------------------- workouts */
export async function listWorkouts(userId, limit = 50) {
  guard()
  const { data, error } = await supabase
    .from('workouts')
    .select('*, sets(id, weight_kg, reps, is_warmup)')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(limit)
  if (error) throw error

  return (data ?? []).map((w) => {
    const working = (w.sets ?? []).filter((s) => !s.is_warmup)
    const volume = working.reduce(
      (sum, s) => sum + (Number(s.weight_kg) || 0) * (Number(s.reps) || 0), 0
    )
    const minutes = w.finished_at
      ? Math.round((new Date(w.finished_at) - new Date(w.started_at)) / 60000)
      : null
    return { ...w, set_count: working.length, volume_kg: Math.round(volume), minutes }
  })
}

export async function getWorkout(workoutId) {
  guard()
  const { data, error } = await supabase
    .from('workouts')
    .select('*, sets(*, exercise:exercises(name, muscle_group))')
    .eq('id', workoutId)
    .single()
  if (error) throw error
  data.sets?.sort((a, b) => a.set_index - b.set_index)
  return data
}

/** The one workout a user can have in flight — started, not yet finished.
    Training checks this on load so a session survives backgrounding the app
    mid-workout instead of getting silently orphaned. */
export async function getActiveWorkout(userId) {
  guard()
  const { data, error } = await supabase
    .from('workouts')
    .select('*, routine:routines(name)')
    .eq('user_id', userId)
    .is('finished_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createWorkout(userId, routineId, name) {
  guard()
  const { data, error } = await supabase
    .from('workouts')
    .insert({ user_id: userId, routine_id: routineId, name })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function finishWorkout(workoutId) {
  guard()
  const { data, error } = await supabase
    .from('workouts')
    .update({ finished_at: new Date().toISOString() })
    .eq('id', workoutId)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Abandons a workout entirely (e.g. started by mistake) — cascades to its sets. */
export async function deleteWorkout(workoutId) {
  guard()
  const { error } = await supabase.from('workouts').delete().eq('id', workoutId)
  if (error) throw error
}

export async function addSet(workoutId, exerciseId, setIndex, payload) {
  guard()
  const { data, error } = await supabase
    .from('sets')
    .insert({
      workout_id: workoutId,
      exercise_id: exerciseId,
      set_index: setIndex,
      weight_kg: payload.weight_kg,
      reps: payload.reps,
      rpe: payload.rpe ?? null,
      is_warmup: Boolean(payload.is_warmup)
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSet(setId, patch) {
  guard()
  const { data, error } = await supabase
    .from('sets').update(patch).eq('id', setId).select().single()
  if (error) throw error
  return data
}

export async function deleteSet(setId) {
  guard()
  const { error } = await supabase.from('sets').delete().eq('id', setId)
  if (error) throw error
}

/* ---------------------------------------------------------------- nutrition */
export async function listFoods(query = '') {
  guard()
  let q = supabase.from('foods').select('*').order('name').limit(40)
  if (query.trim()) q = q.ilike('name', `%${query.trim()}%`)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function createFood(userId, payload) {
  guard()
  const { data, error } = await supabase
    .from('foods').insert({ ...payload, user_id: userId }).select().single()
  if (error) throw error
  return data
}

export async function listNutrition(userId, isoDate) {
  guard()
  const { data, error } = await supabase
    .from('nutrition_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('entry_date', isoDate)
    .order('logged_time')
  if (error) throw error
  return data ?? []
}

export async function addNutritionEntry(userId, entry) {
  guard()
  const { data, error } = await supabase
    .from('nutrition_entries').insert({ ...entry, user_id: userId }).select().single()
  if (error) throw error
  return data
}

export async function updateNutritionEntry(id, patch) {
  guard()
  const { data, error } = await supabase
    .from('nutrition_entries').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteNutritionEntry(id) {
  guard()
  const { error } = await supabase.from('nutrition_entries').delete().eq('id', id)
  if (error) throw error
}

/* ------------------------------------------------------------- body metrics */
export async function listBodyMetrics(userId, limit = 60) {
  guard()
  const { data, error } = await supabase
    .from('body_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('measured_on', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function upsertBodyMetric(userId, measured_on, patch) {
  guard()
  const { data, error } = await supabase
    .from('body_metrics')
    .upsert({ user_id: userId, measured_on, ...patch }, { onConflict: 'user_id,measured_on' })
    .select().single()
  if (error) throw error
  return data
}
