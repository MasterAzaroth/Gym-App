import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Spinner, ErrorNote } from '../components/ui'
import {
  getWorkout, getRoutine, finishWorkout, deleteWorkout, addSet, updateSet, deleteSet
} from '../lib/db'

export default function ActiveWorkout() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [workout, setWorkout] = useState(null)
  const [routine, setRoutine] = useState(null)
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [finishing, setFinishing] = useState(false)
  const [pendingExtra, setPendingExtra] = useState({}) // { [exerciseId]: number[] } — added but not yet logged
  const [activeExerciseId, setActiveExerciseId] = useState(null)

  const timer = useRestTimer()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const w = await getWorkout(id)
      setWorkout(w)
      setSets(w.sets ?? [])
      if (w.routine_id) {
        // A missing/deleted routine shouldn't block logging against what's
        // already there — the plan is a guide, not a requirement.
        try { setRoutine(await getRoutine(w.routine_id)) } catch { setRoutine(null) }
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const exercises = useMemo(() => buildExercises(routine, sets, pendingExtra), [routine, sets, pendingExtra])

  // Default to the first exercise once the plan loads, without stomping on
  // whichever tab the user has already switched to.
  useEffect(() => {
    if (exercises.length && activeExerciseId == null) setActiveExerciseId(exercises[0].exerciseId)
  }, [exercises, activeExerciseId])

  const activeIndex = exercises.findIndex((e) => e.exerciseId === activeExerciseId)
  const activeExercise = exercises[activeIndex] ?? exercises[0] ?? null
  const nextExercise = exercises[activeIndex + 1] ?? null

  async function logSet(exerciseId, setIndex, values, plan) {
    const saved = await addSet(workout.id, exerciseId, setIndex, values)
    setSets((s) => [...s, saved])
    setPendingExtra((p) => ({
      ...p,
      [exerciseId]: (p[exerciseId] ?? []).filter((i) => i !== setIndex)
    }))
    const restSeconds = plan?.rest_seconds ?? (values.is_warmup ? 60 : 120)
    timer.start(restSeconds)
  }

  async function editSet(setId, patch) {
    const updated = await updateSet(setId, patch)
    setSets((s) => s.map((x) => (x.id === setId ? updated : x)))
  }

  async function removeSet(setId) {
    await deleteSet(setId)
    setSets((s) => s.filter((x) => x.id !== setId))
  }

  function addSlot(exerciseId, setIndex) {
    setPendingExtra((p) => ({ ...p, [exerciseId]: [...(p[exerciseId] ?? []), setIndex] }))
  }

  async function finish() {
    if (!confirm('Finish this workout?')) return
    setFinishing(true)
    try {
      await finishWorkout(workout.id)
      navigate(`/train/workout/${workout.id}`, { replace: true })
    } catch (e) {
      setError(e.message)
      setFinishing(false)
    }
  }

  async function cancelWorkout() {
    if (!confirm('Cancel this workout? Everything logged so far will be deleted.')) return
    try {
      await deleteWorkout(workout.id)
      navigate('/train', { replace: true })
    } catch (e) {
      setError(e.message)
    }
  }

  if (loading) return <Spinner />
  if (error && !workout) return <ErrorNote error={error} onRetry={load} />

  return (
    <>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-label2">In progress</p>
          <h1 className="truncate text-[28px] font-bold tracking-[-0.02em]">
            {workout.name ?? 'Workout'}
          </h1>
          <p className="mt-0.5 text-[13px] text-label2 tnum">
            <ElapsedMinutes since={workout.started_at} /> min
          </p>
        </div>
        <button onClick={cancelWorkout} className="shrink-0 text-[15px] text-danger">
          Cancel
        </button>
      </div>

      {error && <div className="mb-4"><ErrorNote error={error} /></div>}

      {/* One exercise on screen at a time — the row above is the way through
          the workout, not a table of contents. */}
      <div className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1">
        {exercises.map((ex) => (
          <ExerciseTab
            key={ex.exerciseId}
            exercise={ex}
            active={ex.exerciseId === activeExercise?.exerciseId}
            done={isExerciseDone(ex)}
            onClick={() => setActiveExerciseId(ex.exerciseId)}
          />
        ))}
      </div>

      {activeExercise && (
        <ExercisePanel
          exercise={activeExercise}
          nextExercise={nextExercise}
          onLog={logSet}
          onEdit={editSet}
          onRemove={removeSet}
          onAddSlot={addSlot}
          onNext={() => setActiveExerciseId(nextExercise.exerciseId)}
        />
      )}

      <div className="mt-6">
        <Button onClick={finish} disabled={finishing}>
          {finishing ? 'Finishing…' : 'Finish workout'}
        </Button>
      </div>

      {timer.active && (
        <div className="sticky bottom-0 z-10 -mx-5 mt-4 border-t border-separator bg-fill/95 px-5 py-3 backdrop-blur-sm">
          <div className="mx-auto flex max-w-md items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-label2">Rest</p>
              <p className="text-[22px] font-bold tnum">{formatClock(timer.remaining)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => timer.addTime(15)}
                className="rounded-lg bg-surface px-3 py-2 text-[13px] font-semibold text-violet shadow-card"
              >
                +15s
              </button>
              <button
                onClick={timer.stop}
                className="rounded-lg bg-surface px-3 py-2 text-[13px] font-semibold text-label2 shadow-card"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ------------------------------------------------------------------- plan merge */

/** One card per exercise, in routine order; any exercise with logged sets but
    no matching plan (a deleted routine, most likely) is appended at the end. */
function buildExercises(routine, workoutSets, pendingExtra) {
  const loggedByExercise = new Map()
  for (const s of workoutSets) {
    if (!loggedByExercise.has(s.exercise_id)) loggedByExercise.set(s.exercise_id, [])
    loggedByExercise.get(s.exercise_id).push(s)
  }

  const slotsFor = (exerciseId, plannedSets) => {
    const logged = loggedByExercise.get(exerciseId) ?? []
    const planned = plannedSets.map((rs) => ({
      key: `p${rs.set_index}`,
      setIndex: rs.set_index,
      plan: rs,
      logged: logged.find((s) => s.set_index === rs.set_index) ?? null
    }))
    const plannedMax = planned.length ? Math.max(...planned.map((p) => p.setIndex)) : -1
    const extraLogged = logged
      .filter((s) => s.set_index > plannedMax)
      .map((s) => ({ key: `e${s.set_index}`, setIndex: s.set_index, plan: null, logged: s }))
    const extraPending = (pendingExtra[exerciseId] ?? [])
      .filter((i) => !logged.some((s) => s.set_index === i))
      .map((i) => ({ key: `n${i}`, setIndex: i, plan: null, logged: null }))
    return [...planned, ...extraLogged, ...extraPending].sort((a, b) => a.setIndex - b.setIndex)
  }

  const result = []
  const seen = new Set()

  for (const re of routine?.routine_exercises ?? []) {
    seen.add(re.exercise_id)
    result.push({
      exerciseId: re.exercise_id,
      exerciseName: re.exercise?.name ?? 'Exercise',
      slots: slotsFor(re.exercise_id, re.routine_sets ?? [])
    })
  }

  for (const [exerciseId, logged] of loggedByExercise) {
    if (seen.has(exerciseId)) continue
    result.push({
      exerciseId,
      exerciseName: logged[0]?.exercise?.name ?? 'Exercise',
      slots: slotsFor(exerciseId, [])
    })
  }

  return result
}

/** Every planned set for the exercise is logged — the rest of a workout run
    is just working through this becoming true for each tab in turn. */
function isExerciseDone(exercise) {
  const planned = exercise.slots.filter((s) => s.plan)
  return planned.length > 0 && planned.every((s) => s.logged)
}

/** "Lat pulldown" -> "LP", "Dip" -> "DI". Two letters read as a badge at a
    glance; a full name at that size doesn't. */
function initials(name) {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return (words[0]?.slice(0, 2) ?? '??').toUpperCase()
}

/* ----------------------------------------------------------------- exercise tab */

function ExerciseTab({ exercise, active, done, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={exercise.exerciseName}
      aria-current={active ? 'true' : undefined}
      className={[
        'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold tnum transition-colors',
        active ? 'bg-violet text-white' : done ? 'bg-violet-soft text-violet' : 'bg-surface text-label2 shadow-card'
      ].join(' ')}
    >
      {initials(exercise.exerciseName)}
      {done && !active && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-violet text-white">
          <CheckIcon size={8} />
        </span>
      )}
    </button>
  )
}

/* --------------------------------------------------------------- exercise panel */

function ExercisePanel({ exercise, nextExercise, onLog, onEdit, onRemove, onAddSlot, onNext }) {
  const nextIndex = exercise.slots.length
    ? Math.max(...exercise.slots.map((s) => s.setIndex)) + 1
    : 0

  return (
    <Card className="p-4">
      <h3 className="text-[20px] font-semibold">{exercise.exerciseName}</h3>
      <div className="mt-3 space-y-2">
        {exercise.slots.map((slot) => (
          <SetRow
            key={slot.key}
            slot={slot}
            exerciseId={exercise.exerciseId}
            onLog={onLog}
            onEdit={onEdit}
            onRemove={onRemove}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={() => onAddSlot(exercise.exerciseId, nextIndex)}
          className="text-[13px] font-medium text-violet"
        >
          + Add set
        </button>
        {nextExercise && (
          <button
            onClick={onNext}
            className="flex items-center gap-1 text-[13px] font-medium text-label2"
          >
            Next: {nextExercise.exerciseName}
            <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
    </Card>
  )
}

function SetRow({ slot, exerciseId, onLog, onEdit, onRemove }) {
  const [forceEdit, setForceEdit] = useState(false)

  if (slot.logged && !forceEdit) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-fill px-3 py-2.5">
        <button onClick={() => setForceEdit(true)} className="flex flex-1 items-baseline gap-3 text-left">
          <span className="w-16 shrink-0 text-[13px] font-medium text-label2">
            {slot.plan?.is_warmup ? 'Warm-up' : `Set ${slot.setIndex + 1}`}
          </span>
          <span className="text-[15px] font-semibold tnum">
            {slot.logged.weight_kg ?? 0} kg × {slot.logged.reps ?? 0}
          </span>
        </button>
        <button
          onClick={() => onRemove(slot.logged.id)}
          aria-label="Remove set"
          className="px-2 text-[16px] text-label3 transition-colors hover:text-danger"
        >
          ×
        </button>
      </div>
    )
  }

  return (
    <SetInputRow
      slot={slot}
      exerciseId={exerciseId}
      onLog={onLog}
      onEdit={onEdit}
      onDone={() => setForceEdit(false)}
    />
  )
}

function SetInputRow({ slot, exerciseId, onLog, onEdit, onDone }) {
  const [weight, setWeight] = useState(slot.logged?.weight_kg ?? slot.plan?.target_weight_kg ?? '')
  const [reps, setReps] = useState(slot.logged?.reps ?? '')
  const [busy, setBusy] = useState(false)

  const isWarmup = slot.plan?.is_warmup ?? false
  const targetLabel = slot.plan
    ? (slot.plan.rep_low === slot.plan.rep_high ? `${slot.plan.rep_low}` : `${slot.plan.rep_low}–${slot.plan.rep_high}`)
    : null

  async function confirm() {
    setBusy(true)
    try {
      const values = {
        weight_kg: weight === '' ? null : Number(weight),
        reps:      reps === ''   ? null : Number(reps),
        is_warmup: isWarmup
      }
      if (slot.logged) await onEdit(slot.logged.id, values)
      else await onLog(exerciseId, slot.setIndex, values, slot.plan)
      onDone()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`rounded-lg p-2.5 ${isWarmup ? 'bg-fill' : 'bg-surface shadow-card'}`}>
      <div className="flex items-center gap-2">
        <span className="w-16 shrink-0 text-[13px] font-medium text-label2">
          {isWarmup ? 'Warm-up' : `Set ${slot.setIndex + 1}`}
        </span>
        <input
          type="number" inputMode="decimal" placeholder="kg"
          value={weight} onChange={(e) => setWeight(e.target.value)}
          className="w-16 rounded-lg bg-fill px-2 py-1.5 text-center text-[15px] tnum focus:outline-none focus:ring-2 focus:ring-violet"
        />
        <span className="text-label3">×</span>
        <input
          type="number" inputMode="numeric" placeholder={targetLabel ?? 'reps'}
          value={reps} onChange={(e) => setReps(e.target.value)}
          className="w-14 rounded-lg bg-fill px-2 py-1.5 text-center text-[15px] tnum focus:outline-none focus:ring-2 focus:ring-violet"
        />
        <button
          onClick={confirm}
          disabled={busy || weight === '' || reps === ''}
          aria-label="Log set"
          className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet text-white disabled:opacity-40"
        >
          <CheckIcon />
        </button>
      </div>
      {targetLabel && (
        <p className="mt-1 pl-[72px] text-[11px] text-label3">
          Target {targetLabel} reps{slot.plan?.target_weight_kg ? ` · ${slot.plan.target_weight_kg} kg` : ''}
        </p>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------- rest timer */

/** Counts down from an absolute end-time rather than decrementing a counter,
    so it stays correct if the tab is backgrounded and JS timers get throttled. */
function useRestTimer() {
  const [endAt, setEndAt] = useState(null)
  const [now, setNow] = useState(Date.now())
  const firedRef = useRef(false)

  useEffect(() => {
    if (!endAt) return
    firedRef.current = false
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [endAt])

  const remaining = endAt ? Math.max(0, Math.ceil((endAt - now) / 1000)) : 0

  useEffect(() => {
    if (endAt && remaining === 0 && !firedRef.current) {
      firedRef.current = true
      navigator.vibrate?.(200)
    }
  }, [remaining, endAt])

  return {
    active: Boolean(endAt),
    remaining,
    start: (seconds) => setEndAt(Date.now() + seconds * 1000),
    stop: () => setEndAt(null),
    addTime: (delta) => setEndAt((e) => (e ? e + delta * 1000 : e))
  }
}

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function ElapsedMinutes({ since }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])
  return Math.max(0, Math.round((now - new Date(since).getTime()) / 60000))
}

function CheckIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
