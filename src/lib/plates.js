// Bar loading maths. Given a target weight, work out what actually goes on the bar.
// This powers the plate strip — the one piece of UI that shows you the barbell,
// not just a number.

export const BAR_KG = 20

// Standard gym plates, heaviest first. Colours are IWF competition colours.
export const PLATES_KG = [
  { kg: 25,   color: '#C8102E', label: '25' },
  { kg: 20,   color: '#0B5FA5', label: '20' },
  { kg: 15,   color: '#E8B10E', label: '15' },
  { kg: 10,   color: '#1E7A45', label: '10' },
  { kg: 5,    color: '#D8D8D4', label: '5' },
  { kg: 2.5,  color: '#17191C', label: '2.5' },
  { kg: 1.25, color: '#4A5058', label: '1.25' }
]

/** Plates to load on ONE side of the bar. */
export function loadPerSide(totalKg, barKg = BAR_KG) {
  const perSide = (totalKg - barKg) / 2
  if (!Number.isFinite(perSide) || perSide < 0) {
    return { plates: [], leftover: 0, loadable: false }
  }
  let remaining = perSide
  const plates = []
  for (const plate of PLATES_KG) {
    while (remaining >= plate.kg - 0.001) {
      plates.push(plate)
      remaining = Math.round((remaining - plate.kg) * 1000) / 1000
    }
  }
  return { plates, leftover: Math.round(remaining * 100) / 100, loadable: true }
}

/** Round a weight to something you can actually load on a bar. */
export function roundToLoadable(totalKg, barKg = BAR_KG, increment = 2.5) {
  const perSide = Math.max(0, (totalKg - barKg) / 2)
  const rounded = Math.round(perSide / (increment / 2)) * (increment / 2)
  return barKg + rounded * 2
}

/** Estimated 1RM (Epley). */
export function epley1RM(weightKg, reps) {
  if (!weightKg || !reps) return 0
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10
}
