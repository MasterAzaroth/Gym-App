import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  PageTitle, Card, Group, Button, Sheet, Field, Spinner, ErrorNote, Empty, Row
} from '../components/ui'
import {
  getRoutine, listExercises, addRoutineExercise,
  updateRoutineExercise, removeRoutineExercise, renameRoutine
} from '../lib/db'

export default function RoutineBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [routine, setRoutine] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editing, setEditing] = useState(null)   // routine_exercise being edited

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRoutine(await getRoutine(id))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  async function handleAdd(exercise) {
    const position = routine.routine_exercises?.length ?? 0
    try {
      await addRoutineExercise(id, exercise.id, position)
      setPickerOpen(false)
      load()
    } catch (e) { setError(e.message) }
  }

  async function handleRemove(reId) {
    try {
      await removeRoutineExercise(reId)
      load()
    } catch (e) { setError(e.message) }
  }

  if (loading) return <Spinner />
  if (error && !routine) return <ErrorNote error={error} onRetry={load} />

  const items = routine?.routine_exercises ?? []

  return (
    <>
      <button onClick={() => navigate('/train')} className="mb-3 text-[17px] text-violet">
        ‹ Training
      </button>

      <PageTitle eyebrow="Routine">
        <EditableName routine={routine} onSaved={load} />
      </PageTitle>

      {error && <div className="mb-4"><ErrorNote error={error} /></div>}

      {items.length === 0 ? (
        <Empty
          title="No exercises yet"
          body="Add lifts in the order you'll perform them."
          action={<Button onClick={() => setPickerOpen(true)}>Add exercise</Button>}
        />
      ) : (
        <>
          <div className="space-y-3">
            {items.map((re, i) => (
              <Card key={re.id} className="p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-soft text-[12px] font-semibold text-violet tnum">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[17px] font-semibold">{re.exercise?.name}</h3>
                    <p className="mt-0.5 text-[13px] text-label2">
                      {re.exercise?.muscle_group} · {re.exercise?.equipment}
                    </p>
                    <p className="mt-2 text-[15px] tnum">
                      <b className="font-semibold">{re.target_sets}</b> sets ×{' '}
                      <b className="font-semibold">{re.rep_low}–{re.rep_high}</b> reps
                      <span className="text-label2"> · {re.rest_seconds ?? 120}s rest</span>
                    </p>
                    {re.notes && (
                      <p className="mt-1.5 text-[13px] italic text-label2">{re.notes}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex gap-2 border-t border-separator pt-3">
                  <Button size="sm" variant="subtle" onClick={() => setEditing(re)}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => handleRemove(re.id)}>Remove</Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-4">
            <Button variant="secondary" onClick={() => setPickerOpen(true)}>Add exercise</Button>
          </div>
        </>
      )}

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handleAdd}
      />

      <DetailSheet
        item={editing}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); load() }}
      />
    </>
  )
}

/* ------------------------------------------------------------ editable name */

function EditableName({ routine, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(routine?.name ?? '')

  async function save() {
    const trimmed = name.trim()
    if (trimmed && trimmed !== routine.name) {
      await renameRoutine(routine.id, trimmed)
      onSaved()
    }
    setEditing(false)
  }

  if (!editing) {
    return (
      <button onClick={() => { setName(routine?.name ?? ''); setEditing(true) }} className="text-left">
        {routine?.name}
      </button>
    )
  }

  return (
    <input
      autoFocus
      value={name}
      onChange={(e) => setName(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => e.key === 'Enter' && save()}
      className="w-full bg-transparent text-[34px] font-bold tracking-[-0.022em] focus:outline-none"
    />
  )
}

/* --------------------------------------------------------- exercise picker */

function ExercisePicker({ open, onClose, onPick }) {
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    listExercises()
      .then(setExercises)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [open])

  const grouped = useMemo(() => {
    const filtered = exercises.filter((e) =>
      e.name.toLowerCase().includes(query.trim().toLowerCase())
    )
    return filtered.reduce((acc, e) => {
      const key = e.muscle_group ?? 'Other'
      ;(acc[key] ??= []).push(e)
      return acc
    }, {})
  }, [exercises, query])

  return (
    <Sheet open={open} onClose={onClose} title="Add exercise">
      <div className="sticky top-0 -mx-5 bg-fill px-5 pb-3 pt-1">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises"
          className="w-full rounded-xl bg-surface px-4 py-3 text-[17px] placeholder:text-label3 focus:outline-none"
        />
      </div>

      {loading && <Spinner />}
      {error && <ErrorNote error={error} />}

      {!loading && !error && Object.keys(grouped).length === 0 && (
        <p className="py-10 text-center text-[15px] text-label2">
          Nothing matches "{query}".
        </p>
      )}

      {Object.entries(grouped).map(([group, list]) => (
        <div key={group} className="mb-5">
          <h3 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-[0.04em] text-label2">
            {group}
          </h3>
          <Group>
            {list.map((e) => (
              <Row key={e.id} label={e.name} sub={e.equipment} onClick={() => onPick(e)} />
            ))}
          </Group>
        </div>
      ))}
    </Sheet>
  )
}

/* ------------------------------------------------------------ detail editor */

function DetailSheet({ item, onClose, onSaved }) {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!item) return setForm(null)
    setForm({
      target_sets:  item.target_sets ?? 3,
      rep_low:      item.rep_low ?? 8,
      rep_high:     item.rep_high ?? 12,
      rest_seconds: item.rest_seconds ?? 120,
      notes:        item.notes ?? ''
    })
  }, [item])

  async function save() {
    setSaving(true)
    try {
      await updateRoutineExercise(item.id, {
        target_sets:  Number(form.target_sets)  || 3,
        rep_low:      Number(form.rep_low)      || 1,
        rep_high:     Number(form.rep_high)     || 1,
        rest_seconds: Number(form.rest_seconds) || 0,
        notes:        form.notes.trim() || null
      })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <Sheet
      open={Boolean(item && form)}
      onClose={onClose}
      title={item?.exercise?.name ?? 'Exercise'}
      footer={
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      }
    >
      {form && (
        <>
          <Group className="mt-2">
            <Field label="Sets" type="number" inputMode="numeric"
                   value={form.target_sets} onChange={set('target_sets')} />
            <Field label="Reps from" type="number" inputMode="numeric"
                   value={form.rep_low} onChange={set('rep_low')} />
            <Field label="Reps to" type="number" inputMode="numeric"
                   value={form.rep_high} onChange={set('rep_high')} />
            <Field label="Rest" type="number" inputMode="numeric" suffix="sec"
                   value={form.rest_seconds} onChange={set('rest_seconds')} />
          </Group>

          <Group className="mt-4">
            <Field label="Note" placeholder="Pause 1s at the chest"
                   value={form.notes} onChange={set('notes')} />
          </Group>

          <p className="mt-3 px-1 text-[13px] leading-relaxed text-label2">
            A rep range, not a fixed number. Hit the top of the range on every set, then add weight.
          </p>
        </>
      )}
    </Sheet>
  )
}
