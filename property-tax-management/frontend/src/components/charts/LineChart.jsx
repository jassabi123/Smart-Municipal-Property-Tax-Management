import React, { useState } from 'react'

export default function LineChart({ data = [], height = 220, isMoney = true, color = '#317461', gradientId = 'lineGrad' }) {
  const [hovered, setHovered] = useState(null)

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <p>No activity records available to plot.</p>
      </div>
    )
  }

  const padding = { top: 25, right: 30, bottom: 40, left: 55 }
  const width = 580
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const values = data.map(d => Number(d.value) || 0)
  const maxVal = Math.max(...values, 1)

  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartW
    const val = Number(d.value) || 0
    const y = padding.top + chartH - (val / maxVal) * chartH
    return { x, y, label: d.label, value: val }
  })

  // Build path string
  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`
    // Smooth quadratic curve
    const prev = points[i - 1]
    const cx = (prev.x + pt.x) / 2
    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`
  }, '')

  // Area path for gradient
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`

  const formatVal = (v) => {
    if (isMoney) return `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
    return Number(v).toLocaleString('en-IN')
  }

  return (
    <div className="svg-chart-container">
      <svg viewBox={`0 0 ${width} ${height}`} className="svg-chart" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding.top + chartH * (1 - ratio)
          const val = maxVal * ratio
          return (
            <g key={idx} className="grid-row">
              <line x1={padding.left} y1={y} x2={padding.left + chartW} y2={y} stroke="#e4ede7" strokeDasharray="3 3" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" className="chart-axis-text">
                {isMoney ? `₹${(val / 1000).toFixed(0)}k` : Math.round(val)}
              </text>
            </g>
          )
        })}

        {/* Area fill */}
        <path d={areaD} fill={`url(#${gradientId})`} className="chart-area-path" />

        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" className="chart-line-path" />

        {/* Data points */}
        {points.map((pt, i) => (
          <g key={i} className="chart-point-group" onMouseEnter={() => setHovered(pt)} onMouseLeave={() => setHovered(null)}>
            <circle cx={pt.x} cy={pt.y} r={hovered === pt ? 7 : 4.5} fill="#fff" stroke={color} strokeWidth="2.5" className="chart-point" />
            {/* Label below X axis */}
            <text x={pt.x} y={padding.top + chartH + 20} textAnchor="middle" className="chart-axis-text">
              {pt.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Floating tooltip */}
      {hovered && (
        <div className="chart-tooltip" style={{ left: `${(hovered.x / width) * 100}%`, top: `${(hovered.y / height) * 100 - 30}%` }}>
          <strong>{hovered.label}</strong>
          <span>{formatVal(hovered.value)}</span>
        </div>
      )}
    </div>
  )
}
