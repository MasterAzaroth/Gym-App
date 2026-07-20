import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  PageTitle, Card, Group, Row, Segmented, Empty, Spinner, ErrorNote, Button, Sheet, Field, useAutoFocus
} from '../components/ui'
import {
  listWorkouts, listRoutines, createRoutine, deleteRoutine, getActiveWorkout, createWorkout,
  deleteWorkout
} from '../lib/db'

export default function Training() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState('history')
  const [active, setActive] = useState(null)

  // Picking "Start a workout" from the nav bar's quick-add has nowhere to
  // start a specific routine from, so it lands here instead.
  useEffect(() => {
    if (location.state?.quickAdd === 'workout') setTab('routines')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadActive = useCallback(async () => {
    if (!user?.id) return
    try {
      setActive(await getActiveWorkout(user.id))
    } catch {
      // Non-critical — the banner just won't show.
    }
  }, [user?.id])

  useEffect(() => { loadActive() }, [loadActive])

  return (
    <>
      <PageTitle eyebrow="Your work">Training</PageTitle>

      {active && (
        <Card className="mb-5 flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-label2">Workout in progress</p>
            <p className="truncate text-[17px] font-semibold">
              {active.name ?? active.routine?.name ?? 'Session'}
            </p>
          </div>
          <Button size="sm" onClick={() => navigate(`/train/session/${active.id}`)}>
            Resume
          </Button>
        </Card>
      )}

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'history',  label: 'History' },
          { value: 'routines', label: 'Routines' }
        ]}
      />

      {tab === 'history'
        ? <History userId={user?.id} onOpen={(id) => navigate(`/train/workout/${id}`)} />
        : (
          <Routines
            userId={user?.id}
            activeWorkoutId={active?.id}
            onOpen={(id) => navigate(`/train/routine/${id}`)}
            onStart={(workoutId) => navigate(`/train/session/${workoutId}`)}
            onStarted={loadActive}
          />
        )}
    </>
  )
}

/* ------------------------------------------------------------------ history */

function History({ userId, onOpen }) {
  const [state, setState] = useState({ loading: true, error: null, workouts: [] })

  const load = useCallback(async () => {
    if (!userId) return
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const workouts = await listWorkouts(userId)
      setState({ loading: false, error: null, workouts })
    } catch (e) {
      setState({ loading: false, error: e.message, workouts: [] })
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  async function handleDelete(id, name) {
    if (!confirm(`Delete "${name ?? 'this session'}"? This can't be undone.`)) return
    try {
      await deleteWorkout(id)
      load()
    } catch (e) {
      setState((s) => ({ ...s, error: e.message }))
    }
  }

  if (state.loading) return <Spinner />
  if (state.error) return <ErrorNote error={state.error} onRetry={load} />

  if (state.workouts.length === 0) {
    return (
      <Empty
        title="No sessions yet"
        body="Finished workouts land here, newest first, with volume and duration."
      />
    )
  }

  return (
    <div className="space-y-3">
      {state.workouts.map((w) => (
        <Card key={w.id} className="flex items-stretch p-0">
          <button onClick={() => onOpen(w.id)} className="min-w-0 flex-1 px-4 py-4 text-left">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="truncate text-[17px] font-semibold">{w.name ?? 'Session'}</h3>
              <span className="shrink-0 text-[13px] text-label2">
                {new Date(w.started_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <div className="mt-2 flex gap-5 text-[13px] text-label2 tnum">
              <span><b className="font-semibold text-label">{w.set_count}</b> sets</span>
              <span><b className="font-semibold text-label">{w.volume_kg.toLocaleString()}</b> kg volume</span>
              {w.minutes != null && (
                <span><b className="font-semibold text-label">{w.minutes}</b> min</span>
              )}
            </div>
          </button>
          <button
            onClick={() => handleDelete(w.id, w.name)}
            aria-label="Delete workout"
            className="shrink-0 px-4 text-[16px] text-label3 transition-colors hover:text-danger"
          >
            ×
          </button>
        </Card>
      ))}
    </div>
  )
}

/* ----------------------------------------------------------------- routines */

function Routines({ userId, activeWorkoutId, onOpen, onStart, onStarted }) {
  const [state, setState] = useState({ loading: true, error: null, routines: [] })
  const [sheetOpen, setSheetOpen] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [starting, setStarting] = useState(false)
  const nameRef = useAutoFocus(sheetOpen)

  const load = useCallback(async () => {
    if (!userId) return
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const routines = await listRoutines(userId)
      setState({ loading: false, error: null, routines })
    } catch (e) {
      setState({ loading: false, error: e.message, routines: [] })
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  async function handleCreate() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const routine = await createRoutine(userId, name.trim())
      setSheetOpen(false)
      setName('')
      onOpen(routine.id)   // straight into the builder — an empty routine is useless
    } catch (e) {
      setState((s) => ({ ...s, error: e.message }))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id, routineName) {
    if (!confirm(`Delete "${routineName}"? This can't be undone.`)) return
    try {
      await deleteRoutine(id)
      load()
    } catch (e) {
      setState((s) => ({ ...s, error: e.message }))
    }
  }

  // Only one workout can be in flight at a time — jump into it rather than
  // starting a second, orphaned one.
  async function handleStart(routineId, routineName) {
    if (starting) return
    setStarting(true)
    try {
      if (activeWorkoutId) {
        onStart(activeWorkoutId)
        return
      }
      const workout = await createWorkout(userId, routineId, routineName)
      onStarted?.()
      onStart(workout.id)
    } catch (e) {
      setState((s) => ({ ...s, error: e.message }))
    } finally {
      setStarting(false)
    }
  }

  return (
    <>
      {state.loading ? (
        <Spinner />
      ) : state.error ? (
        <ErrorNote error={state.error} onRetry={load} />
      ) : state.routines.length === 0 ? (
        <Empty
          title="No routines yet"
          body="Build one: name it, add exercises, set your target sets and reps."
          action={<Button onClick={() => setSheetOpen(true)}>New routine</Button>}
        />
      ) : (
        <>
          <Group>
            {state.routines.map((r) => (
              <Row
                key={r.id}
                label={r.name}
                sub={`${r.exercise_count} ${r.exercise_count === 1 ? 'exercise' : 'exercises'}`}
                onClick={() => onOpen(r.id)}
                trailing={
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStart(r.id, r.name) }}
                      disabled={starting}
                      className="text-[13px] font-semibold text-violet disabled:opacity-40"
                    >
                      Start
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(r.id, r.name) }}
                      className="text-[13px] font-medium text-danger"
                    >
                      Delete
                    </button>
                  </div>
                }
              />
            ))}
          </Group>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => setSheetOpen(true)}>New routine</Button>
          </div>
        </>
      )}

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="New routine"
        footer={
          <Button onClick={handleCreate} disabled={!name.trim() || saving}>
            {saving ? 'Creating…' : 'Create and add exercises'}
          </Button>
        }
      >
        <Group className="mt-2">
          <Field
            ref={nameRef}
            label="Name"
            placeholder="Upper A"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
        </Group>
        <p className="mt-3 px-1 text-[13px] leading-relaxed text-label2">
          Give it a name you'll recognise on the gym floor. Push A, Legs, Full Body — whatever
          matches how you actually split your week.
        </p>
      </Sheet>
    </>
  )
}
