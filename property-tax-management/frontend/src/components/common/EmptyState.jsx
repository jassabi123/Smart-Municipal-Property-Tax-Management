import React from 'react'
import { Inbox } from 'lucide-react'

export default function EmptyState({ 
  icon: Icon = Inbox, 
  title = 'No records found', 
  description = 'There are no entries available to display in this view.',
  actionText,
  onAction,
  actionLink
}) {
  return (
    <div className="empty-state-card">
      <div className="empty-icon-wrap">
        <Icon size={40} className="empty-icon" />
      </div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-desc">{description}</p>
      {actionText && (
        <div className="empty-action-wrap">
          {actionLink ? (
            <a href={actionLink} className="btn btn-primary btn-sm">
              {actionText}
            </a>
          ) : (
            <button type="button" onClick={onAction} className="btn btn-primary btn-sm">
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
