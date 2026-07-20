import { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  Card, Group, Row, Button, Sheet, Field, Spinner, ErrorNote, Chevron
} from '../components/ui'
import {
  listNutrition, addNutritionEntry, updateNutritionEntry, deleteNutritionEntry, listFoods
} from '../lib/db'
import {
  MEALS, scaleFood, sumEntries, toISODate, addDays, friendlyDate, getWeekDates, WEEKDAY_LETTERS
} from '../lib/nutrition'

export default function Nutrition() {
  const { user, profile } = useAuth()
  const [date, setDate] = useState(new Date())
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [addingMeal, setAddingMeal] = useState(null)   // meal id when adding
  const [editing, setEditing] = useState(null)         // entry being edited

  const iso = toISODate(date)

  const goals = {
    kcal:    profile?.goal_kcal ?? 2500,
    protein: profile?.goal_protein_g ?? 180,
    carbs:   profile?.goal_carbs_g ?? 280,
    fat:     profile?.goal_fat_g ?? 80
  }

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      setEntries(await listNutrition(user.id, iso))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id, iso])

  useEffect(() => { load() }, [load])

  const totals = useMemo(() => sumEntries(entries), [entries])
  const weekDates = useMemo(() => getWeekDates(date), [date])

  return (
    <>
      {/* Date switcher — the whole tab is scoped to one day */}
      <div className="mb-4 flex items-center justify-between">
        <StepButton dir="prev" onClick={() => setDate((d) => addDays(d, -1))} />
        <div className="text-center">
          <h1 className="text-[22px] font-bold tracking-[-0.02em]">{friendlyDate(date)}</h1>
          <p className="text-[13px] text-label2">
            {date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <StepButton dir="next" onClick={() => setDate((d) => addDays(d, 1))} />
      </div>

      {/* Week strip — one pill per day, letters only */}
      <div className="mb-6 flex gap-2">
        {weekDates.map((d, i) => {
          const dISO = toISODate(d)
          const selected = dISO === iso
          return (
            <button
              key={dISO}
              onClick={() => setDate(d)}
              aria-current={selected ? 'date' : undefined}
              aria-label={d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
              className={[
                'aspect-square flex-1 rounded-full text-[13px] font-semibold transition-colors',
                selected ? 'bg-violet text-white' : 'bg-surface text-label2 shadow-card'
              ].join(' ')}
            >
              {WEEKDAY_LETTERS[i]}
            </button>
          )
        })}
      </div>

      {/* Macro summary — one compact row, not a card per macro */}
      <Card className="mb-6 p-4">
        <div className="grid grid-cols-4 gap-2">
          <MacroTile label="Calories" consumed={totals.kcal}      goal={goals.kcal}    color="#6E56CF" />
          <MacroTile label="Protein"  consumed={totals.protein_g} goal={goals.protein} color="#3B9EDB" unit="g" />
          <MacroTile label="Carbs"    consumed={totals.carbs_g}   goal={goals.carbs}   color="#E8A33D" unit="g" />
          <MacroTile label="Fat"      consumed={totals.fat_g}     goal={goals.fat}     color="#34A876" unit="g" />
        </div>
      </Card>

      {loading && <Spinner />}
      {error && <ErrorNote error={error} onRetry={load} />}

      {!loading && !error && MEALS.map((meal) => {
        const mealEntries = entries.filter((e) => e.meal === meal.id)
        const mealKcal = Math.round(sumEntries(mealEntries).kcal)

        return (
          <section key={meal.id} className="mb-5">
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-label2">
                {meal.label}
              </h2>
              <span className="text-[13px] text-label2 tnum">{mealKcal} kcal</span>
            </div>

            <Group>
              {mealEntries.map((e) => (
                <Row
                  key={e.id}
                  label={e.name}
                  sub={`${Math.round(e.grams)} g · P ${e.protein_g} · C ${e.carbs_g} · F ${e.fat_g}`}
                  value={`${Math.round(e.kcal)}`}
                  onClick={() => setEditing(e)}
                />
              ))}
              <button
                onClick={() => setAddingMeal(meal.id)}
                className="flex w-full items-center gap-2 px-4 py-3.5 text-left text-[17px] text-violet transition-colors hover:bg-fill"
              >
                <span className="text-[20px] leading-none">+</span> Add food
              </button>
            </Group>
          </section>
        )
      })}

      <AddSheet
        meal={addingMeal}
        userId={user?.id}
        isoDate={iso}
        onClose={() => setAddingMeal(null)}
        onSaved={() => { setAddingMeal(null); load() }}
      />

      <EditSheet
        entry={editing}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); load() }}
      />
    </>
  )
}

