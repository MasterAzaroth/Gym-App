import { useEffect, useState } from 'react'
import { Card, Group, Row, Button, Sheet, Field, Spinner, ErrorNote, Macro } from './ui'
import { addNutritionEntry, listFoods } from '../lib/db'
import { scaleFood } from '../lib/nutrition'

/**
 * Search a food, pick a portion and a time, log it. Used both for a specific
 * hour slot in the Nutrition tab and for the nav bar's quick-add menu (which
 * has no page of its own to host this).
 */
export default function FoodAddSheet({ open, presetTime, userId, isoDate, dayStart, dayEnd, onClose, onSaved }) {
  const [query, setQuery] = useState('')
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(false)
  const [picked, setPicked] = useState(null)
  const [grams, setGrams] = useState(100)
  const [loggedTime, setLoggedTime] = useState(presetTime)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Reset once per opening — not on every keystroke in the search box below.
  useEffect(() => {
    if (!open) return
    setPicked(null)
    setQuery('')
    setError(null)
    setLoggedTime(presetTime)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
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
        logged_time: loggedTime,
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

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={picked ? 'Portion' : 'Add food'}
      footer={picked && (
        <Button onClick={save} disabled={saving || !grams || !loggedTime}>
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
            <Field
              label="Time"
              type="time"
              min={dayStart}
              max={dayEnd}
              value={loggedTime}
              onChange={(e) => setLoggedTime(e.target.value)}
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
