import { useEffect, useState, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import {
  PageTitle, Card, Group, Row, Button, Sheet, Field, SelectField, Segmented,
  Spinner, ErrorNote, Logo, useForm
} from '../components/ui'
import WeightLogSheet from '../components/WeightLogSheet'
import { getProfile, updateProfile, listBodyMetrics } from '../lib/db'
import { formatTime, shortTime, DEFAULT_DAY_START, DEFAULT_DAY_END } from '../lib/nutrition'

const TIERS = {
  free:    { name: 'Free',    price: '€0' },
  plus:    { name: 'Plus',    price: '€9 / month' },
  coached: { name: 'Coached', price: '€39 / month' }
}

export default function Profile() {
  const { user, signOut } = useAuth()
  const { preference, setTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sheet, setSheet] = useState(null)   // 'account' | 'training' | 'goals' | 'weight'

  // Arriving from elsewhere (e.g. the nutrition tab's day-window edit
  // button) can request a sheet open immediately, without a stale link
  // reopening it if the user navigates back here later.
  useEffect(() => {
    if (location.state?.openSheet) {
      setSheet(location.state.openSheet)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.state, location.pathname, navigate])

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const [p, m] = await Promise.all([getProfile(user.id), listBodyMetrics(user.id)])
      setProfile(p)
      setMetrics(m)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { load() }, [load])

  if (loading) return <Spinner />
  if (error) return <ErrorNote error={error} onRetry={load} />

  const latest = metrics[0]
  const tier = TIERS[profile?.tier ?? 'free']
  const initials = (profile?.display_name || user?.email || '?')
    .split(/[\s@._]/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join('')

  return (
    <>
      <PageTitle eyebrow="Account">Profile</PageTitle>

      {/* Identity */}
      <Card className="mb-6 flex items-center gap-4 p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-violet text-[20px] font-semibold text-white">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[20px] font-semibold tracking-[-0.01em]">
            {profile?.display_name || 'Add your name'}
          </p>
          <p className="truncate text-[15px] text-label2">{user?.email}</p>
        </div>
      </Card>

      {/* Plan */}
      <Section title="Plan">
        <Card className="p-5">
          <div className="flex items-baseline justify-between">
            <p className="text-[20px] font-semibold tracking-[-0.01em]">{tier.name}</p>
            <p className="text-[15px] text-label2">{tier.price}</p>
          </div>
          <p className="mt-1.5 text-[15px] leading-relaxed text-label2">
            {profile?.tier === 'coached'
              ? 'Your monthly check-in is included. Book it any time.'
              : 'Upgrade for the full curriculum, progress charts, and a monthly check-in.'}
          </p>
          <div className="mt-4">
            <Button variant="secondary" disabled>
              {profile?.tier === 'free' ? 'See plans' : 'Manage plan'}
            </Button>
          </div>
        </Card>
      </Section>

      {/* Body */}
      <Section title="Body">
        <Group>
          <Row
            label="Current weight"
            value={latest?.weight_kg ? `${latest.weight_kg} kg` : 'Not logged'}
            sub={latest ? `Last logged ${new Date(latest.measured_on).toLocaleDateString()}` : undefined}
            onClick={() => setSheet('weight')}
          />
          <Row
            label="Body fat"
            value={latest?.bodyfat_pct ? `${latest.bodyfat_pct}%` : '—'}
            onClick={() => setSheet('weight')}
          />
          <Row
            label="Height"
            value={profile?.height_cm ? `${profile.height_cm} cm` : '—'}
            onClick={() => setSheet('account')}
          />
        </Group>
      </Section>

      {/* Nutrition goals */}
      <Section title="Nutrition goals">
        <Group>
          <Row label="Daily calories" value={`${profile?.goal_kcal ?? 2500} kcal`} onClick={() => setSheet('goals')} />
          <Row label="Protein"        value={`${profile?.goal_protein_g ?? 180} g`} onClick={() => setSheet('goals')} />
          <Row label="Carbs"          value={`${profile?.goal_carbs_g ?? 280} g`}   onClick={() => setSheet('goals')} />
          <Row label="Fat"            value={`${profile?.goal_fat_g ?? 80} g`}      onClick={() => setSheet('goals')} />
          <Row
            label="Day window"
            value={`${formatTime(shortTime(profile?.day_start_time) || DEFAULT_DAY_START)} – ${formatTime(shortTime(profile?.day_end_time) || DEFAULT_DAY_END)}`}
            onClick={() => setSheet('goals')}
          />
        </Group>
      </Section>

      {/* Preferences */}
      <Section title="Training preferences">
        <Group>
          <Row label="Units"       value={profile?.unit === 'lb' ? 'Pounds' : 'Kilograms'} onClick={() => setSheet('training')} />
          <Row label="Bar weight"  value={`${profile?.bar_kg ?? 20} kg`}                   onClick={() => setSheet('training')} />
        </Group>
      </Section>

      {/* Appearance */}
      <Section title="Appearance">
        <Segmented
          value={preference}
          onChange={setTheme}
          options={[
            { value: 'light',  label: 'Light' },
            { value: 'dark',   label: 'Dark' },
            { value: 'system', label: 'Auto' }
          ]}
        />
      </Section>

      {/* Account */}
      <Section title="Account">
        <Group>
          <Row label="Personal details" onClick={() => setSheet('account')} />
          <Row label="Change password" onClick={() => alert('Password reset is coming next.')} />
          <Row label="Export my data"  onClick={() => alert('Data export is coming next.')} />
        </Group>
      </Section>

      <Section title="About">
        <Group>
          <Row label="Help and support" onClick={() => {}} />
          <Row label="Privacy policy"   onClick={() => {}} />
          <Row label="Terms of service" onClick={() => {}} />
          <Row label="Version" value="0.2.0" />
        </Group>
      </Section>

      <div className="mb-6">
        <Button variant="danger" onClick={signOut}>Sign out</Button>
      </div>

      <div className="flex flex-col items-center gap-2 pb-4 text-center">
        <Logo size={32} />
        <p className="text-[13px] text-label3">IRONLOG</p>
      </div>

      {/* Sheets */}
      <AccountSheet
        open={sheet === 'account'} profile={profile}
        onClose={() => setSheet(null)}
        onSaved={() => { setSheet(null); load() }}
      />
      <TrainingSheet
        open={sheet === 'training'} profile={profile}
        onClose={() => setSheet(null)}
        onSaved={() => { setSheet(null); load() }}
      />
      <GoalsSheet
        open={sheet === 'goals'} profile={profile}
        onClose={() => setSheet(null)}
        onSaved={() => { setSheet(null); load() }}
      />
      <WeightLogSheet
        open={sheet === 'weight'} userId={user?.id} latest={latest}
        onClose={() => setSheet(null)}
        onSaved={() => { setSheet(null); load() }}
      />
    </>
  )
}

function Section({ title, children }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-[0.04em] text-label2">
        {title}
      </h2>
      {children}
    </section>
  )
}

/* ------------------------------------------------------------------- sheets */

function AccountSheet({ open, profile, onClose, onSaved }) {
  const [form, set] = useForm(open, {
    display_name: profile?.display_name ?? '',
    sex:          profile?.sex ?? '',
    birth_date:   profile?.birth_date ?? '',
    height_cm:    profile?.height_cm ?? '',
    goal:         profile?.goal ?? ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function save() {
    setSaving(true); setError(null)
    try {
      await updateProfile(profile.id, {
        display_name: form.display_name?.trim() || null,
        sex:          form.sex || null,
        birth_date:   form.birth_date || null,
        height_cm:    form.height_cm ? Number(form.height_cm) : null,
        goal:         form.goal || null
      })
      onSaved()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Personal details"
           footer={<Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>}>
      {error && <div className="mb-3"><ErrorNote error={error} /></div>}
      <Group className="mt-2">
        <Field label="Name" placeholder="Leonard" value={form.display_name ?? ''} onChange={set('display_name')} />
        <SelectField label="Sex" value={form.sex ?? ''} onChange={set('sex')} options={[
          { value: '', label: 'Not set' },
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
          { value: 'other', label: 'Other' }
        ]} />
        <Field label="Birth date" type="date" value={form.birth_date ?? ''} onChange={set('birth_date')} />
        <Field label="Height" type="number" inputMode="decimal" suffix="cm"
               value={form.height_cm ?? ''} onChange={set('height_cm')} />
      </Group>

      <Group className="mt-4">
        <SelectField label="Goal" value={form.goal ?? ''} onChange={set('goal')} options={[
          { value: '', label: 'Not set' },
          { value: 'build', label: 'Build muscle' },
          { value: 'lean', label: 'Lose body fat' },
          { value: 'maintain', label: 'Maintain' }
        ]} />
      </Group>
    </Sheet>
  )
}

function TrainingSheet({ open, profile, onClose, onSaved }) {
  const [form, set] = useForm(open, {
    unit:   profile?.unit ?? 'kg',
    bar_kg: profile?.bar_kg ?? 20
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await updateProfile(profile.id, {
        unit: form.unit,
        bar_kg: Number(form.bar_kg) || 20
      })
      onSaved()
    } finally { setSaving(false) }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Training preferences"
           footer={<Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>}>
      <Group className="mt-2">
        <SelectField label="Units" value={form.unit ?? 'kg'} onChange={set('unit')} options={[
          { value: 'kg', label: 'Kilograms' },
          { value: 'lb', label: 'Pounds' }
        ]} />
        <Field label="Bar weight" type="number" inputMode="decimal" suffix="kg"
               value={form.bar_kg ?? 20} onChange={set('bar_kg')} />
      </Group>
      <p className="mt-3 px-1 text-[13px] leading-relaxed text-label2">
        Most gyms use a 20 kg Olympic bar. Set 15 if you train on a women's bar, or 7 for a fixed
        EZ bar.
      </p>
    </Sheet>
  )
}

const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 }
const DEFAULT_MACRO_SPLIT = { protein: 0.3, carbs: 0.4, fat: 0.3 } // of calories, used only when starting from zero
const FIELD_FOR = { protein: 'goal_protein_g', carbs: 'goal_carbs_g', fat: 'goal_fat_g' }
const MACRO_KEYS = ['protein', 'carbs', 'fat']

/** Grams and percentage of calories, both editable — each keeps the other in
    sync instead of the percentage being a read-only derived label. The kcal
    figure in between spells out what the gram amount actually costs, so the
    jump from "180 g" to "30%" isn't left for the user to do in their head. */
function MacroField({ label, grams, pct, kcal, onGramsChange, onPctChange }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="w-[104px] shrink-0 text-[17px]">{label}</span>
      <div className="flex min-w-0 flex-1 items-baseline gap-1">
        <input
          type="number" inputMode="numeric"
          value={grams} onChange={onGramsChange}
          aria-label={`${label} grams`}
          className="w-12 min-w-0 shrink-0 bg-transparent text-[17px] tnum placeholder:text-label3 focus:outline-none"
        />
        <span className="shrink-0 text-[15px] text-label3">g</span>
      </div>
      <span className="shrink-0 text-[13px] text-label3 tnum">{kcal} kcal</span>
      <div className="flex shrink-0 items-baseline gap-1">
        <PercentInput
          value={pct} onChange={onPctChange}
          aria-label={`${label} percent of calories`}
          className="w-10 shrink-0 bg-transparent text-right text-[17px] tnum placeholder:text-label3 focus:outline-none"
        />
        <span className="shrink-0 text-[15px] text-label3">%</span>
      </div>
    </div>
  )
}

/** The percentage shown here is always a derived, rounded number — if the
    input displayed that value directly while the user is typing, clearing
    it snaps back to "0" instead of staying blank, and the next digit lands
    after that phantom zero ("60" -> "0" -> "04" instead of "4"). Keeping a
    local draft that only resyncs from the derived value while unfocused
    lets the field show exactly what was typed, the same as any plain text
    input, while still firing onChange to rescale the other macros live. */
function PercentInput({ value, onChange, ...props }) {
  const [draft, setDraft] = useState(String(value))
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) setDraft(String(value))
  }, [value])

  return (
    <input
      type="number"
      inputMode="numeric"
      value={draft}
      onFocus={() => { focused.current = true }}
      onBlur={() => { focused.current = false; setDraft(String(value)) }}
      onChange={(e) => { setDraft(e.target.value); onChange(e) }}
      {...props}
    />
  )
}

