import React, { useState } from 'react'

const DEFAULT_COLORS = [
  '#317461', // Emerald / Teal
  '#e7b45e', // Amber
  '#4a90e2', // Blue
  '#e76e5e', // Coral/Rose
  '#8f83c4', // Violet
  '#2a6a5d', // Deep Teal
  '#99a89d', // Slate
]

export default function DonutChart({ data = [], centerLabel = 'Total', size = 230, isMoney = false }) {
  const [activeIdx, setActiveIdx] = useState(null)

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <p>No distribution data available.</p>
      </div>
    )
  }

  const total = data.reduce((acc, d) => acc + (Number(d.value) || 0), 0)

  // Circumference for r=70
  const radius = 70
  const circ = 2 * Math.PI * radius
  let cumulativePercent = 0

  const slices = data.map((d, idx) => {
    const val = Number(d.value) || 0
    const pct = total > 0 ? val / total : 0
    const strokeDasharray = `${pct * circ} ${circ}`
    const strokeDashoffset = -cumulativePercent * circ
    cumulativePercent += pct

    const color = d.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]
    return {
      ...d,
      pct,
      color,
      strokeDasharray,
      strokeDashoffset,
    }
  })

  const activeSlice = activeIdx !== null ? slices[activeIdx] : null

  return (
    <div className="donut-chart-wrapper">
      <div className="donut-svg-box" style={{ width: size, height: size }}>
        <svg viewBox="0 0 180 180" className="donut-svg">
          <g transform="rotate(-90 90 90)">
            {slices.map((slice, i) => (
              <circle
                key={i}
                cx="90"
                cy="90"
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={activeIdx === i ? 26 : 20}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                className="donut-segment"
                onMouseEnter={() => setActiveIdx(i)}
                onMouseLeave={() => setActiveIdx(null)}
                style={{
                  transition: 'stroke-width 0.25s ease, opacity 0.2s ease',
                  opacity: activeIdx === null || activeIdx === i ? 1 : 0.65,
                  cursor: 'pointer',
                }}
              />
            ))}
          </g>
        </svg>

        {/* Center label */}
        <div className="donut-center-content">
          <span className="donut-center-sub">
            {activeSlice ? activeSlice.label : centerLabel}
          </span>
          <strong className="donut-center-val">
            {activeSlice
              ? isMoney
                ? `₹${Number(activeSlice.value).toLocaleString('en-IN')}`
                : Number(activeSlice.value).toLocaleString('en-IN')
              : isMoney
                ? `₹${total.toLocaleString('en-IN')}`
                : total.toLocaleString('en-IN')}
          </strong>
          <small className="donut-center-pct">
            {activeSlice
              ? `${(activeSlice.pct * 100).toFixed(1)}%`
              : `${data.length} categories`}
          </small>
        </div>
      </div>

      {/* Enriched Legend list */}
      <div className="donut-legend-list">
        {slices.map((slice, idx) => (
          <div
            key={idx}
            className={`donut-legend-row ${activeIdx === idx ? 'active' : ''}`}
            onMouseEnter={() => setActiveIdx(idx)}
            onMouseLeave={() => setActiveIdx(null)}
          >
            <div className="legend-left-wrap">
              <span className="legend-marker" style={{ background: slice.color }} />
              <span className="legend-label-text">{slice.label}</span>
            </div>
            <div className="legend-right-wrap">
              <span className="legend-val-num">
                {isMoney ? `₹${Number(slice.value).toLocaleString('en-IN')}` : Number(slice.value).toLocaleString('en-IN')}
              </span>
              <span className="legend-pct-pill">{(slice.pct * 100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
