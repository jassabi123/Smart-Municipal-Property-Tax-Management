import React from 'react'

export default function LoadingSkeleton({ type = 'card', count = 3, message = 'Loading municipal data…' }) {
  if (type === 'table') {
    return (
      <div className="skeleton-table-wrapper">
        <div className="skeleton-header-row" />
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
    )
  }

  if (type === 'list') {
    return (
      <div className="skeleton-list-wrapper">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-list-item" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="skeleton-avatar" />
            <div className="skeleton-lines">
              <div className="skeleton-line-title" />
              <div className="skeleton-line-sub" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="loading-state-card">
      <span className="spinner-icon-lg" />
      <p className="loading-text">{message}</p>
    </div>
  )
}
