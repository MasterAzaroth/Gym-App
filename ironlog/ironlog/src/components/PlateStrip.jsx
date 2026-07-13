import { loadPerSide, BAR_KG } from '../lib/plates'

/**
 * The signature element: shows what actually goes on ONE side of the bar.
 * Heavier plates are drawn taller and thicker, exactly as they sit on a barbell.
 */
export default function PlateStrip({ weightKg, barKg = BAR_KG, showLabel = true }) {
  const { plates, leftover, loadable } = loadPerSide(weightKg, barKg)

  if (!loadable) {
    return (
      <p className="font-mono text-xs text-steel">Below bar weight ({barKg} kg)</p>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-10 items-center" aria-hidden="true">
        {/* sleeve */}
        <div className="h-1.5 w-3 rounded-l-sm bg-steel" />
        {plates.map((p, i) => {
          const height = 14 + Math.min(p.kg, 25) * 1.05
          const width = 5 + Math.min(p.kg, 25) * 0.22
          return (
            <div
              key={i}
              className="mx-[0.5px] rounded-[2px] border border-iron/25"
              style={{
                height: `${height}px`,
                width: `${width}px`,
                backgroundColor: p.color
              }}
            />
          )
        })}
        <div className="h-1.5 w-4 rounded-r-sm bg-steel" />
      </div>

      {showLabel && (
        <p className="font-mono text-[11px] leading-tight text-steel tnum">
          {plates.length === 0
            ? 'Empty bar'
            : plates.map((p) => p.label).join(' · ')}
          {leftover > 0 && (
            <span className="text-plate-red"> +{leftover} short</span>
          )}
          <span className="block text-[10px] uppercase tracking-wider text-steel/70">
            per side
          </span>
        </p>
      )}
    </div>
  )
}
