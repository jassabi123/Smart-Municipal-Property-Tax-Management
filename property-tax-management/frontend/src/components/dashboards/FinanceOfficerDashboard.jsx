import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Landmark, TrendingUp, AlertOctagon, Percent, ArrowUpRight, FileText, Download } from 'lucide-react'
import { api, errorMessage } from '../../api/client'
import NumberCounter from '../charts/NumberCounter'
import LineChart from '../charts/LineChart'
import BarChart from '../charts/BarChart'
import DonutChart from '../charts/DonutChart'

export default function FinanceOfficerDashboard({ user }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({})
  const [revenueTrend, setRevenueTrend] = useState([])
  const [monthlyCollection, setMonthlyCollection] = useState([])
  const [paymentModes, setPaymentModes] = useState([])
  const [paidVsPending, setPaidVsPending] = useState([])
  const [defaulters, setDefaulters] = useState([])

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError('')

        const [statsRes, trendRes, monthRes, modesRes, defaultersRes, collRes] = await Promise.all([
          api.get('/api/analytics/dashboard'),
          api.get('/api/analytics/revenue-trend'),
          api.get('/api/analytics/monthly-collection'),
          api.get('/api/analytics/payment-modes'),
          api.get('/api/analytics/defaulters?limit=6'),
          api.get('/api/analytics/collection'),
        ])

        setStats(statsRes.data || {})
        setRevenueTrend(trendRes.data || [])
        setMonthlyCollection(monthRes.data || [])
        setPaymentModes(modesRes.data || [])
        setDefaulters(defaultersRes.data || [])

        const coll = collRes.data || {}
        setPaidVsPending([
          { label: 'Paid Revenue', value: Number(coll.totalCollected) || 0, color: '#317461' },
          { label: 'Pending Balance', value: Number(coll.totalPending) || 0, color: '#e7b45e' },
        ])
      } catch (err) {
        setError(errorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <div className="dashboard-view">
      {/* Welcome Banner */}
      <div className="dashboard-welcome-banner">
        <div>
          <p className="eyebrow">Municipal Treasury & Accounts</p>
          <h2>Finance Operations Control</h2>
          <p className="welcome-sub">
            Monitor real-time municipal tax receipts, reconcile multi-channel payment streams, and track defaulters.
          </p>
        </div>
        <div className="quick-action-buttons">
          <Link to="/exemptions" className="action-btn primary">
            <Percent size={16} /> Manage Exemptions
          </Link>
          <Link to="/financial-reports" className="action-btn secondary">
            <FileText size={16} /> Financial Reports
          </Link>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card emerald" style={{ animationDelay: '0.05s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><Landmark size={20} /></span>
            <span className="kpi-tag">Treasury</span>
          </div>
          <p className="kpi-title">Total Revenue Collected</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.totalRevenue || 0} isMoney />
          </h3>
          <span className="kpi-foot">All reconciled payments</span>
        </div>

        <div className="kpi-card teal" style={{ animationDelay: '0.1s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><TrendingUp size={20} /></span>
            <span className="kpi-tag">Current Cycle</span>
          </div>
          <p className="kpi-title">Current Month Collection</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.currentMonthCollection || 0} isMoney />
          </h3>
          <span className="kpi-foot">Monthly receipts flow</span>
        </div>

        <div className="kpi-card amber" style={{ animationDelay: '0.15s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><AlertOctagon size={20} /></span>
            <span className="kpi-tag">Outstanding</span>
          </div>
          <p className="kpi-title">Pending Revenue</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.pendingRevenue || 0} isMoney />
          </h3>
          <span className="kpi-foot">Unsettled assessment accounts</span>
        </div>

        <div className="kpi-card coral" style={{ animationDelay: '0.2s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><AlertOctagon size={20} /></span>
            <span className="kpi-tag">Arrears</span>
          </div>
          <p className="kpi-title">Number of Defaulters</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.defaulterCount || defaulters.length} />
          </h3>
          <span className="kpi-foot">Non-compliant accounts</span>
        </div>
      </div>

      {/* Real Charts Grid */}
      <div className="dashboard-charts-grid">
        {/* Chart 1: Municipal Revenue Trend LINE CHART */}
        <div className="chart-card wide-card">
          <div className="chart-card-head">
            <div>
              <p className="eyebrow">Revenue Growth</p>
              <h4>1. Municipal Revenue Trend</h4>
            </div>
            <span className="chart-badge">Live DB</span>
          </div>
          <p className="chart-desc">Revenue collected daily and monthly across all municipal wards.</p>
          <LineChart data={revenueTrend} height={230} isMoney color="#317461" gradientId="finTrendGrad" />
        </div>

        {/* Chart 2: Monthly Tax Collection BAR CHART */}
        <div className="chart-card">
          <div className="chart-card-head">
            <div>
              <p className="eyebrow">Collection Timeline</p>
              <h4>2. Monthly Tax Collection</h4>
            </div>
          </div>
          <p className="chart-desc">Collection amounts registered per calendar month.</p>
          <BarChart data={monthlyCollection} height={230} isMoney color="#317461" />
        </div>

        {/* Chart 3: Payment Mode Distribution PIE/DONUT CHART */}
        <div className="chart-card">
          <div className="chart-card-head">
            <div>
              <p className="eyebrow">Channel Mix</p>
              <h4>3. Payment Mode Distribution</h4>
            </div>
          </div>
          <p className="chart-desc">Breakdown across UPI, Card, Net Banking, Cash, and DD.</p>
          <DonutChart data={paymentModes} centerLabel="Transactions" />
        </div>

        {/* Chart 4: Paid vs Pending DONUT CHART */}
        <div className="chart-card wide-card">
          <div className="chart-card-head">
            <div>
              <p className="eyebrow">Recovery Position</p>
              <h4>4. Paid vs Pending Revenue</h4>
            </div>
          </div>
          <p className="chart-desc">Comparison of total collected municipal revenue against outstanding tax receivables.</p>
          <DonutChart data={paidVsPending} centerLabel="Receivables" isMoney />
        </div>
      </div>

      {/* Top Defaulters Table (Requirement 5) */}
      <div className="panel-card full-width-panel">
        <div className="panel-card-head">
          <div>
            <h4>5. Top Defaulters</h4>
            <p className="panel-sub">Highest outstanding arrear liabilities requiring statutory notices and enforcement.</p>
          </div>
          <Link to="/defaulters" className="text-link">Complete Arrears Register <ArrowUpRight size={14} /></Link>
        </div>

        {defaulters.length === 0 ? (
          <div className="empty-state-box">
            <p>No defaulting accounts found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Property Identifier</th>
                  <th>Owner Name</th>
                  <th>Ward</th>
                  <th>Outstanding Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {defaulters.map((d, i) => (
                  <tr key={i}>
                    <td><strong>{d.propertyId}</strong></td>
                    <td>{d.ownerName}</td>
                    <td>{d.ward}</td>
                    <td><strong className="text-danger">₹{Number(d.outstandingAmount ?? d.totalDue ?? 0).toLocaleString('en-IN')}</strong></td>
                    <td>{d.dueDate}</td>
                    <td>
                      <span className={`status-pill ${d.status?.toLowerCase()}`}>{d.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
