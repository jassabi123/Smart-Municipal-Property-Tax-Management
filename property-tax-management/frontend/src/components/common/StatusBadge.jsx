import React from 'react'

const STATUS_CONFIGS = {
  ACTIVE: { label: 'Active', className: 'status-active' },
  PAID: { label: 'Paid', className: 'status-paid' },
  PENDING: { label: 'Pending', className: 'status-pending' },
  PENDING_VERIFICATION: { label: 'Pending Verification', className: 'status-pending' },
  OVERDUE: { label: 'Overdue', className: 'status-overdue' },
  DEFAULTED: { label: 'Defaulted', className: 'status-defaulted' },
  APPROVED: { label: 'Approved', className: 'status-approved' },
  REJECTED: { label: 'Rejected', className: 'status-rejected' },
  RESOLVED: { label: 'Resolved', className: 'status-approved' },
  PARTIAL: { label: 'Partial Payment', className: 'status-partial' },
  UNDER_REVIEW: { label: 'Under Review', className: 'status-pending' },
  ISSUED: { label: 'Notice Issued', className: 'status-issued' },
  SERVED: { label: 'Notice Served', className: 'status-served' },
  DISPUTED: { label: 'Disputed', className: 'status-overdue' },
  INACTIVE: { label: 'Inactive', className: 'status-inactive' },
}

export default function StatusBadge({ status = 'PENDING', customLabel }) {
  const normalizedKey = String(status || '').toUpperCase().trim()
  const config = STATUS_CONFIGS[normalizedKey] || {
    label: customLabel || normalizedKey.replace('_', ' '),
    className: `status-${normalizedKey.toLowerCase()}`
  }

  const label = customLabel || config.label

  return (
    <span className={`status-pill ${config.className}`}>
      <span className="dot" />
      {label}
    </span>
  )
}
