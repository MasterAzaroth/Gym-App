import { useState } from 'react'
import { Group, Sheet, Field, Button, ErrorNote, useForm } from './ui'
import { upsertBodyMetric } from '../lib/db'
import { toISODate } from '../lib/nutrition'

/**
 * Logs a body-weight entry for a date (defaulting to today). Used both from
 * Profile → Body and from the nav bar's quick-add menu.
 */
export default function WeightLogSheet({ open, userId, latest, onClose, onSaved }) {
  const [form, set] = useForm(open, {
    weight_kg:   latest?.weight_kg ?? '',
    bodyfat_pct: latest?.bodyfat_pct ?? '',
    measured_on: toISODate(new Date())
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function save() {
    setSaving(true); setError(null)
    try {
      await upsertBodyMetric(userId, form.measured_on, {
        weight_kg:   form.weight_kg ? Number(form.weight_kg) : null,
        bodyfat_pct: form.bodyfat_pct ? Number(form.bodyfat_pct) : null
      })
      onSaved()
    } catch (e) { setError(e.message); setSaving(false) }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Log weight"
           footer={<Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>}>
      {error && <div className="mb-3"><ErrorNote error={error} /></div>}
      <Group className="mt-2">
        <Field label="Date" type="date" value={form.measured_on ?? ''} onChange={set('measured_on')} />
        <Field label="Weight" type="number" inputMode="decimal" step="0.1" suffix="kg"
               value={form.weight_kg ?? ''} onChange={set('weight_kg')} />
        <Field label="Body fat" type="number" inputMode="decimal" step="0.1" suffix="%"
               value={form.bodyfat_pct ?? ''} onChange={set('bodyfat_pct')} />
      </Group>
      <p className="mt-3 px-1 text-[13px] leading-relaxed text-label2">
        Weigh yourself at the same time each day, ideally first thing. Day-to-day swings are water,
        not fat — the trend over weeks is what counts.
      </p>
    </Sheet>
  )
}
