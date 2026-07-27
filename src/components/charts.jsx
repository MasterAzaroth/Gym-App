import { useMemo, useRef, useState } from 'react'

/* Same technique as the original Insights Sparkline: a fixed viewBox drawn
   with preserveAspectRatio="none", no resize observer or JS measuring — the
   browser stretches it to fill whatever box `w-full` gives it. No chart
   library; these are the two coordinate-plane primitives this app needs
   (time series, ranked bars) built the same hand-rolled way. */

const WIDTH = 300

function formatDefault(v) {
  return Math.round(v).toLocaleString()
}

function niceRange(values) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  return min === max ? [min - 1, max + 1] : [min, max]
}

function dateLabel(t) {
  return new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

/**
 * A shared-scale time-series chart. `series` is
 * `[{ id, label?, colorClassName, points: [{x: Date, y: number}], style?: 'line' | 'dots' }]`.
 * A text readout above the chart (not a floating tooltip — nothing else in
 * this app positions one) shows the values nearest the pointer, defaulting to
 * the latest point before any interaction.
 */
export function LineChart({ series, height = 120, goalY, formatY = formatDefault }) {
  const svgRef = useRef(null)
  const [activeFraction, setActiveFraction] = useState(null)

  const allPoints = useMemo(() => series.flatMap((s) => s.points), [series])

  const scale = useMemo(() => {
    if (allPoints.length === 0) return null
    const xs = allPoints.map((p) => p.x.getTime())
    const ys = allPoints.map((p) => p.y)
    if (goalY != null) ys.push(goalY)
    const [yMin, yMax] = niceRange(ys)
    return { xMin: Math.min(...xs), xMax: Math.max(...xs), yMin, yMax }
  }, [allPoints, goalY])

  if (!scale) return null

  const xSpan = scale.xMax - scale.xMin || 1
  const ySpan = scale.yMax - scale.yMin || 1
  const toX = (t) => ((t - scale.xMin) / xSpan) * WIDTH
  const toY = (v) => height - ((v - scale.yMin) / ySpan) * (height - 12) - 6

  const activeTime = activeFraction == null ? scale.xMax : scale.xMin + activeFraction * xSpan
  const nearestPoint = (points) => points.reduce((best, p) => {
    if (!best) return p
    return Math.abs(p.x.getTime() - activeTime) < Math.abs(best.x.getTime() - activeTime) ? p : best
  }, null)
  const activeDate = nearestPoint(allPoints)?.x

  const handlePointer = (e) => {
    const rect = svgRef.current.getBoundingClientRect()
    setActiveFraction(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)))
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {activeDate && <span className="text-[13px] text-label2 tnum">{dateLabel(activeDate)}</span>}
        {series.map((s) => {
          const point = nearestPoint(s.points)
          return (
            <span key={s.id} className="text-[15px] tnum">
              <span className={`font-semibold ${s.colorClassName}`}>{point ? formatY(point.y) : '–'}</span>
              {s.label && <span className="ml-1 text-[12px] font-medium text-label2">{s.label}</span>}
            </span>
          )
        })}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="w-full"
        preserveAspectRatio="none"
        onPointerMove={handlePointer}
        onPointerLeave={() => setActiveFraction(null)}
        aria-hidden="true"
      >
        {goalY != null && (
          <line
            x1="0" x2={WIDTH} y1={toY(goalY)} y2={toY(goalY)}
            className="text-label3" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {series.map((s) => (
          s.style === 'dots' ? (
            <g key={s.id} className={s.colorClassName} fill="currentColor">
              {s.points.map((p, i) => (
                <circle key={i} cx={toX(p.x.getTime())} cy={toY(p.y)} r="2" />
              ))}
            </g>
          ) : (
            <path
              key={s.id}
              d={s.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.x.getTime()).toFixed(1)} ${toY(p.y).toFixed(1)}`).join(' ')}
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={s.colorClassName}
              vectorEffect="non-scaling-stroke"
            />
          )
        ))}
      </svg>

      <div className="mt-1 flex justify-between text-[11px] text-label3">
        <span>{dateLabel(scale.xMin)}</span>
        <span>{dateLabel(scale.xMin + xSpan / 2)}</span>
        <span>{dateLabel(scale.xMax)}</span>
      </div>
    </div>
  )
}

/**
 * A vertical bar chart. `data` is `[{ x: string, y: number }]` — `x` is the
 * label shown in the readout and isn't otherwise drawn (no axis labels under
 * every bar; that many labels on a phone width just becomes noise).
 */
export function BarChart({
  data, height = 120, goalY, formatY = formatDefault, colorClassName = 'text-violet',
  dangerPredicate, renderMeta
}) {
  const svgRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(null)

  const scale = useMemo(() => {
    if (!data.length) return null
    const ys = data.map((d) => d.y)
    if (goalY != null) ys.push(goalY)
    const [yMin, yMax] = niceRange([0, ...ys])
    return { yMin, yMax }
  }, [data, goalY])

  if (!scale) return null

  const ySpan = scale.yMax - scale.yMin || 1
  const toY = (v) => height - ((v - scale.yMin) / ySpan) * (height - 12) - 6
  const baseline = toY(scale.yMin)

  const n = data.length
  const gap = 2
  const barWidth = (WIDTH - gap * (n - 1)) / n

  const index = activeIndex ?? n - 1
  const active = data[index]
  const activeDanger = dangerPredicate?.(active)

  const handlePointer = (e) => {
    const rect = svgRef.current.getBoundingClientRect()
    const fraction = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    setActiveIndex(Math.min(n - 1, Math.floor(fraction * n)))
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline gap-3">
        <span className="text-[13px] text-label2">{active.x}</span>
        <span className={`text-[15px] font-semibold tnum ${activeDanger ? 'text-danger' : colorClassName}`}>
          {formatY(active.y)}
        </span>
        {renderMeta && <span className="text-[13px] text-label2">{renderMeta(active)}</span>}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="w-full"
        preserveAspectRatio="none"
        onPointerMove={handlePointer}
        onPointerLeave={() => setActiveIndex(null)}
        aria-hidden="true"
      >
        {goalY != null && (
          <line
            x1="0" x2={WIDTH} y1={toY(goalY)} y2={toY(goalY)}
            className="text-label3" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {data.map((d, i) => {
          const isDanger = dangerPredicate?.(d)
          const top = toY(d.y)
          return (
            <rect
              key={i}
              x={i * (barWidth + gap)}
              y={Math.min(top, baseline)}
              width={barWidth}
              height={Math.abs(baseline - top)}
              rx="2"
              fill="currentColor"
              className={isDanger ? 'text-danger' : colorClassName}
              opacity={i === index ? 1 : 0.55}
            />
          )
        })}
      </svg>
    </div>
  )
}

/**
 * A ranked horizontal-bar list — div/width% bars like `MacroBar`, not SVG,
 * since this is a sorted list rather than a coordinate-plane chart. The row
 * label carries identity, so no separate legend is needed even with several
 * rows. Caller is expected to pre-sort `items` descending.
 */
export function RankedBars({ items, colorClassName = 'text-violet', formatValue = formatDefault }) {
  if (!items.length) return null
  const max = Math.max(...items.map((i) => i.value)) || 1
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-[13px] font-medium text-label2">{item.label}</span>
            <span className="text-[13px] font-semibold tnum">{formatValue(item.value)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-separator">
            <div
              className={`h-full rounded-full ${colorClassName}`}
              style={{ width: `${(item.value / max) * 100}%`, backgroundColor: 'currentColor' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
