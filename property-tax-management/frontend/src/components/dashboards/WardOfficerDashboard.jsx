import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, BadgeCheck, AlertTriangle, ShieldCheck, Check, ArrowUpRight, FileCheck } from 'lucide-react'
import { api, errorMessage } from '../../api/client'
import NumberCounter from '../charts/NumberCounter'
import DonutChart from '../charts/DonutChart'
import BarChart from '../charts/BarChart'

export default function WardOfficerDashboard({ user }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [stats, setStats] = useState({})
  const [propertyStatus, setPropertyStatus] = useState([])
  const [monthlyRegistrations, setMonthlyRegistrations] = useState([])
  const [propertyDistribution, setPropertyDistribution] = useState([])
  const [pendingProperties, setPendingProperties] = useState([])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const [statsRes, statusRes, regRes, distRes, propsRes] = await Promise.all([
        api.get('/api/analytics/dashboard'),
        api.get('/api/analytics/property-status'),
        api.get('/api/analytics/monthly-registrations'),
        api.get('/api/analytics/property-distribution'),
        api.get('/api/properties?status=PENDING_VERIFICATION'),
      ])

      setStats(statsRes.data || {})
      setPropertyStatus(statusRes.data || [])
      setMonthlyRegistrations(regRes.data || [])
      setPropertyDistribution(distRes.data || [])
      setPendingProperties(propsRes.data || [])
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleVerify = async (propId) => {
    try {
      setMessage('')
      await api.put(`/api/properties/${propId}/verify`)
      setMessage(`Property ${propId} verified and activated successfully!`)
      await loadData()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="dashboard-view">
      {/* Welcome Banner */}
      <div className="dashboard-welcome-banner">
        <div>
          <p className="eyebrow">Municipal Field Operations</p>
          <h2>Ward Operations Hub</h2>
          <p className="welcome-sub">
            Review ward properties, conduct title and boundary verification, and issue compliance notices.
          </p>
        </div>
        <div className="quick-action-buttons">
          <Link to="/property-verification" className="action-btn primary">
            <BadgeCheck size={16} /> Verification Queue
          </Link>
          <Link to="/notices" className="action-btn secondary">
            <AlertTriangle size={16} /> Issue Notice
          </Link>
        </div>
      </div>

      {message && <div className="success-banner">{message}</div>}
      {error && <div className="error-banner">{error}</div>}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card emerald" style={{ animationDelay: '0.05s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><Building2 size={20} /></span>
            <span className="kpi-tag">Jurisdiction</span>
          </div>
          <p className="kpi-title">Properties in Assigned Ward</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.totalWardProperties || 0} />
          </h3>
          <span className="kpi-foot">Registered ward holdings</span>
        </div>

        <div className="kpi-card amber" style={{ animationDelay: '0.1s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><BadgeCheck size={20} /></span>
            <span className="kpi-tag">Immediate Task</span>
          </div>
          <p className="kpi-title">Pending Verification</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.pendingVerificationCount || pendingProperties.length} />
          </h3>
          <span className="kpi-foot">Awaiting on-site field check</span>
        </div>

        <div className="kpi-card teal" style={{ animationDelay: '0.15s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><ShieldCheck size={20} /></span>
            <span className="kpi-tag">Verified</span>
          </div>
          <p className="kpi-title">Active Properties</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.activePropertiesCount || 0} />
          </h3>
          <span className="kpi-foot">Fully compliant records</span>
        </div>

        <div className="kpi-card coral" style={{ animationDelay: '0.2s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><AlertTriangle size={20} /></span>
            <span className="kpi-tag">Under Review</span>
          </div>
          <p className="kpi-title">Disputed Properties</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.disputedPropertiesCount || 0} />
          </h3>
          <span className="kpi-foot">Boundary or title objections</span>
        </div>
      </div>

      {/* Real Charts Grid */}
      <div className="dashboard-charts-grid">
        {/* Chart 1: Property Status DONUT CHART */}
        <div className="chart-card">
          <div className="chart-card-head">
            <div>
              <p className="eyebrow">Status Distribution</p>
              <h4>1. Property Status</h4>
            </div>
            <span className="chart-badge">Live DB</span>
          </div>
          <p className="chart-desc">Active, Pending Verification, Disputed, and Exempted properties.</p>
          <DonutChart data={propertyStatus} centerLabel="Properties" />
        </div>

        {/* Chart 2: Monthly Registrations BAR CHART */}
        <div className="chart-card">
          <div className="chart-card-head">
            <div>
              <p className="eyebrow">Intake Flow</p>
              <h4>2. Monthly Registrations</h4>
            </div>
          </div>
          <p className="chart-desc">Number of properties registered every month in jurisdiction.</p>
          <BarChart data={monthlyRegistrations} height={220} color="#317461" />
        </div>

        {/* Chart 3: Property Type Distribution PIE CHART */}
        <div className="chart-card">
          <div className="chart-card-head">
            <div>
              <p className="eyebrow">Zoning Mix</p>
              <h4>3. Property Type Distribution</h4>
            </div>
          </div>
          <p className="chart-desc">Breakdown across Residential, Commercial, Industrial, and Vacant.</p>
          <DonutChart data={propertyDistribution} centerLabel="Types" />
        </div>
      </div>

      {/* Property Verification Action Queue */}
      <div className="panel-card full-width-panel">
        <div className="panel-card-head">
          <div>
            <h4>Pending Property Verification Queue</h4>
            <p className="panel-sub">Verify applicant documents and activate property records.</p>
          </div>
          <Link to="/property-verification" className="text-link">Full Queue <ArrowUpRight size={14} /></Link>
        </div>

        {pendingProperties.length === 0 ? (
          <div className="empty-state-box">
            <BadgeCheck size={32} className="empty-icon text-success" />
            <p>All ward properties have been verified! No pending verifications.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Property ID</th>
                  <th>Address</th>
                  <th>Ward</th>
                  <th>Area (Sq. Ft)</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingProperties.map((prop) => (
                  <tr key={prop.id}>
                    <td><strong>{prop.propertyId}</strong></td>
                    <td>{prop.address}</td>
                    <td>{prop.wardNo}</td>
                    <td>{Number(prop.areaSqft || 0).toLocaleString()} sqft</td>
                    <td>{prop.constructionType}</td>
                    <td>
                      <span className="status-pill pending_verification">Pending Verification</span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleVerify(prop.id)}
                        className="btn btn-primary btn-sm"
                        title="Verify and Activate Property"
                      >
                        <Check size={14} /> Verify &amp; Activate
                      </button>
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
