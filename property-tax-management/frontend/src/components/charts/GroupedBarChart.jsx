import React, { useState } from 'react'

export default function GroupedBarChart({ data = [], height = 240 }) {
  const [hovered, setHovered] = useState(null)

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <p>No ward performance metrics recorded.</p>
      </div>
    )
  }

  // Find max value across all numeric fields for scaling
  let maxVal = 1000
  data.forEach(d => {
    maxVal = Math.max(maxVal, Number(d.collected) || 0, Number(d.pending) || 0)
  })

  const width = 640
  const padding = { top: 25, right: 25, bottom: 40, left: 60 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const groupWidth = chartW / data.length
  const barW = Math.min(18, groupWidth * 0.28)

  return (
    <div className="svg-chart-container">
      {/* Legend */}
      <div className="chart-legend-top">
        <span className="legend-item"><i style={{ background: '#317461' }} /> Tax Collected</span>
        <span className="legend-item"><i style={{ background: '#e7b45e' }} /> Pending Tax</span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="svg-chart" preserveAspectRatio="none">
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding.top + chartH * (1 - ratio)
          const val = maxVal * ratio
          return (
            <g key={idx} className="grid-row">
              <line x1={padding.left} y1={y} x2={padding.left + chartW} y2={y} stroke="#e4ede7" strokeDasharray="3 3" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" className="chart-axis-text">
                ₹{(val / 1000).toFixed(0)}k
              </text>
            </g>
          )
        })}

        {/* Groups */}
        {data.map((d, i) => {
          const gx = padding.left + i * groupWidth + groupWidth / 2
          const collected = Number(d.collected) || 0
          const pending = Number(d.pending) || 0

          const cH = (collected / maxVal) * chartH
          const pH = (pending / maxVal) * chartH

          const cX = gx - barW - 2
          const cY = padding.top + chartH - cH

          const pX = gx + 2
          const pY = padding.top + chartH - pH

          return (
            <g key={i} className="grouped-bar-unit">
              {/* Collected bar */}
              <rect
                x={cX}
                y={cY}
                width={barW}
                height={Math.max(cH, 3)}
                rx="4"
                fill="#317461"
                className="chart-bar"
                onMouseEnter={() => setHovered({ label: `${d.ward} • Collected`, value: collected, x: cX + barW / 2, y: cY })}
                onMouseLeave={() => setHovered(null)}
              />

              {/* Pending bar */}
              <rect
                x={pX}
                y={pY}
                width={barW}
                height={Math.max(pH, 3)}
                rx="4"
                fill="#e7b45e"
                className="chart-bar"
                onMouseEnter={() => setHovered({ label: `${d.ward} • Pending`, value: pending, x: pX + barW / 2, y: pY })}
                onMouseLeave={() => setHovered(null)}
              />

              {/* Ward label */}
              <text x={gx} y={padding.top + chartH + 20} textAnchor="middle" className="chart-axis-text">
                {d.ward}
              </text>
            </g>
          )
        })}
      </svg>

      {hovered && (
        <div className="chart-tooltip" style={{ left: `${(hovered.x / width) * 100}%`, top: `${(hovered.y / height) * 100 - 30}%` }}>
          <strong>{hovered.label}</strong>
          <span>₹{Number(hovered.value).toLocaleString('en-IN')}</span>
        </div>
      )}
    </div>
  )
}
