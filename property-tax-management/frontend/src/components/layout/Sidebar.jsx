import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  FileSpreadsheet,
  CreditCard,
  Percent,
  FileCheck,
  AlertTriangle,
  Bell,
  User,
  Users,
  MessageSquare,
  BarChart3,
  LineChart,
  ShieldCheck,
  Settings,
  BadgeCheck,
  AlertOctagon,
  FileText,
  Compass,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Landmark,
} from 'lucide-react'
import { ROLE_CONFIGS } from '../../config/roles'

const ICON_MAP = {
  LayoutDashboard,
  Building2,
  FileSpreadsheet,
  CreditCard,
  Percent,
  FileCheck,
  AlertTriangle,
  Bell,
  User,
  Users,
  MessageSquare,
  BarChart3,
  LineChart,
  ShieldCheck,
  Settings,
  BadgeCheck,
  AlertOctagon,
  FileText,
  Compass,
  TrendingUp,
}

export default function Sidebar({ user, collapsed, setCollapsed }) {
  const location = useLocation()
  const roleConfig = ROLE_CONFIGS[user?.role] || ROLE_CONFIGS.GUEST
  const items = roleConfig.sidebar || []

  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand header */}
      <div className="sidebar-brand">
        <div className="brand-logo-icon">
          <Landmark size={20} />
        </div>
        {!collapsed && (
          <div className="brand-text">
            <h2>Civic<span>Ledger</span></h2>
            <small>Municipal Tax Operations</small>
          </div>
        )}
        <button
          className="collapse-toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Role Pill */}
      {!collapsed && (
        <div className="sidebar-role-indicator">
          <span className="role-dot" />
          <span className="role-name">{roleConfig.label}</span>
        </div>
      )}

      {/* Dynamic Nav Menu */}
      <nav className="sidebar-nav">
        {items.map((item) => {
          const IconComp = ICON_MAP[item.icon] || LayoutDashboard
          const isActive = location.pathname === item.path

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="nav-item-icon">
                <IconComp size={18} />
              </span>
              {!collapsed && <span className="nav-item-label">{item.label}</span>}
              {isActive && <span className="active-glow-bar" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer live status */}
      <div className="sidebar-footer">
        <div className="live-api-badge">
          <span className="live-pulse" />
          {!collapsed && <span>Live Municipal API</span>}
        </div>
      </div>
    </aside>
  )
}
