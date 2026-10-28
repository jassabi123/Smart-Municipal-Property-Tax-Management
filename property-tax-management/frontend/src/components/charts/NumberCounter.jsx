import React, { useEffect, useState } from 'react'

export default function NumberCounter({ value, target: targetProp, isMoney = false, duration = 800, prefix = '', suffix = '' }) {
  const targetVal = Number(value !== undefined ? value : (targetProp !== undefined ? targetProp : 0)) || 0
  const [display, setDisplay] = useState(0)
  const target = targetVal

  useEffect(() => {
    let startTimestamp = null
    const startValue = 0

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      const current = Math.floor(startValue + (target - startValue) * ease)
      setDisplay(current)

      if (progress < 1) {
        window.requestAnimationFrame(step)
      } else {
        setDisplay(target)
      }
    }

    const animId = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(animId)
  }, [target, duration])

  if (isMoney) {
    return (
      <span className="animated-counter">
        ₹{display.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
      </span>
    )
  }

  return (
    <span className="animated-counter">
      {prefix}{display.toLocaleString('en-IN')}{suffix}
    </span>
  )
}
