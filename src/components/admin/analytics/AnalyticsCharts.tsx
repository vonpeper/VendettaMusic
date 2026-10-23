"use client"

import { useState } from "react"

interface TrendPoint {
  date: string
  val1: number
  val2: number
}

interface DualLineChartProps {
  data: TrendPoint[]
  label1: string
  label2: string
  color1?: string
  color2?: string
  height?: number
}

export function DualTrendChart({
  data,
  label1,
  label2,
  color1 = "#3b82f6", // blue
  color2 = "#10b981", // emerald
  height = 220,
}: DualLineChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm border border-border/30 rounded-2xl bg-card/40">
        No hay datos suficientes para graficar el periodo seleccionado.
      </div>
    )
  }

  const paddingLeft = 50
  const paddingRight = 20
  const paddingTop = 24
  const paddingBottom = 32

  const width = 760
  const chartW = width - paddingLeft - paddingRight
  const chartH = height - paddingTop - paddingBottom

  const max1 = Math.max(...data.map(d => d.val1), 1)
  const max2 = Math.max(...data.map(d => d.val2), 1)
  const globalMax = Math.max(max1, max2)

  const n = data.length
  const stepX = n > 1 ? chartW / (n - 1) : chartW

  const getPoints = (key: "val1" | "val2", maxVal: number) => {
    return data.map((d, i) => {
      const x = paddingLeft + i * stepX
      const y = paddingTop + chartH - (d[key] / maxVal) * chartH
      return { x, y, raw: d }
    })
  }

  const pts1 = getPoints("val1", globalMax)
  const pts2 = getPoints("val2", globalMax)

  const path1 = pts1.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, "")
  const path2 = pts2.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, "")

  // Area under path1
  const area1 = pts1.length > 0
    ? `${path1} L ${pts1[pts1.length - 1].x.toFixed(1)} ${(paddingTop + chartH).toFixed(1)} L ${pts1[0].x.toFixed(1)} ${(paddingTop + chartH).toFixed(1)} Z`
    : ""

  const yTicks = [0, 0.5, 1]

  const activePoint = hoverIdx !== null ? data[hoverIdx] : null
  const activeX = hoverIdx !== null ? paddingLeft + hoverIdx * stepX : null

  return (
    <div className="w-full relative select-none">
      {/* Legend & Hover Badge */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color1 }} />
            <span className="font-semibold text-foreground/80">{label1}</span>
            {activePoint && (
              <span className="font-bold text-foreground ml-1">
                {activePoint.val1.toLocaleString("es-MX")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color2 }} />
            <span className="font-semibold text-foreground/80">{label2}</span>
            {activePoint && (
              <span className="font-bold text-foreground ml-1">
                {activePoint.val2.toLocaleString("es-MX")}
              </span>
            )}
          </div>
        </div>
        {activePoint && (
          <span className="text-[11px] font-mono text-muted-foreground bg-card/60 px-2 py-0.5 rounded border border-border/40">
            {activePoint.date}
          </span>
        )}
      </div>

      <div className="overflow-x-auto overflow-y-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[500px]"
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id={`grad1-${label1.replace(/\s+/g, "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color1} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color1} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map(t => {
            const y = paddingTop + chartH - t * chartH
            const val = Math.round(t * globalMax)
            return (
              <g key={t}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray={t > 0 ? "4 4" : "none"}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize={10}
                  className="fill-muted-foreground font-mono"
                >
                  {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                </text>
              </g>
            )
          })}

          {/* Area fill */}
          {area1 && (
            <path
              d={area1}
              fill={`url(#grad1-${label1.replace(/\s+/g, "")})`}
            />
          )}

          {/* Line 2 (background secondary) */}
          <path
            d={path2}
            fill="none"
            stroke={color2}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Line 1 (primary) */}
          <path
            d={path1}
            fill="none"
            stroke={color1}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive vertical hover bar */}
          {activeX !== null && (
            <line
              x1={activeX}
              y1={paddingTop}
              x2={activeX}
              y2={paddingTop + chartH}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          )}

          {/* Data Points on hover */}
          {hoverIdx !== null && (
            <>
              <circle
                cx={pts1[hoverIdx].x}
                cy={pts1[hoverIdx].y}
                r={4.5}
                fill={color1}
                stroke="#07080D"
                strokeWidth={2}
              />
              <circle
                cx={pts2[hoverIdx].x}
                cy={pts2[hoverIdx].y}
                r={4}
                fill={color2}
                stroke="#07080D"
                strokeWidth={2}
              />
            </>
          )}

          {/* X Axis Date labels (sample 5-6 points evenly) */}
          {data.map((d, i) => {
            const step = Math.max(1, Math.floor(n / 6))
            if (i % step !== 0 && i !== n - 1) return null
            const x = paddingLeft + i * stepX
            const shortDate = d.date.length >= 10 ? d.date.slice(5) : d.date
            return (
              <text
                key={i}
                x={x}
                y={paddingTop + chartH + 18}
                textAnchor="middle"
                fontSize={9.5}
                className="fill-muted-foreground font-mono"
              >
                {shortDate}
              </text>
            )
          })}

          {/* Hover capture zones across the width */}
          {data.map((_, i) => {
            const x = paddingLeft + i * stepX - stepX / 2
            const w = stepX
            return (
              <rect
                key={i}
                x={Math.max(paddingLeft, x)}
                y={paddingTop}
                width={w}
                height={chartH}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIdx(i)}
              />
            )
          })}
        </svg>
      </div>
    </div>
  )
}

interface SingleBarItem {
  label: string
  sublabel?: string
  value: number
  total: number
  color?: string
}

export function HorizontalBarList({ items }: { items: SingleBarItem[] }) {
  if (!items || items.length === 0) {
    return <p className="text-xs text-muted-foreground italic">Sin datos registrados.</p>
  }

  return (
    <div className="space-y-3.5">
      {items.map((it, idx) => {
        const pct = it.total > 0 ? Math.round((it.value / it.total) * 100) : 0
        return (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground truncate max-w-[220px]" title={it.label}>
                {it.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground">{it.value.toLocaleString("es-MX")}</span>
                <span className="font-mono font-bold text-foreground/80 w-10 text-right">{pct}%</span>
              </div>
            </div>
            <div className="w-full bg-border/40 h-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(3, pct))}%`,
                  backgroundColor: it.color || "#3b82f6",
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
