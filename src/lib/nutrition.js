/** Macros are stored per 100 g. Scale a food to an actual portion. */
export function scaleFood(food, grams) {
  const f = Number(grams) / 100
  return {
    kcal:      round(Number(food.kcal_per_100g) * f),
    protein_g: round(Number(food.protein_per_100g) * f, 1),
    carbs_g:   round(Number(food.carbs_per_100g) * f, 1),
    fat_g:     round(Number(food.fat_per_100g) * f, 1)
  }
}

export function sumEntries(entries = []) {
  return entries.reduce(
    (t, e) => ({
      kcal:      t.kcal + Number(e.kcal || 0),
      protein_g: t.protein_g + Number(e.protein_g || 0),
      carbs_g:   t.carbs_g + Number(e.carbs_g || 0),
      fat_g:     t.fat_g + Number(e.fat_g || 0)
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  )
}

function round(n, dp = 0) {
  const m = 10 ** dp
  return Math.round((Number(n) || 0) * m) / m
}

export const MEALS = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch',     label: 'Lunch' },
  { id: 'dinner',    label: 'Dinner' },
  { id: 'snack',     label: 'Snacks' }
]

/** Local YYYY-MM-DD. Never toISOString() here — it shifts to UTC and files your
    late dinner under tomorrow. */
export function toISODate(date) {
  const d = new Date(date)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/** Monday of the week containing `date`, at local midnight. */
export function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay() // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day
  return addDays(d, diff)
}

/** The 7 dates (Mon–Sun) of the week containing `date`. */
export function getWeekDates(date) {
  const monday = startOfWeek(date)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

export function friendlyDate(date) {
  const iso = toISODate(date)
  if (iso === toISODate(new Date())) return 'Today'
  if (iso === toISODate(addDays(new Date(), -1))) return 'Yesterday'
  if (iso === toISODate(addDays(new Date(), 1))) return 'Tomorrow'
  return new Date(date).toLocaleDateString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short'
  })
}
