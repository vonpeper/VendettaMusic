"use client"

const MXN = (v: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(v)

export interface MonthChartData {
  month:         string
  income:        number   // ingresos reales confirmados
  lost:          number   // pipeline perdido (EXPIRED) ese mes
  conversionPct: number   // tasa de cierre 0-100
  count:         number   // shows confirmados
}

export interface ChartMicroKPIs {
  avgTicket:       number
  avgDaysToClose:  number
  topPackage:      string
  topPackagePct:   number
  peakMonthLabel:  string
  peakMonthIncome: number
}

interface Props {
  data: MonthChartData[]
  kpis: ChartMicroKPIs
}

// ── Dimensiones SVG ─────────────────────────────────────────
const PL = 72   // padding izquierdo (eje Y ingresos)
const PR = 46   // padding derecho   (eje Y conversión)
const PT = 30   // padding superior
const PB = 46   // padding inferior  (etiquetas X)
const CH = 188  // altura del área de gráfica

export function IncomeChart({ data, kpis }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Sin datos de ingresos aún.
      </div>
    )
  }

  const maxVal    = Math.max(...data.map(d => d.income + d.lost), 1)
  const n         = data.length
  const GRP       = 76   // ancho de cada grupo mes
  const BW        = 28   // ancho de cada barra
  const BGAP      = 4    // separación entre las dos barras del grupo
  const totalW    = PL + n * GRP + PR
  const totalH    = PT + CH + PB

  // Líneas de referencia eje Y
  const yLines = [0, 0.25, 0.5, 0.75, 1.0]

  // Puntos de la línea de conversión
  const linePoints = data.map((d, i) => ({
    x:   PL + i * GRP + GRP / 2,
    y:   PT + CH - Math.min(d.conversionPct, 100) / 100 * CH,
    pct: d.conversionPct,
  }))

  // Path de área bajo la línea de conversión
  const areaPath = linePoints.length > 1
    ? [
        `M ${linePoints[0].x} ${PT + CH}`,
        ...linePoints.map(p => `L ${p.x} ${p.y}`),
        `L ${linePoints[linePoints.length - 1].x} ${PT + CH}`,
        "Z",
      ].join(" ")
    : ""

  return (
    <div className="space-y-5">

      {/* ── SVG Chart ── */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${totalW} ${totalH}`}
          className="w-full"
          style={{ minWidth: `${Math.max(totalW, 320)}px` }}
        >
          <defs>
            <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#E91E63" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#880E4F" stopOpacity={0.75} />
            </linearGradient>
            <linearGradient id="gLost" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#FF5722" stopOpacity={0.72} />
              <stop offset="100%" stopColor="#BF360C" stopOpacity={0.50} />
            </linearGradient>
            <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#E91E63" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#E91E63" stopOpacity={0.00} />
            </linearGradient>
          </defs>

          {/* ── Grid Y ── */}
          {yLines.map(pct => {
            const y = PT + CH - pct * CH
            return (
              <g key={pct}>
                <line
                  x1={PL} y1={y} x2={totalW - PR} y2={y}
                  stroke="rgba(0,0,0,0.07)"
                  strokeWidth={1}
                  strokeDasharray={pct === 0 ? "none" : "3,4"}
                />
                {/* Eje izquierdo: ingresos */}
                {pct > 0 && (
                  <text x={PL - 6} y={y + 3.5} textAnchor="end" fontSize={8} fill="rgba(0,0,0,0.38)" fontFamily="sans-serif">
                    {MXN(pct * maxVal)}
                  </text>
                )}
                {/* Eje derecho: conversión */}
                {pct > 0 && (
                  <text x={totalW - PR + 5} y={y + 3.5} textAnchor="start" fontSize={8} fill="rgba(233,30,99,0.55)" fontFamily="sans-serif">
                    {Math.round(pct * 100)}%
                  </text>
                )}
              </g>
            )
          })}

          {/* ── Etiqueta eje derecho ── */}
          <text
            x={totalW - 8} y={PT - 8}
            textAnchor="end" fontSize={7} fill="rgba(233,30,99,0.5)"
            fontFamily="sans-serif" fontWeight="bold"
          >
            Conversión
          </text>

          {/* ── Barras por mes ── */}
          {data.map((d, i) => {
            const offset  = (GRP - BW * 2 - BGAP) / 2
            const incX    = PL + i * GRP + offset
            const lostX   = incX + BW + BGAP

            const incH    = Math.max(d.income > 0 ? (d.income / maxVal) * CH : 0, d.income > 0 ? 3 : 0)
            const lostH   = Math.max(d.lost   > 0 ? (d.lost   / maxVal) * CH : 0, d.lost   > 0 ? 3 : 0)

            const incY    = PT + CH - incH
            const lostY   = PT + CH - lostH
            const cx      = PL + i * GRP + GRP / 2

            return (
              <g key={`${d.month}-${i}`}>
                {/* Barra ingresos */}
                {d.income > 0 && (
                  <>
                    <rect x={incX + 2} y={incY + 3} width={BW} height={incH} rx={5} fill="rgba(233,30,99,0.12)" />
                    <rect x={incX} y={incY} width={BW} height={incH} rx={5} fill="url(#gIncome)" />
                    {incH > 20 && (
                      <text x={incX + BW / 2} y={incY - 5} textAnchor="middle" fontSize={6.5} fontWeight="bold" fill="rgb(200,0,80)" fontFamily="sans-serif">
                        {MXN(d.income)}
                      </text>
                    )}
                  </>
                )}

                {/* Barra pipeline perdido */}
                {d.lost > 0 && (
                  <>
                    <rect x={lostX + 2} y={lostY + 3} width={BW} height={lostH} rx={5} fill="rgba(255,87,34,0.08)" />
                    <rect x={lostX} y={lostY} width={BW} height={lostH} rx={5} fill="url(#gLost)" />
                    {lostH > 20 && (
                      <text x={lostX + BW / 2} y={lostY - 5} textAnchor="middle" fontSize={6.5} fontWeight="bold" fill="rgb(211,47,47)" fontFamily="sans-serif">
                        {MXN(d.lost)}
                      </text>
                    )}
                  </>
                )}

                {/* Etiqueta mes */}
                <text x={cx} y={PT + CH + 16} textAnchor="middle" fontSize={10} fontWeight="bold" fill="rgba(0,0,0,0.78)" fontFamily="sans-serif">
                  {d.month.slice(0, 3)}
                </text>
                {/* Contador shows */}
                <text x={cx} y={PT + CH + 30} textAnchor="middle" fontSize={8} fill="rgba(0,0,0,0.32)" fontFamily="sans-serif">
                  {d.count} show{d.count !== 1 ? "s" : ""}
                </text>
              </g>
            )
          })}

          {/* ── Línea de conversión (área + línea + puntos) ── */}
          {linePoints.length > 1 && (
            <>
              <path d={areaPath} fill="url(#gArea)" />
              {linePoints.slice(1).map((p, i) => (
                <line
                  key={i}
                  x1={linePoints[i].x} y1={linePoints[i].y}
                  x2={p.x} y2={p.y}
                  stroke="#E91E63" strokeWidth={2} strokeLinecap="round"
                />
              ))}
              {linePoints.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r={4.5} fill="white" stroke="#E91E63" strokeWidth={2} />
                  {p.pct > 0 && (
                    <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize={7.5} fontWeight="bold" fill="#E91E63" fontFamily="sans-serif">
                      {p.pct}%
                    </text>
                  )}
                </g>
              ))}
            </>
          )}
        </svg>
      </div>

      {/* ── Leyenda ── */}
      <div className="flex flex-wrap items-center gap-5 justify-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ background: "#E91E63" }} />
          Ingresos reales
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded opacity-60" style={{ background: "#FF5722" }} />
          Pipeline perdido
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-[2px] rounded" style={{ background: "#E91E63" }} />
          Tasa de cierre
        </span>
      </div>

      {/* ── 4 Micro-KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-border/20">

        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-primary/8 to-primary/4 border border-primary/15">
          <div className="text-[8px] text-muted-foreground uppercase font-black tracking-widest mb-1">Ticket Promedio</div>
          <div className="text-xl font-black text-foreground leading-tight">{MXN(kpis.avgTicket)}</div>
          <div className="text-[9px] text-muted-foreground mt-0.5">por evento</div>
        </div>

        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-blue-500/8 to-blue-500/4 border border-blue-500/15">
          <div className="text-[8px] text-muted-foreground uppercase font-black tracking-widest mb-1">Tiempo de Cierre</div>
          <div className="text-xl font-black text-foreground leading-tight">
            {kpis.avgDaysToClose > 0 ? `${kpis.avgDaysToClose.toFixed(1)}d` : "—"}
          </div>
          <div className="text-[9px] text-muted-foreground mt-0.5">promedio por lead</div>
        </div>

        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-purple-500/8 to-purple-500/4 border border-purple-500/15">
          <div className="text-[8px] text-muted-foreground uppercase font-black tracking-widest mb-1">Paquete #1</div>
          <div className="text-sm font-black text-foreground leading-tight truncate max-w-full text-center">
            {kpis.topPackage || "—"}
          </div>
          {kpis.topPackagePct > 0 && (
            <div className="text-[9px] text-primary font-bold mt-0.5">{kpis.topPackagePct}% de shows</div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-amber-500/8 to-amber-500/4 border border-amber-500/15">
          <div className="text-[8px] text-muted-foreground uppercase font-black tracking-widest mb-1">Mes Récord</div>
          <div className="text-xl font-black text-foreground leading-tight">
            {kpis.peakMonthIncome > 0 ? MXN(kpis.peakMonthIncome) : "—"}
          </div>
          {kpis.peakMonthLabel && (
            <div className="text-[9px] text-muted-foreground mt-0.5">{kpis.peakMonthLabel}</div>
          )}
        </div>

      </div>
    </div>
  )
}
