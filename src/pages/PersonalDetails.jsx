import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Group, Field, SelectField, Button, Spinner, ErrorNote, Chevron
} from '../components/ui'
import { getProfile, updateProfile } from '../lib/db'

export default function PersonalDetails() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profileId, setProfileId] = useState(null)
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const p = await getProfile(user.id)
      setProfileId(p?.id ?? user.id)
      setForm({
        display_name: p?.display_name ?? '',
        sex:          p?.sex ?? '',
        birth_date:   p?.birth_date ?? '',
        height_cm:    p?.height_cm ?? '',
        goal:         p?.goal ?? ''
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { load() }, [load])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function save() {
    setSaving(true)
    setError(null)
    try {
      await updateProfile(profileId, {
        display_name: form.display_name?.trim() || null,
        sex:          form.sex || null,
        birth_date:   form.birth_date || null,
        height_cm:    form.height_cm ? Number(form.height_cm) : null,
        goal:         form.goal || null
      })
      navigate(-1)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <header className="-ml-2 mb-6 flex items-center gap-1">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full text-label2 transition-colors hover:bg-fill"
        >
          <span className="block rotate-180"><Chevron /></span>
        </button>
        <h1 className="text-[20px] font-bold tracking-[-0.01em]">Personal details</h1>
      </header>

      {loading || !form ? (
        <Spinner />
      ) : (
        <>
          {error && <div className="mb-4"><ErrorNote error={error} /></div>}

          <Group>
            <Field label="Name" placeholder="Leonard" value={form.display_name} onChange={set('display_name')} />
            <SelectField label="Sex" value={form.sex} onChange={set('sex')} options={[
              { value: '', label: 'Not set' },
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' }
            ]} />
            <Field label="Birth date" type="date" value={form.birth_date} onChange={set('birth_date')} />
            <Field label="Height" type="number" inputMode="decimal" suffix="cm"
                   value={form.height_cm} onChange={set('height_cm')} />
          </Group>

          <Group className="mt-4">
            <SelectField label="Goal" value={form.goal} onChange={set('goal')} options={[
              { value: '', label: 'Not set' },
              { value: 'build', label: 'Build muscle' },
              { value: 'lean', label: 'Lose body fat' },
              { value: 'maintain', label: 'Maintain' }
            ]} />
          </Group>

          {/* Reserves room so the fixed footer never covers the last field. */}
          <div style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)' }} aria-hidden="true" />
        </>
      )}

      <div
        className="fixed inset-x-0 bottom-0 z-10 bg-fill/95 backdrop-blur-sm"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
      >
        <div className="mx-auto max-w-md px-5 py-3">
          <Button onClick={save} disabled={saving || loading || !form}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </>
  )
}
