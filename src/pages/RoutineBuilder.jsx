import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  PageTitle, Card, Group, Button, Sheet, Spinner, ErrorNote, Empty, Row
} from '../components/ui'
import {
  getRoutine, listExercises, addRoutineExercise,
  removeRoutineExercise, renameRoutine, replaceRoutineSets
} from '../lib/db'

export default function RoutineBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [routine, setRoutine] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pendingExercise, setPendingExercise] = useState(null) // picked, not yet added
  const [editing, setEditing] = useState(null)

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

  async function handleRemove(reId, name) {
    if (!confirm(`Remove ${name} from this routine?`)) return
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
              <ExerciseCard
                key={re.id}
                index={i}
                item={re}
                onEdit={() => setEditing(re)}
                onRemove={() => handleRemove(re.id, re.exercise?.name)}
              />
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
        onPick={(exercise) => { setPickerOpen(false); setPendingExercise(exercise) }}
      />

      {/* One sheet, two purposes: confirming sets for a just-picked exercise
          before it's added, or editing an existing one's sets. Never both at
          once, so they can share the same instance. */}
      <SetsSheet
        open={Boolean(pendingExercise) || Boolean(editing)}
        title={pendingExercise?.name ?? editing?.exercise?.name}
        initialRows={pendingExercise ? DEFAULT_SETS : editing?.routine_sets}
        confirmVerb={pendingExercise ? 'Add' : 'Save'}
        onClose={() => { setPendingExercise(null); setEditing(null) }}
        onSave={async (rows) => {
          if (pendingExercise) {
            await addRoutineExercise(id, pendingExercise.id, items.length, rows)
          } else {
            await replaceRoutineSets(editing.id, rows)
          }
        }}
        onSaved={() => { setPendingExercise(null); setEditing(null); load() }}
      />
    </>
  )
}

const repLabel = (s) => (s.rep_low === s.rep_high ? `${s.rep_low}` : `${s.rep_low}–${s.rep_high}`)
const workingNumber = (sets, i) => sets.slice(0, i + 1).filter((s) => !s.is_warmup).length

/* ------------------------------------------------------------ exercise card */

