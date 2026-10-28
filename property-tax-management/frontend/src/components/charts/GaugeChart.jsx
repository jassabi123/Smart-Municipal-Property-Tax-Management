import React from 'react'

export default function GaugeChart({ value = 0, size = 180, strokeWidth = 14, label = 'Efficiency' }) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0))

  // Half-circle arc
  const radius = 65
  const circ = Math.PI * radius // Half circumference
  const strokeDashoffset = circ * (1 - pct / 100)

  // Color tone based on efficiency
  const getColor = (p) => {
    if (p >= 80) return '#317461'
    if (p >= 50) return '#e7b45e'
    return '#e76e5e'
  }

  const currentColor = getColor(pct)

  return (
    <div className="gauge-chart-container" style={{ width: size }}>
      <svg viewBox="0 0 160 100" className="gauge-svg">
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#e7b45e" />
            <stop offset="100%" stopColor={currentColor} />
          </linearGradient>
        </defs>

        {/* Background track */}
        <path
          d="M 15 90 A 65 65 0 0 1 145 90"
          fill="none"
          stroke="#e8efe9"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Value progress arc */}
        <path
          d="M 15 90 A 65 65 0 0 1 145 90"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={circ}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="gauge-arc"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.23, 1, 0.32, 1)' }}
        />
      </svg>

      <div className="gauge-content">
        <strong className="gauge-number">{pct.toFixed(1)}%</strong>
        <span className="gauge-label">{label}</span>
      </div>
    </div>
  )
}