function GoalsSheet({ open, profile, onClose, onSaved }) {
  const [form, set, setForm] = useForm(open, {
    goal_kcal:      profile?.goal_kcal ?? 2500,
    goal_protein_g: profile?.goal_protein_g ?? 180,
    goal_carbs_g:   profile?.goal_carbs_g ?? 280,
    goal_fat_g:     profile?.goal_fat_g ?? 80,
    day_start_time: shortTime(profile?.day_start_time) || DEFAULT_DAY_START,
    day_end_time:   shortTime(profile?.day_end_time)   || DEFAULT_DAY_END
  })
  const [saving, setSaving] = useState(false)

  // Scaling calories rescales every macro from this snapshot, not from
  // whatever the previous keystroke landed on — see setCalories below.
  const calBasisRef = useRef(null)

  // Calories is always the exact sum of the macros — there's no separate
  // number to drift out of sync with them.
  function setMacroGrams(key) {
    return (e) => {
      setForm((f) => {
        const next = { ...f, [key]: e.target.value }
        const p   = Number(next.goal_protein_g) || 0
        const c   = Number(next.goal_carbs_g) || 0
        const fat = Number(next.goal_fat_g) || 0
        next.goal_kcal = Math.round(p * KCAL_PER_G.protein + c * KCAL_PER_G.carbs + fat * KCAL_PER_G.fat)
        return next
      })
    }
  }

  // Editing a macro's percentage holds total calories fixed: that macro's
  // grams move to hit the new share, and the other two rescale together
  // (keeping their ratio to each other) to soak up whatever share is left.
  function setMacroPct(macroKey) {
    return (e) => {
      const raw = e.target.value
      setForm((f) => {
        const kcalFor = (k) => (Number(f[FIELD_FOR[k]]) || 0) * KCAL_PER_G[k]
        const total = MACRO_KEYS.reduce((sum, k) => sum + kcalFor(k), 0) || Number(f.goal_kcal) || 0
        if (total <= 0) return { ...f, [FIELD_FOR[macroKey]]: raw }

        const newPct = Math.max(0, Math.min(100, Number(raw) || 0))
        const newKcalForKey = total * (newPct / 100)
        const remainingKcal = total - newKcalForKey
        const otherKeys = MACRO_KEYS.filter((k) => k !== macroKey)
        const otherKcalSum = otherKeys.reduce((sum, k) => sum + kcalFor(k), 0)

        const next = { ...f, [FIELD_FOR[macroKey]]: Math.round(newKcalForKey / KCAL_PER_G[macroKey]) }
        for (const k of otherKeys) {
          const share = otherKcalSum > 0 ? kcalFor(k) / otherKcalSum : 1 / otherKeys.length
          next[FIELD_FOR[k]] = Math.round((remainingKcal * share) / KCAL_PER_G[k])
        }

        next.goal_kcal = Math.round(
          MACRO_KEYS.reduce((sum, k) => sum + (Number(next[FIELD_FOR[k]]) || 0) * KCAL_PER_G[k], 0)
        )
        return next
      })
    }
  }

  // Editing calories directly rescales every macro by the same factor, so
  // each keeps the same share of calories it had a moment ago. Typing a
  // multi-digit number fires this once per keystroke ("1", "10", "100", …),
  // and a naive version that rescales from the CURRENT macros each time
  // collapses everything to 0g the moment an intermediate value like "1"
  // rounds every macro down to nothing — after which there's no ratio left
  // to scale back up from. Anchoring every keystroke of one edit to the
  // macros as they stood when the field was first focused avoids that.
  function setCalories(e) {
    const raw = e.target.value
    const newKcal = Number(raw) || 0
    setForm((f) => {
      const basis = calBasisRef.current ?? {
        p:   Number(f.goal_protein_g) || 0,
        c:   Number(f.goal_carbs_g) || 0,
        fat: Number(f.goal_fat_g) || 0
      }
      calBasisRef.current = basis
      const oldKcal = basis.p * KCAL_PER_G.protein + basis.c * KCAL_PER_G.carbs + basis.fat * KCAL_PER_G.fat

      if (oldKcal <= 0) {
        return {
          ...f,
          goal_kcal: raw,
          goal_protein_g: Math.round((newKcal * DEFAULT_MACRO_SPLIT.protein) / KCAL_PER_G.protein),
          goal_carbs_g:   Math.round((newKcal * DEFAULT_MACRO_SPLIT.carbs) / KCAL_PER_G.carbs),
          goal_fat_g:     Math.round((newKcal * DEFAULT_MACRO_SPLIT.fat) / KCAL_PER_G.fat)
        }
      }

      const scale = newKcal / oldKcal
      return {
        ...f,
        goal_kcal: raw,
        goal_protein_g: Math.round(basis.p * scale),
        goal_carbs_g:   Math.round(basis.c * scale),
        goal_fat_g:     Math.round(basis.fat * scale)
      }
    })
  }

  const p   = Number(form.goal_protein_g) || 0
  const c   = Number(form.goal_carbs_g) || 0
  const fat = Number(form.goal_fat_g) || 0
  const totalKcal = p * KCAL_PER_G.protein + c * KCAL_PER_G.carbs + fat * KCAL_PER_G.fat
  const pctOf = (grams, per) => (totalKcal > 0 ? Math.round((grams * per / totalKcal) * 100) : 0)

  // An end-before-start window leaves the Nutrition tab's hourly timeline
  // with zero rows to show, so it isn't a valid state to save.
  const dayStartVal = form.day_start_time || DEFAULT_DAY_START
  const dayEndVal   = form.day_end_time   || DEFAULT_DAY_END
  const dayRangeInvalid = dayEndVal <= dayStartVal

  async function save() {
    setSaving(true)
    try {
      await updateProfile(profile.id, {
        goal_kcal:      Math.round(totalKcal),
        goal_protein_g: p,
        goal_carbs_g:   c,
        goal_fat_g:     fat,
        day_start_time: dayStartVal,
        day_end_time:   dayEndVal
      })
      onSaved()
    } finally { setSaving(false) }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Nutrition goals"
           footer={<Button onClick={save} disabled={saving || dayRangeInvalid}>{saving ? 'Saving…' : 'Save'}</Button>}>
      <Group className="mt-2">
        <Field label="Calories" type="number" inputMode="numeric" suffix="kcal"
               value={form.goal_kcal ?? ''} onChange={setCalories}
               onFocus={() => { calBasisRef.current = null }} />
        <MacroField label="Protein" grams={form.goal_protein_g ?? ''} pct={pctOf(p, KCAL_PER_G.protein)}
                    kcal={Math.round(p * KCAL_PER_G.protein)}
                    onGramsChange={setMacroGrams('goal_protein_g')} onPctChange={setMacroPct('protein')} />
        <MacroField label="Carbs" grams={form.goal_carbs_g ?? ''} pct={pctOf(c, KCAL_PER_G.carbs)}
                    kcal={Math.round(c * KCAL_PER_G.carbs)}
                    onGramsChange={setMacroGrams('goal_carbs_g')} onPctChange={setMacroPct('carbs')} />
        <MacroField label="Fat" grams={form.goal_fat_g ?? ''} pct={pctOf(fat, KCAL_PER_G.fat)}
                    kcal={Math.round(fat * KCAL_PER_G.fat)}
                    onGramsChange={setMacroGrams('goal_fat_g')} onPctChange={setMacroPct('fat')} />
      </Group>
      <p className="mt-3 px-1 text-[13px] leading-relaxed text-label2">
        Calories always match the sum of your macros. Change calories and the macros rescale to keep
        the same split; change a macro's grams or its percentage and the other two adjust to match.
      </p>

      <Group className="mt-4">
        <Field label="Day starts" type="time"
               value={form.day_start_time ?? DEFAULT_DAY_START} onChange={set('day_start_time')} />
        <Field label="Day ends" type="time"
               value={form.day_end_time ?? DEFAULT_DAY_END} onChange={set('day_end_time')} />
      </Group>
      {dayRangeInvalid ? (
        <p className="mt-3 px-1 text-[13px] leading-relaxed text-danger">
          Day ends must be later than day starts.
        </p>
      ) : (
        <p className="mt-3 px-1 text-[13px] leading-relaxed text-label2">
          Bounds the time picker when you log food in the Nutrition tab — handy if you eat past
          midnight or start early.
        </p>
      )}
    </Sheet>
  )
}

