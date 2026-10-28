import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Building2, CreditCard, ShieldCheck, Activity, UserPlus, FileSpreadsheet, ArrowUpRight } from 'lucide-react'
import { api, errorMessage } from '../../api/client'
import NumberCounter from '../charts/NumberCounter'
import LineChart from '../charts/LineChart'
import DonutChart from '../charts/DonutChart'

export default function AdminDashboard({ user }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({})
  const [usersByRole, setUsersByRole] = useState([])
  const [propertyStatus, setPropertyStatus] = useState([])
  const [revenueTrend, setRevenueTrend] = useState([])
  const [recentLogs, setRecentLogs] = useState([])

  useEffect(() => {
    async function loadAdminData() {
      try {
        setLoading(true)
        setError('')

        const [statsRes, roleRes, statusRes, trendRes, logsRes] = await Promise.all([
          api.get('/api/analytics/dashboard'),
          api.get('/api/analytics/users-by-role').catch(() => ({ data: [] })),
          api.get('/api/analytics/property-status').catch(() => ({ data: [] })),
          api.get('/api/analytics/revenue-trend').catch(() => ({ data: [] })),
          api.get('/api/audit/recent').catch(() => ({ data: [] })),
        ])

        setStats(statsRes.data || {})
        setUsersByRole(
          (roleRes.data || []).map(r => ({
            label: r.role ? r.role.replace('_', ' ') : r.label,
            value: Number(r.count || r.value || 0)
          }))
        )
        setPropertyStatus(
          (statusRes.data || []).map(s => ({
            label: s.status ? s.status.replace('_', ' ') : s.label,
            value: Number(s.count || s.value || 0)
          }))
        )
        setRevenueTrend(trendRes.data || [])
        setRecentLogs(Array.isArray(logsRes.data) ? logsRes.data.slice(0, 8) : [])
      } catch (err) {
        setError(errorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    loadAdminData()
  }, [])

  return (
    <div className="dashboard-view">
      {/* Welcome Banner */}
      <div className="dashboard-welcome-banner admin-banner">
        <div>
          <p className="eyebrow">SYSTEM ADMINISTRATION & COMPLIANCE</p>
          <h2>Welcome back, {user?.name || 'System Administrator'}</h2>
          <p className="welcome-sub">
            Monitor municipal system health, manage staff accounts, review audit activity, and track property tax performance.
          </p>
        </div>
        <div className="quick-action-buttons">
          <Link to="/admin-users" className="action-btn primary">
            <UserPlus size={16} /> Manage Users
          </Link>
          <Link to="/audit-logs" className="action-btn secondary">
            <ShieldCheck size={16} /> Audit Logs
          </Link>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card emerald" style={{ animationDelay: '0.05s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><Users size={20} /></span>
            <span className="kpi-tag">Accounts</span>
          </div>
          <p className="kpi-title">Total Municipal Users</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.totalUsers || 0} />
          </h3>
          <span className="kpi-foot">
            <strong style={{ color: '#2a6a5d' }}>{stats.activeUsers || 0}</strong> active accounts
          </span>
        </div>

        <div className="kpi-card navy" style={{ animationDelay: '0.1s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><Building2 size={20} /></span>
            <span className="kpi-tag">Portfolio</span>
          </div>
          <p className="kpi-title">Registered Properties</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.totalProperties || 0} />
          </h3>
          <span className="kpi-foot">Across all municipal wards</span>
        </div>

        <div className="kpi-card teal" style={{ animationDelay: '0.15s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><CreditCard size={20} /></span>
            <span className="kpi-tag">Ledger</span>
          </div>
          <p className="kpi-title">Total Revenue Collected</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.totalRevenue || 0} isMoney />
          </h3>
          <span className="kpi-foot">Verified payments in ledger</span>
        </div>

        <div className="kpi-card violet" style={{ animationDelay: '0.2s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><Activity size={20} /></span>
            <span className="kpi-tag">Security</span>
          </div>
          <p className="kpi-title">System Activity Events</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.systemActivityCount || 0} />
          </h3>
          <span className="kpi-foot">Tamper-evident audit events</span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="dashboard-charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h4>Municipal Users by Role</h4>
              <p>Distribution of citizen and officer privileges</p>
            </div>
            <span className="chart-badge">Active RBAC</span>
          </div>
          <div className="chart-body">
            {usersByRole.length > 0 ? (
              <DonutChart data={usersByRole} />
            ) : (
              <div className="chart-empty">Loading user distribution...</div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h4>Properties by Verification Status</h4>
              <p>Active, Pending Verification, and Disputed</p>
            </div>
            <span className="chart-badge">Cadastral</span>
          </div>
          <div className="chart-body">
            {propertyStatus.length > 0 ? (
              <DonutChart data={propertyStatus} />
            ) : (
              <div className="chart-empty">Loading property statuses...</div>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Overview Trend */}
      <div className="chart-card wide-chart">
        <div className="chart-header">
          <div>
            <h4>Municipal Revenue Overview</h4>
            <p>Collection timeline from verified tax payment transactions</p>
          </div>
          <Link to="/analytics" className="chart-link">
            Full Analytics <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="chart-body">
          {revenueTrend.length > 0 ? (
            <LineChart data={revenueTrend} />
          ) : (
            <div className="chart-empty">No payment transactions recorded yet.</div>
          )}
        </div>
      </div>

      {/* Recent System Audit Logs Table */}
      <div className="panel-table-card">
        <div className="table-card-header">
          <div>
            <h4>Recent Audit Activity</h4>
            <p>Latest immutable security events recorded in the municipal ledger</p>
          </div>
          <Link to="/audit-logs" className="table-header-link">
            View All Logs <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="table-responsive">
          <table className="municipal-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Record ID</th>
                <th>Operator</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.length > 0 ? (
                recentLogs.map((log, idx) => (
                  <tr key={log.id || idx}>
                    <td className="mono-text">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN') : '—'}
                    </td>
                    <td>
                      <span className={`status-pill ${log.action ? log.action.toLowerCase() : 'info'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td><strong>{log.entityType || log.entity}</strong></td>
                    <td className="mono-text">#{log.entityId}</td>
                    <td>{log.userName || (log.userId ? `User #${log.userId}` : 'SYSTEM')}</td>
                    <td className="truncate-cell" title={log.details || log.description}>
                      {log.details || log.description || '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center empty-cell">
                    No recent audit logs available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