function StepButton({ dir, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'prev' ? 'Previous day' : 'Next day'}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-card transition-opacity disabled:opacity-30"
    >
      <span className={dir === 'prev' ? 'rotate-180' : ''}><Chevron /></span>
    </button>
  )
}

/* ---------------------------------------------------------------- add sheet */

function AddSheet({ meal, userId, isoDate, onClose, onSaved }) {
  const [query, setQuery] = useState('')
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(false)
  const [picked, setPicked] = useState(null)
  const [grams, setGrams] = useState(100)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const open = Boolean(meal)

  useEffect(() => {
    if (!open) { setPicked(null); setQuery(''); setError(null); return }
    setLoading(true)
    listFoods(query).then(setFoods).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [open, query])

  useEffect(() => {
    if (picked?.serving_grams) setGrams(picked.serving_grams)
    else if (picked) setGrams(100)
  }, [picked])

  const macros = picked ? scaleFood(picked, grams) : null

  async function save() {
    setSaving(true)
    setError(null)
    try {
      await addNutritionEntry(userId, {
        food_id: picked.id,
        entry_date: isoDate,
        meal,
        name: picked.name,
        grams: Number(grams),
        ...macros
      })
      onSaved()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const mealLabel = MEALS.find((m) => m.id === meal)?.label ?? 'Meal'

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={picked ? 'Portion' : `Add to ${mealLabel}`}
      footer={picked && (
        <Button onClick={save} disabled={saving || !grams}>
          {saving ? 'Adding…' : `Add ${macros.kcal} kcal`}
        </Button>
      )}
    >
      {error && <div className="mb-3"><ErrorNote error={error} /></div>}

      {!picked ? (
        <>
          <div className="sticky top-0 -mx-5 bg-fill px-5 pb-3 pt-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search foods"
              autoFocus
              className="w-full rounded-xl bg-surface px-4 py-3 text-[17px] placeholder:text-label3 focus:outline-none"
            />
          </div>

          {loading ? <Spinner /> : foods.length === 0 ? (
            <p className="py-10 text-center text-[15px] leading-relaxed text-label2">
              No foods match "{query}".<br />
              Custom foods are coming — for now, search the shared library.
            </p>
          ) : (
            <Group>
              {foods.map((f) => (
                <Row
                  key={f.id}
                  label={f.name}
                  sub={`${f.kcal_per_100g} kcal · P ${f.protein_per_100g} · C ${f.carbs_per_100g} · F ${f.fat_per_100g} per 100 g`}
                  onClick={() => setPicked(f)}
                />
              ))}
            </Group>
          )}
        </>
      ) : (
        <>
          <Card className="mb-4 p-4">
            <h3 className="text-[17px] font-semibold">{picked.name}</h3>
            {picked.serving_name && (
              <p className="mt-0.5 text-[13px] text-label2">
                {picked.serving_name} ≈ {picked.serving_grams} g
              </p>
            )}
          </Card>

          <Group>
            <Field
              label="Amount"
              type="number"
              inputMode="decimal"
              suffix="g"
              value={grams}
              autoFocus
              onChange={(e) => setGrams(e.target.value)}
            />
          </Group>

          {picked.serving_grams && (
            <div className="mt-3 flex gap-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setGrams(picked.serving_grams * n)}
                  className="flex-1 rounded-lg bg-surface py-2 text-[15px] font-medium text-violet shadow-card"
                >
                  {n}× serving
                </button>
              ))}
            </div>
          )}

          <Card className="mt-4 p-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              <Macro label="kcal" value={macros.kcal} />
              <Macro label="Protein" value={`${macros.protein_g}g`} />
              <Macro label="Carbs" value={`${macros.carbs_g}g`} />
              <Macro label="Fat" value={`${macros.fat_g}g`} />
            </div>
          </Card>

          <button
            onClick={() => setPicked(null)}
            className="mt-4 w-full text-center text-[15px] font-medium text-violet"
          >
            Pick a different food
          </button>
        </>
      )}
    </Sheet>
  )
}

