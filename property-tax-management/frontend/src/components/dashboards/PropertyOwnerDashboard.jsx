import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, CreditCard, AlertCircle, FileCheck, ArrowUpRight, Plus, MessageSquare, Bell } from 'lucide-react'
import { api, errorMessage } from '../../api/client'
import NumberCounter from '../charts/NumberCounter'
import LineChart from '../charts/LineChart'
import BarChart from '../charts/BarChart'
import DonutChart from '../charts/DonutChart'

export default function PropertyOwnerDashboard({ user }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({})
  const [paymentHistory, setPaymentHistory] = useState([])
  const [dueVsPaid, setDueVsPaid] = useState([])
  const [assessmentStatus, setAssessmentStatus] = useState([])
  const [myProperties, setMyProperties] = useState([])

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true)
        setError('')

        const [statsRes, historyRes, dueRes, statusRes, propsRes] = await Promise.all([
          api.get('/api/analytics/dashboard'),
          api.get('/api/analytics/owner/payment-history'),
          api.get('/api/analytics/owner/tax-due-vs-paid'),
          api.get('/api/analytics/assessment-status'),
          api.get('/api/properties'),
        ])

        setStats(statsRes.data || {})
        setPaymentHistory(historyRes.data || [])

        const dueData = dueRes.data || {}
        setDueVsPaid([
          { label: 'Total Tax Due', value: dueData.totalDue || 0, color: '#e7b45e' },
          { label: 'Total Tax Paid', value: dueData.totalPaid || 0, color: '#317461' },
        ])

        setAssessmentStatus(
          (statusRes.data || []).map(item => ({
            label: item.label,
            value: Number(item.value) || 0,
          }))
        )

        setMyProperties(propsRes.data || [])
      } catch (err) {
        setError(errorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  return (
    <div className="dashboard-view">
      {/* Welcome Banner */}
      <div className="dashboard-welcome-banner">
        <div>
          <p className="eyebrow">Citizen Property Account</p>
          <h2>Welcome back, {user?.name || 'Property Owner'}</h2>
          <p className="welcome-sub">
            Review your registered properties, track outstanding municipal assessments, and complete property tax payments securely.
          </p>
        </div>
        <div className="quick-action-buttons">
          <Link to="/properties" className="action-btn primary">
            <Plus size={16} /> Register Property
          </Link>
          <Link to="/tax-payments" className="action-btn secondary">
            <CreditCard size={16} /> Pay Property Tax
          </Link>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card emerald" style={{ animationDelay: '0.05s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><Building2 size={20} /></span>
            <span className="kpi-tag">Portfolio</span>
          </div>
          <p className="kpi-title">My Properties</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.myPropertiesCount || 0} />
          </h3>
          <span className="kpi-foot">Verified registered titles</span>
        </div>

        <div className="kpi-card amber" style={{ animationDelay: '0.1s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><AlertCircle size={20} /></span>
            <span className="kpi-tag">Action Needed</span>
          </div>
          <p className="kpi-title">My Total Tax Due</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.totalTaxDue || 0} isMoney />
          </h3>
          <span className="kpi-foot">Outstanding assessment balance</span>
        </div>

        <div className="kpi-card teal" style={{ animationDelay: '0.15s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><CreditCard size={20} /></span>
            <span className="kpi-tag">Settled</span>
          </div>
          <p className="kpi-title">My Total Paid</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.totalTaxPaid || 0} isMoney />
          </h3>
          <span className="kpi-foot">Historical tax receipts</span>
        </div>

        <div className="kpi-card coral" style={{ animationDelay: '0.2s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><FileCheck size={20} /></span>
            <span className="kpi-tag">Open Cycles</span>
          </div>
          <p className="kpi-title">Pending Assessments</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.pendingAssessmentsCount || 0} />
          </h3>
          <span className="kpi-foot">Awaiting payment verification</span>
        </div>
      </div>

      {/* Real Charts Grid */}
      <div className="dashboard-charts-grid">
        {/* Chart 1: Payment History LINE CHART */}
        <div className="chart-card wide-card">
          <div className="chart-card-head">
            <div>
              <p className="eyebrow">Financial Trend</p>
              <h4>1. Payment History (Over Time)</h4>
            </div>
            <span className="chart-badge">Live API Data</span>
          </div>
          <p className="chart-desc">Your monthly tax payment transactions over the past financial periods.</p>
          <LineChart data={paymentHistory} height={230} isMoney color="#317461" gradientId="ownerHistoryGrad" />
        </div>

        {/* Chart 2: Tax Due vs Paid BAR CHART */}
        <div className="chart-card">
          <div className="chart-card-head">
            <div>
              <p className="eyebrow">Obligation Breakdown</p>
              <h4>2. Tax Due vs Paid</h4>
            </div>
          </div>
          <p className="chart-desc">Comparison between your total assessed dues and completed payments.</p>
          <BarChart data={dueVsPaid} height={230} isMoney horizontal />
        </div>

        {/* Chart 3: Assessment Status DONUT CHART */}
        <div className="chart-card">
          <div className="chart-card-head">
            <div>
              <p className="eyebrow">Cycle Health</p>
              <h4>3. Assessment Status</h4>
            </div>
          </div>
          <p className="chart-desc">Distribution of assessments: Paid, Pending, Partial, and Overdue.</p>
          <DonutChart data={assessmentStatus} centerLabel="Assessments" />
        </div>
      </div>

      {/* Quick Action Navigation Panels */}
      <div className="dashboard-subsections">
        <div className="panel-card">
          <div className="panel-card-head">
            <h4>My Registered Properties</h4>
            <Link to="/properties" className="text-link">View All <ArrowUpRight size={14} /></Link>
          </div>
          {myProperties.length === 0 ? (
            <div className="empty-state-box">
              <Building2 size={32} className="empty-icon" />
              <p>No properties registered yet.</p>
              <Link to="/properties" className="primary btn-sm">Register First Property</Link>
            </div>
          ) : (
            <div className="property-compact-list">
              {myProperties.slice(0, 3).map((prop) => (
                <div key={prop.id} className="compact-property-row">
                  <div className="prop-badge-icon">
                    <Building2 size={18} />
                  </div>
                  <div className="prop-row-details">
                    <strong>{prop.propertyId}</strong>
                    <small>{prop.address} • Ward {prop.wardNo} ({prop.constructionType})</small>
                  </div>
                  <span className={`status-pill ${prop.status?.toLowerCase()}`}>
                    {prop.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel-card">
          <div className="panel-card-head">
            <h4>Citizen Services & Quick Links</h4>
          </div>
          <div className="citizen-shortcuts">
            <Link to="/noc-requests" className="shortcut-item">
              <FileCheck size={20} className="shortcut-icon" />
              <div>
                <strong>Request NOC</strong>
                <small>Apply for municipal No Objection Certificate</small>
              </div>
            </Link>
            <Link to="/grievances" className="shortcut-item">
              <MessageSquare size={20} className="shortcut-icon" />
              <div>
                <strong>Submit Grievance</strong>
                <small>Dispute assessments or log complaints</small>
              </div>
            </Link>
            <Link to="/notifications" className="shortcut-item">
              <Bell size={20} className="shortcut-icon" />
              <div>
                <strong>Notification Inbox</strong>
                <small>{stats.recentNotificationsCount || 0} unread municipal updates</small>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
