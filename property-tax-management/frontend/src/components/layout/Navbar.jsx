import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, LogOut, ChevronDown, Bell, Shield, CheckCircle2 } from 'lucide-react'
import { ROLE_CONFIGS } from '../../config/roles'
import { api } from '../../api/client'

export default function Navbar({ user, logout }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const menuRef = useRef(null)
  const navigate = useNavigate()

  const roleLabel = ROLE_CONFIGS[user?.role]?.label || user?.role || 'Guest'

  useEffect(() => {
    let isMounted = true
    const fetchUnread = async () => {
      try {
        const res = await api.get('/api/notifications/unread')
        if (isMounted && Array.isArray(res.data)) {
          setUnreadCount(res.data.length)
        }
      } catch (ignored) {}
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 15000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [user])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    navigate('/login')
  }

  return (
    <header className="app-header">
      <div className="header-left">
        <p className="eyebrow">Smart Municipal Property Tax Management System</p>
        <h1 className="header-title">{roleLabel} Workspace</h1>
      </div>

      <div className="header-right">
        {/* Live municipal ledger badge */}
        <div className="ledger-chip" title="Connected to Spring Boot PostgreSQL backend">
          <CheckCircle2 size={13} className="ledger-icon" />
          <span>RBAC Protected</span>
        </div>

        {/* Notifications quick link */}
        <Link to="/notifications" className="header-icon-btn notification-btn-wrap" title="View notifications">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="unread-counter-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </Link>

        {/* User Account Dropdown */}
        <div className="account-dropdown-wrap" ref={menuRef}>
          <button
            className="account-pill-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
          >
            <div className="avatar-circle">
              {(user?.name || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div className="account-meta">
              <strong className="user-name">{user?.name || 'Municipal User'}</strong>
              <span className="user-role-badge">{user?.role}</span>
            </div>
            <ChevronDown size={14} className={`dropdown-chevron ${menuOpen ? 'open' : ''}`} />
          </button>

          {menuOpen && (
            <div className="account-dropdown-menu">
              <div className="dropdown-user-header">
                <strong>{user?.name}</strong>
                <small>{user?.email}</small>
              </div>

              <div className="dropdown-divider" />

              <Link
                to="/profile"
                className="dropdown-item"
                onClick={() => setMenuOpen(false)}
              >
                <User size={15} /> My Profile
              </Link>

              {user?.role === 'ADMIN' && (
                <Link
                  to="/audit-logs"
                  className="dropdown-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <Shield size={15} /> Audit Trail
                </Link>
              )}

              <div className="dropdown-divider" />

              <button className="dropdown-item danger" onClick={handleLogout}>
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