/* --------------------------------------------------------------- edit sheet */

function EditSheet({ entry, onClose, onSaved }) {
  const [grams, setGrams] = useState(100)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (entry) setGrams(entry.grams)
  }, [entry])

  // Rescale from the entry's own snapshot, so it stays correct even if the
  // underlying food was edited or deleted since.
  const macros = useMemo(() => {
    if (!entry) return null
    const f = Number(grams) / Number(entry.grams || 1)
    return {
      kcal:      Math.round(entry.kcal * f),
      protein_g: Math.round(entry.protein_g * f * 10) / 10,
      carbs_g:   Math.round(entry.carbs_g * f * 10) / 10,
      fat_g:     Math.round(entry.fat_g * f * 10) / 10
    }
  }, [entry, grams])

  async function save() {
    setSaving(true)
    setError(null)
    try {
      await updateNutritionEntry(entry.id, { grams: Number(grams), ...macros })
      onSaved()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!confirm(`Remove ${entry.name}?`)) return
    setSaving(true)
    try {
      await deleteNutritionEntry(entry.id)
      onSaved()
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <Sheet
      open={Boolean(entry)}
      onClose={onClose}
      title={entry?.name ?? 'Entry'}
      footer={
        <Button onClick={save} disabled={saving || !grams}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      }
    >
      {error && <div className="mb-3"><ErrorNote error={error} /></div>}

      <Group className="mt-2">
        <Field
          label="Amount"
          type="number"
          inputMode="decimal"
          suffix="g"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
        />
      </Group>

      {macros && (
        <Card className="mt-4 p-4">
          <div className="grid grid-cols-4 gap-2 text-center">
            <Macro label="kcal" value={macros.kcal} />
            <Macro label="Protein" value={`${macros.protein_g}g`} />
            <Macro label="Carbs" value={`${macros.carbs_g}g`} />
            <Macro label="Fat" value={`${macros.fat_g}g`} />
          </div>
        </Card>
      )}

      <div className="mt-4">
        <Button variant="danger" onClick={remove} disabled={saving}>Remove from day</Button>
      </div>
    </Sheet>
  )
}

function Macro({ label, value }) {
  return (
    <div>
      <p className="text-[17px] font-semibold tnum">{value}</p>
      <p className="mt-0.5 text-[11px] text-label2">{label}</p>
    </div>
  )
}

/** One column of the macro row: consumed, then what's left (or over), then a
    hairline progress bar. Four of these sit side by side instead of one bar
    per macro in a tall card. */
function MacroTile({ label, consumed, goal, unit = '', color }) {
  const remaining = Math.round(goal - consumed)
  const over = goal > 0 && consumed > goal
  const pct = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0

  return (
    <div className="text-center">
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.04em] text-label2">
        {label}
      </p>
      <p className="mt-1 text-[17px] font-bold tnum">
        {Math.round(consumed)}{unit}
      </p>
      <p className={`text-[11px] tnum ${over ? 'text-danger' : 'text-label3'}`}>
        {over ? `${Math.abs(remaining)}${unit} over` : `${remaining}${unit} left`}
      </p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-separator">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, backgroundColor: over ? '#D93843' : color }}
        />
      </div>
    </div>
  )
}
