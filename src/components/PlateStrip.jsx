import { loadPerSide, BAR_KG } from '../lib/plates'

/** What actually goes on ONE side of the bar. Kept restrained to suit the rest of the UI. */
export default function PlateStrip({ weightKg, barKg = BAR_KG, showLabel = true }) {
  const { plates, leftover, loadable } = loadPerSide(weightKg, barKg)

  if (!loadable) {
    return <p className="text-[13px] text-label3">Below bar weight ({barKg} kg)</p>
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 items-center" aria-hidden="true">
        <div className="h-1.5 w-3 rounded-l-full bg-label3" />
        {plates.map((p, i) => (
          <div
            key={i}
            className="mx-[0.5px] rounded-[2px]"
            style={{
              height: `${14 + Math.min(p.kg, 25) * 1.05}px`,
              width: `${5 + Math.min(p.kg, 25) * 0.22}px`,
              backgroundColor: p.color
            }}
          />
        ))}
        <div className="h-1.5 w-4 rounded-r-full bg-label3" />
      </div>

      {showLabel && (
        <div className="text-[13px] leading-tight tnum">
          <p className="font-medium text-label">
            {plates.length === 0 ? 'Empty bar' : plates.map((p) => p.label).join(' · ')}
            {leftover > 0 && <span className="text-danger"> · {leftover} short</span>}
          </p>
          <p className="text-label3">per side</p>
        </div>
      )}
    </div>
  )
}