function ExerciseCard({ index, item, onEdit, onRemove }) {
  const sets = item.routine_sets ?? []

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-soft text-[12px] font-semibold text-violet tnum">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[17px] font-semibold">{item.exercise?.name}</h3>
          <p className="mt-0.5 text-[13px] text-label2">
            {item.exercise?.muscle_group} · {item.exercise?.equipment}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={onEdit}
            aria-label="Edit sets"
            className="flex h-8 w-8 items-center justify-center rounded-full text-label2 transition-colors hover:bg-fill hover:text-violet"
          >
            <EditIcon />
          </button>
          <button
            onClick={onRemove}
            aria-label="Remove exercise"
            className="flex h-8 w-8 items-center justify-center rounded-full text-label2 transition-colors hover:bg-fill hover:text-danger"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {sets.length === 0 ? (
        <p className="mt-3 text-[15px] text-label2">No sets planned.</p>
      ) : (
        <table className="mt-3 w-full text-[15px] tnum">
          <tbody className="divide-y divide-separator">
            {sets.map((s, i) => (
              <tr key={s.id ?? i} className={s.is_warmup ? 'text-label2' : ''}>
                <td className="w-20 py-1.5 text-[13px]">
                  {s.is_warmup ? 'Warm-up' : `Set ${workingNumber(sets, i)}`}
                </td>
                <td className="py-1.5 text-right font-medium">{repLabel(s)} reps</td>
                <td className="w-16 py-1.5 text-right text-[13px] text-label2">
                  {s.target_rir != null ? `${s.target_rir} RIR` : '—'}
                </td>
                <td className="w-16 py-1.5 text-right text-[13px] text-label2">
                  {s.rest_seconds}s
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {item.notes && <p className="mt-2 text-[13px] italic text-label2">{item.notes}</p>}
    </Card>
  )
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M11.3 2.3a1 1 0 0 1 1.4 0l1 1a1 1 0 0 1 0 1.4l-7 7-3 .7.7-3 7-7.1Z"
            stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M3 4.5h10M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5M4.5 4.5l.6 8.4a1 1 0 0 0 1 .93h3.8a1 1 0 0 0 1-.93l.6-8.4"
            stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 7v4M9.5 7v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

/* --------------------------------------------------------------- sets sheet */

/** Starting point when confirming a freshly-picked exercise — the user tunes
    this before it's ever written anywhere. */
const DEFAULT_SETS = [
  { rep_low: 8, rep_high: 12, rest_seconds: 120, is_warmup: false, target_rir: null },
  { rep_low: 8, rep_high: 12, rest_seconds: 120, is_warmup: false, target_rir: null },
  { rep_low: 8, rep_high: 12, rest_seconds: 120, is_warmup: false, target_rir: null }
]

/**
 * Doubles as the "confirm sets before adding" step and the "edit sets" sheet
 * for an exercise already in the routine — the caller decides what onSave
 * does (create vs. replace) and hands over the rows to start from.
 */
function SetsSheet({ open, title, initialRows, confirmVerb = 'Save', onClose, onSave, onSaved }) {
  const [rows, setRows] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    const existing = initialRows?.length ? initialRows : DEFAULT_SETS
    setRows(existing.map((s) => ({ ...s })))
    setError(null)
    // Rows are seeded once, right when the sheet opens — not kept in sync
    // with initialRows afterwards, since the caller doesn't change targets
    // while it's open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const update = (i, key, value) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [key]: value } : r)))

  const addSet = (warmup = false) =>
    setRows((rs) => {
      if (warmup) {
        // Warm-ups lead into working sets, so a new one joins the end of the
        // warm-up block rather than tacking onto the very end of the list.
        const firstWorking = rs.findIndex((r) => !r.is_warmup)
        const row = { rep_low: 5, rep_high: 5, rest_seconds: 60, is_warmup: true, target_rir: null }
        if (firstWorking === -1) return [...rs, row]
        return [...rs.slice(0, firstWorking), row, ...rs.slice(firstWorking)]
      }
      const last = rs[rs.length - 1]
      return [...rs, {
        rep_low:      last?.rep_low ?? 8,
        rep_high:     last?.rep_high ?? 12,
        rest_seconds: last?.rest_seconds ?? 120,
        is_warmup:    false,
        target_rir:   last?.target_rir ?? null
      }]
    })

  const removeSet = (i) => setRows((rs) => rs.filter((_, j) => j !== i))

  /* Most people want one range everywhere, then tweak a set or two. Copying
     down beats retyping five rows. */
  const applyFirstToAll = () => {
    const first = rows.find((r) => !r.is_warmup)
    if (!first) return
    setRows((rs) => rs.map((r) => (r.is_warmup ? r : {
      ...r,
      rep_low: first.rep_low,
      rep_high: first.rep_high,
      rest_seconds: first.rest_seconds,
      target_rir: first.target_rir
    })))
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      await onSave(rows)
      onSaved()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const workingCount = rows.filter((r) => !r.is_warmup).length

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title ?? 'Exercise'}
      footer={
        <Button onClick={save} disabled={saving || rows.length === 0}>
          {saving ? 'Saving…' : `${confirmVerb} ${workingCount} working ${workingCount === 1 ? 'set' : 'sets'}`}
        </Button>
      }
    >
      {error && <div className="mb-3"><ErrorNote error={error} /></div>}

      <div className="mb-2 flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-label2">
        <span className="w-[64px]">Set</span>
        <span className="flex-1 text-center">Reps</span>
        <span className="w-[52px] text-center">RIR</span>
        <span className="w-[62px] text-center">Rest</span>
        <span className="w-6" />
      </div>

      <div className="space-y-2">
        {rows.map((r, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 rounded-xl p-2 ${
              r.is_warmup ? 'bg-fill' : 'bg-surface shadow-card'
            }`}
          >
            <span className="w-[64px] shrink-0 pl-1 text-[13px] font-medium text-label2">
              {r.is_warmup ? 'Warm-up' : `Set ${workingNumber(rows, i)}`}
            </span>

            <div className="flex flex-1 items-center justify-center gap-1">
              <NumInput
                value={r.rep_low}
                onChange={(v) => update(i, 'rep_low', v)}
                aria-label="Minimum reps"
              />
              <span className="text-[15px] text-label3">–</span>
              <NumInput
                value={r.rep_high}
                onChange={(v) => update(i, 'rep_high', v)}
                aria-label="Maximum reps"
              />
            </div>

            <div className="flex w-[52px] shrink-0 justify-center">
              <NumInput
                value={r.target_rir ?? ''}
                onChange={(v) => update(i, 'target_rir', v)}
                placeholder="–"
                aria-label="Target RIR"
              />
            </div>

            <div className="flex w-[62px] shrink-0 justify-center">
              <NumInput
                value={r.rest_seconds}
                onChange={(v) => update(i, 'rest_seconds', v)}
                aria-label="Rest seconds"
                wide
              />
            </div>

            <button
              onClick={() => removeSet(i)}
              aria-label="Remove set"
              className="flex h-8 w-6 shrink-0 items-center justify-center text-[20px] text-label3 transition-colors hover:text-danger"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="secondary" className="flex-1" onClick={() => addSet(false)}>
          + Working set
        </Button>
        <Button size="sm" variant="subtle" className="flex-1" onClick={() => addSet(true)}>
          + Warm-up
        </Button>
      </div>

      {workingCount > 1 && (
        <button
          onClick={applyFirstToAll}
          className="mt-3 w-full text-center text-[15px] font-medium text-violet"
        >
          Copy set 1 to every working set
        </button>
      )}

      <p className="mt-4 px-1 text-[13px] leading-relaxed text-label2">
        A heavy top set of 4–6 followed by back-offs of 8–12 is a different session from four
        straight sets of 8–12 — the routine can now say which one you meant. For a fixed target,
        put the same number in both boxes. RIR (reps in reserve) is optional — leave it blank if
        you'd rather decide how hard to push on the day.
      </p>
    </Sheet>
  )
}

function NumInput({ value, onChange, wide, ...rest }) {
  return (
    <input
      type="number"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => e.target.select()}
      className={`rounded-lg bg-fill py-2 text-center text-[17px] tnum focus:outline-none focus:ring-2 focus:ring-violet ${
        wide ? 'w-[58px]' : 'w-[52px]'
      }`}
      {...rest}
    />
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
      <button
        onClick={() => { setName(routine?.name ?? ''); setEditing(true) }}
        className="text-left"
      >
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

/* ---------------------------------------------------------- exercise picker */

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
        <p className="py-10 text-center text-[15px] text-label2">Nothing matches "{query}".</p>
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
