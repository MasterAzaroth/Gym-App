import { useId, useMemo, useRef, useState } from 'react'

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
  const activePoints = useMemo(
    () => series.map((s) => ({ ...s, active: nearestPoint(s.points) })),
    [series, activeTime] // eslint-disable-line react-hooks/exhaustive-deps
  )
  const activeDate = nearestPoint(allPoints)?.x

  const handlePointer = (e) => {
    const rect = svgRef.current.getBoundingClientRect()
    setActiveFraction(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)))
  }

  // Pointer capture + touch-action:none keep move events flowing for the
  // whole drag on touch — without them the browser reads the gesture as a
  // page scroll after a few pixels and the readout freezes mid-swipe.
  // Lifting a touch snaps back to the latest point (there's no hover-away to
  // do that job the way there is with a mouse); a mouse leaving the chart
  // still resets via onPointerLeave as before.
  const handleDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    handlePointer(e)
  }
  const handleUp = (e) => {
    if (e.pointerType !== 'mouse') setActiveFraction(null)
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {activeDate && <span className="text-[13px] text-label2 tnum">{dateLabel(activeDate)}</span>}
        {activePoints.map((s) => (
          <span key={s.id} className="text-[15px] tnum">
            <span className={`font-semibold ${s.colorClassName}`}>{s.active ? formatY(s.active.y) : '–'}</span>
            {s.label && <span className="ml-1 text-[12px] font-medium text-label2">{s.label}</span>}
          </span>
        ))}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="w-full touch-none"
        preserveAspectRatio="none"
        onPointerDown={handleDown}
        onPointerMove={handlePointer}
        onPointerUp={handleUp}
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
        {activeFraction != null && (
          <line
            x1={toX(activeTime).toFixed(1)} x2={toX(activeTime).toFixed(1)} y1="0" y2={height}
            className="text-label3" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3"
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
        {activePoints.map((s) => s.active && (
          <circle
            key={`active-${s.id}`}
            cx={toX(s.active.x.getTime()).toFixed(1)} cy={toY(s.active.y).toFixed(1)} r="3.5"
            className={s.colorClassName} fill="currentColor" stroke="rgb(var(--color-surface))" strokeWidth="1.5"
          />
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

// Bars sit centered in an even slot per category rather than filling it edge
// to edge — capped absolute width so two or three categories (e.g. an
// upper-vs-lower comparison) still read as slim capsules, not a couple of
// fat blocks. rx = barWidth / 2 rounds all four corners into a full capsule,
// matching the pill shape MacroBar/RadialGauge already use elsewhere.
function barGeometry(n) {
  const slot = WIDTH / n
  const width = Math.min(slot * 0.56, 30)
  return { slot, width, x: (i) => i * slot + (slot - width) / 2 }
}

/**
 * A vertical bar chart. `data` is `[{ x: string, y: number, colorClassName? }]`.
 * `x` doubles as the always-visible label under each bar and the readout
 * above the chart. Tapping (or dragging across) a bar selects it and the
 * selection sticks — it doesn't snap back on release, so the readout keeps
 * showing what was tapped. Each item may carry its own `colorClassName`,
 * falling back to the shared prop — used when bars represent distinct
 * categories (e.g. upper vs lower body) rather than one series over time.
 */
export function BarChart({
  data, height = 120, goalY, formatY = formatDefault, colorClassName = 'text-violet',
  dangerPredicate, renderMeta, showLabels = true
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
  const { width: barWidth, x: barX } = barGeometry(n)

  const index = activeIndex ?? n - 1
  const active = data[index]
  const activeDanger = dangerPredicate?.(active)
  const activeColor = activeDanger ? 'text-danger' : (active.colorClassName ?? colorClassName)

  const handlePointer = (e) => {
    const rect = svgRef.current.getBoundingClientRect()
    const fraction = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    setActiveIndex(Math.min(n - 1, Math.floor(fraction * n)))
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline gap-3">
        <span className="text-[13px] text-label2">{active.x}</span>
        <span className={`text-[15px] font-semibold tnum ${activeColor}`}>
          {formatY(active.y)}
        </span>
        {renderMeta && <span className="text-[13px] text-label2">{renderMeta(active)}</span>}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="w-full touch-none"
        preserveAspectRatio="none"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); handlePointer(e) }}
        onPointerMove={handlePointer}
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
              x={barX(i)}
              y={Math.min(top, baseline)}
              width={barWidth}
              height={Math.max(Math.abs(baseline - top), 0.01)}
              rx={barWidth / 2}
              fill="currentColor"
              className={isDanger ? 'text-danger' : (d.colorClassName ?? colorClassName)}
              opacity={i === index ? 1 : 0.85}
            />
          )
        })}
      </svg>

      {showLabels && (
        <div className="mt-1.5 flex">
          {data.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`flex-1 truncate px-0.5 text-center text-[11px] font-medium ${
                i === index ? (d.colorClassName ?? colorClassName) : 'text-label3'
              }`}
            >
              {d.x}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * A stacked vertical bar chart — same drag-to-inspect interaction as
 * BarChart, but each bar is `segments` (`[{ value, color }]`) stacked
 * bottom to top instead of one solid color. Segments are clipped to a
 * shared rounded-rect per bar so the stack reads as one pill, not a column
 * of little rounded blocks with gaps between them.
 */
export function StackedBarChart({ data, height = 140, goalY, formatY = formatDefault, renderMeta }) {
  const svgRef = useRef(null)
  const uid = useId()
  const [activeIndex, setActiveIndex] = useState(null)

  const totals = useMemo(() => data.map((d) => d.segments.reduce((s, seg) => s + seg.value, 0)), [data])

  const scale = useMemo(() => {
    if (!data.length) return null
    const ys = [...totals]
    if (goalY != null) ys.push(goalY)
    const [yMin, yMax] = niceRange([0, ...ys])
    return { yMin, yMax }
  }, [data, totals, goalY])

  if (!scale) return null

  const ySpan = scale.yMax - scale.yMin || 1
  const toY = (v) => height - ((v - scale.yMin) / ySpan) * (height - 12) - 6
  const baseline = toY(scale.yMin)

  const n = data.length
  const { width: barWidth, x: barX } = barGeometry(n)

  const index = activeIndex ?? n - 1
  const active = data[index]

  const handlePointer = (e) => {
    const rect = svgRef.current.getBoundingClientRect()
    const fraction = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    setActiveIndex(Math.min(n - 1, Math.floor(fraction * n)))
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[13px] text-label2">{active.x}</span>
        <span className="text-[15px] font-semibold tnum">{formatY(totals[index])}</span>
        {renderMeta && <span className="text-[13px] text-label2">{renderMeta(active)}</span>}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="w-full touch-none"
        preserveAspectRatio="none"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); handlePointer(e) }}
        onPointerMove={handlePointer}
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
          const total = totals[i]
          const x = barX(i)
          const top = toY(total)
          const barTop = Math.min(top, baseline)
          const barHeight = Math.max(Math.abs(baseline - top), 0.01)
          const clipId = `${uid}-bar-${i}`
          let cursor = scale.yMin
          return (
            <g key={i} opacity={i === index ? 1 : 0.85}>
              <clipPath id={clipId}>
                <rect x={x} y={barTop} width={barWidth} height={barHeight} rx={barWidth / 2} />
              </clipPath>
              <g clipPath={`url(#${clipId})`}>
                {d.segments.map((seg, j) => {
                  const segBottom = toY(cursor)
                  cursor += seg.value
                  const segTop = toY(cursor)
                  return (
                    <rect
                      key={j}
                      x={x}
                      y={Math.min(segTop, segBottom)}
                      width={barWidth}
                      height={Math.abs(segBottom - segTop)}
                      fill={seg.color}
                    />
                  )
                })}
              </g>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/**
 * A circular progress indicator built from a CSS conic-gradient — no SVG arc
 * math to get wrong. Cuts a donut hole (matching the card's own background)
 * with the value centered inside it. Same data as a MacroBar, just as a
 * radial shape instead of a linear one.
 */
export function RadialGauge({ value, goal, color, label, size = 84, formatValue = formatDefault }) {
  const rawPct = goal > 0 ? value / goal : 0
  const pct = Math.min(rawPct, 1)
  const angle = pct * 360
  const thickness = size * 0.17

  // Past 100%, the gauge has lapped itself — redraw the overshot portion
  // from the top in a darker shade of the same color so a second lap over
  // the first reads as "over goal" rather than looking identical to 100%.
  const overshootPct = Math.min(Math.max(rawPct - 1, 0), 1)
  const overshootAngle = overshootPct * 360
  const overshootColor = `color-mix(in srgb, ${color} 65%, black)`

  const background =
    angle <= 0
      ? 'rgb(var(--color-separator))'
      : overshootAngle > 0
        ? `conic-gradient(${overshootColor} ${overshootAngle}deg, ${color} ${overshootAngle}deg 360deg)`
        : `conic-gradient(${color} ${angle}deg, rgb(var(--color-separator)) ${angle}deg 360deg)`

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative rounded-full" style={{ width: size, height: size, background }}>
        <div
          className="absolute flex items-center justify-center rounded-full bg-surface"
          style={{ inset: thickness }}
        >
          <span className="text-[13px] font-semibold tnum">{formatValue(value)}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[11px] text-label2">{label}</p>
      </div>
    </div>
  )
}
