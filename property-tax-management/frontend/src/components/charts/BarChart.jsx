import React, { useState } from 'react'

export default function BarChart({ data = [], height = 220, isMoney = false, color = '#317461', horizontal = false }) {
  const [hovered, setHovered] = useState(null)

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <p>No records available to display in chart.</p>
      </div>
    )
  }

  const values = data.map(d => Number(d.value) || 0)
  const maxVal = Math.max(...values, 1)

  const formatVal = (v) => {
    if (isMoney) return `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
    return Number(v).toLocaleString('en-IN')
  }

  if (horizontal) {
    return (
      <div className="horizontal-bar-chart">
        {data.map((item, idx) => {
          const val = Number(item.value) || 0
          const pct = Math.max(3, (val / maxVal) * 100)
          return (
            <div key={idx} className="h-bar-row">
              <div className="h-bar-info">
                <span className="h-bar-label">{item.label}</span>
                <strong className="h-bar-val">{formatVal(val)}</strong>
              </div>
              <div className="h-bar-track">
                <div
                  className="h-bar-fill"
                  style={{ width: `${pct}%`, background: item.color || color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const width = 580
  const padding = { top: 20, right: 25, bottom: 40, left: 55 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom
  const barWidth = Math.min(46, (chartW / data.length) * 0.6)

  return (
    <div className="svg-chart-container">
      <svg viewBox={`0 0 ${width} ${height}`} className="svg-chart" preserveAspectRatio="none">
        {/* Horizontal grid lines */}
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

        {/* Bars */}
        {data.map((d, i) => {
          const val = Number(d.value) || 0
          const bH = (val / maxVal) * chartH
          const x = padding.left + (i + 0.5) * (chartW / data.length) - barWidth / 2
          const y = padding.top + chartH - bH

          return (
            <g
              key={i}
              className="chart-bar-group"
              onMouseEnter={() => setHovered({ ...d, x: x + barWidth / 2, y, val })}
              onMouseLeave={() => setHovered(null)}
            >
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(bH, 3)}
                rx="6"
                fill={d.color || color}
                className="chart-bar"
              />
              <text x={x + barWidth / 2} y={padding.top + chartH + 20} textAnchor="middle" className="chart-axis-text">
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>

      {hovered && (
        <div className="chart-tooltip" style={{ left: `${(hovered.x / width) * 100}%`, top: `${(hovered.y / height) * 100 - 30}%` }}>
          <strong>{hovered.label}</strong>
          <span>{formatVal(hovered.val)}</span>
        </div>
      )}
    </div>
  )
}
