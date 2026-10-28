import React, { useState, useEffect, useMemo } from 'react'
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  CreditCard, 
  FileCheck, 
  AlertTriangle, 
  Building2, 
  MessageSquare,
  Sparkles
} from 'lucide-react'
import { api, errorMessage } from '../api/client'

export default function NotificationsPage({ user }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)

  const fetchNotifications = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/api/notifications')
      setNotifications(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  // Mark single notification read
  const handleMarkRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  // Mark all read
  const handleMarkAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const filteredNotifications = useMemo(() => {
    if (unreadOnly) {
      return notifications.filter(n => !n.isRead)
    }
    return notifications
  }, [notifications, unreadOnly])

  const unreadCount = notifications.filter(n => !n.isRead).length

  // Helper for notification icon
  const getNotificationIcon = (title = '', message = '') => {
    const text = `${title} ${message}`.toLowerCase()
    if (text.includes('payment') || text.includes('receipt')) return <CreditCard size={18} className="text-success" />
    if (text.includes('noc')) return <FileCheck size={18} className="text-primary" />
    if (text.includes('grievance')) return <MessageSquare size={18} className="text-accent" />
    if (text.includes('notice') || text.includes('demand')) return <AlertTriangle size={18} className="text-warning" />
    if (text.includes('property') || text.includes('verify')) return <Building2 size={18} className="text-blue" />
    return <Bell size={18} className="text-muted" />
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <span className="page-pretitle">DISPATCH &amp; ALERTS</span>
          <h2 className="page-title">Municipal Notifications</h2>
          <p className="page-subtitle">
            Direct notifications regarding property registrations, assessment notices, payments, and NOC updates.
          </p>
        </div>

        <div className="page-actions-group">
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn btn-outline">
              <CheckCheck size={16} /> Mark All as Read
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert-box alert-error">
          <ShieldAlert size={18} />
          <span>{error}</span>
          <button onClick={() => setError('')} className="alert-close">×</button>
        </div>
      )}

      {/* Filter Toolbar with Segmented Controls */}
      <div className="toolbar-container">
        <div className="filters-group segmented-control">
          <button
            type="button"
            className={`btn-filter-tab ${!unreadOnly ? 'active' : ''}`}
            onClick={() => setUnreadOnly(false)}
          >
            <span>All Notifications</span>
            <span className="tab-pill-count">{notifications.length}</span>
          </button>
          <button
            type="button"
            className={`btn-filter-tab ${unreadOnly ? 'active' : ''}`}
            onClick={() => setUnreadOnly(true)}
          >
            <span>Unread</span>
            <span className="tab-pill-count">{unreadCount}</span>
          </button>
        </div>

        <div className="toolbar-summary">
          <small className="text-muted">
            {unreadCount === 0 ? 'All notifications read' : `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}`}
          </small>
        </div>
      </div>

      {/* Notifications List */}
      <div className="notifications-feed-container">
        {loading ? (
          <div className="loading-state-card">
            <span className="spinner-icon-lg" />
            <p className="loading-text">Fetching Municipal Notifications…</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon-wrap">
              <Bell size={36} className="empty-icon" />
            </div>
            <h3 className="empty-title">No notifications in this view</h3>
            <p className="empty-desc">You are completely caught up with all municipal property and tax updates.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div 
              key={n.id} 
              className={`notification-item-card ${!n.isRead ? 'unread' : ''}`}
            >
              <div className="notification-icon-col">
                <div className="notif-icon-circle">
                  {getNotificationIcon(n.title, n.message)}
                </div>
              </div>

              <div className="notification-content-col">
                <div className="notif-header">
                  <div className="notif-title-row">
                    <h4>{n.title || 'Municipal System Notification'}</h4>
                    {!n.isRead && <span className="unread-pill-tag">New</span>}
                  </div>
                  <div className="notif-meta">
                    <Clock size={12} />
                    <span>{n.createdAt ? new Date(n.createdAt).toLocaleString('en-IN') : 'Recent'}</span>
                  </div>
                </div>

                <p className="notif-message">{n.message}</p>
              </div>

              <div className="notification-action-col">
                {!n.isRead ? (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="btn-mark-read"
                    title="Mark as read"
                    aria-label="Mark as read"
                  >
                    <CheckCheck size={16} />
                  </button>
                ) : (
                  <span className="read-status-indicator">
                    <CheckCircle2 size={12} /> Read
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
