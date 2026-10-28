import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileSpreadsheet, CheckCircle, Clock, Calculator, Plus, AlertTriangle, ArrowUpRight } from 'lucide-react'
import { api, errorMessage } from '../../api/client'
import NumberCounter from '../charts/NumberCounter'
import LineChart from '../charts/LineChart'
import BarChart from '../charts/BarChart'
import DonutChart from '../charts/DonutChart'

export default function TaxAssessorDashboard({ user }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({})
  const [assessmentTrend, setAssessmentTrend] = useState([])
  const [taxByType, setTaxByType] = useState([])
  const [assessmentStatus, setAssessmentStatus] = useState([])

  // Quick Calculator State
  const [calcArea, setCalcArea] = useState(1500)
  const [calcType, setCalcType] = useState('RESIDENTIAL')
  const [calcResult, setCalcResult] = useState(null)
  const [calcBusy, setCalcBusy] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError('')

        const [statsRes, trendRes, taxTypeRes, statusRes] = await Promise.all([
          api.get('/api/analytics/dashboard'),
          api.get('/api/analytics/assessment-trend'),
          api.get('/api/analytics/tax-by-property-type'),
          api.get('/api/analytics/assessment-status'),
        ])

        setStats(statsRes.data || {})
        setAssessmentTrend(trendRes.data || [])
        setTaxByType(taxTypeRes.data || [])
        setAssessmentStatus(statusRes.data || [])
      } catch (err) {
        setError(errorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleCalculate = async (e) => {
    e.preventDefault()
    try {
      setCalcBusy(true)
      const res = await api.post(`/api/assessments/calculate?areaSqft=${calcArea}&constructionType=${calcType}`)
      setCalcResult(res.data)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setCalcBusy(false)
    }
  }

  return (
    <div className="dashboard-view">
      {/* Welcome Banner */}
      <div className="dashboard-welcome-banner">
        <div>
          <p className="eyebrow">Revenue Assessment Wing</p>
          <h2>Tax Assessor Workbench</h2>
          <p className="welcome-sub">
            Formulate tax assessments, apply rate guidelines and statutory penalties, and monitor collection health.
          </p>
        </div>
        <div className="quick-action-buttons">
          <Link to="/tax-assessments" className="action-btn primary">
            <Plus size={16} /> New Assessment
          </Link>
          <Link to="/notices" className="action-btn secondary">
            <AlertTriangle size={16} /> Tax Notices
          </Link>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card amber" style={{ animationDelay: '0.05s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><Clock size={20} /></span>
            <span className="kpi-tag">Unpaid</span>
          </div>
          <p className="kpi-title">Pending Assessments</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.pendingAssessmentsCount || 0} />
          </h3>
          <span className="kpi-foot">Requires collection review</span>
        </div>

        <div className="kpi-card teal" style={{ animationDelay: '0.1s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><CheckCircle size={20} /></span>
            <span className="kpi-tag">Closed</span>
          </div>
          <p className="kpi-title">Completed Assessments</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.completedAssessmentsCount || 0} />
          </h3>
          <span className="kpi-foot">Fully paid assessments</span>
        </div>

        <div className="kpi-card coral" style={{ animationDelay: '0.15s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><AlertTriangle size={20} /></span>
            <span className="kpi-tag">Penalty Active</span>
          </div>
          <p className="kpi-title">Overdue Assessments</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.overdueAssessmentsCount || 0} />
          </h3>
          <span className="kpi-foot">Overdue past March deadline</span>
        </div>

        <div className="kpi-card emerald" style={{ animationDelay: '0.2s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><FileSpreadsheet size={20} /></span>
            <span className="kpi-tag">Valuation</span>
          </div>
          <p className="kpi-title">Total Assessed Value</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.totalAssessedValue || 0} isMoney />
          </h3>
          <span className="kpi-foot">Capital asset assessment value</span>
        </div>
      </div>

      {/* Real Charts Grid */}
      <div className="dashboard-charts-grid">
        {/* Chart 1: Assessment Trend LINE CHART */}
        <div className="chart-card wide-card">
          <div className="chart-card-head">
            <div>
              <p className="eyebrow">Assessment Volume</p>
              <h4>1. Assessment Trend (Over Time)</h4>
            </div>
            <span className="chart-badge">Live DB</span>
          </div>
          <p className="chart-desc">Number of tax assessment orders issued by municipal assessor wing.</p>
          <LineChart data={assessmentTrend} height={230} isMoney={false} color="#2a6a5d" gradientId="assessorTrendGrad" />
        </div>

        {/* Chart 2: Tax Amount by Property Type BAR CHART */}
        <div className="chart-card">
          <div className="chart-card-head">
            <div>
              <p className="eyebrow">Sector Revenue</p>
              <h4>2. Tax Amount by Property Type</h4>
            </div>
          </div>
          <p className="chart-desc">Revenue proportion from Residential, Commercial, Industrial, and Vacant land.</p>
          <BarChart data={taxByType} height={230} isMoney horizontal />
        </div>

        {/* Chart 3: Assessment Status DONUT CHART */}
        <div className="chart-card">
          <div className="chart-card-head">
            <div>
              <p className="eyebrow">Status Ratios</p>
              <h4>3. Assessment Status</h4>
            </div>
          </div>
          <p className="chart-desc">Pending, Paid, Partial, Overdue, and Defaulted assessment records.</p>
          <DonutChart data={assessmentStatus} centerLabel="Assessments" />
        </div>
      </div>

      {/* Interactive Quick Tax Calculator Tool */}
      <div className="panel-card full-width-panel">
        <div className="panel-card-head">
          <div>
            <h4>Official Tax Calculation Tool</h4>
            <p className="panel-sub">Simulate assessment rates based on municipal bylaws and property specifications.</p>
          </div>
          <Link to="/tax-assessments" className="text-link">Full Calculator <ArrowUpRight size={14} /></Link>
        </div>

        <form onSubmit={handleCalculate} className="calc-inline-form">
          <div className="calc-input-group">
            <label>Area (Sq. Ft)</label>
            <input
              type="number"
              min="100"
              value={calcArea}
              onChange={(e) => setCalcArea(e.target.value)}
              required
            />
          </div>

          <div className="calc-input-group">
            <label>Construction Type</label>
            <select value={calcType} onChange={(e) => setCalcType(e.target.value)}>
              <option value="RESIDENTIAL">Residential (₹15/sqft)</option>
              <option value="COMMERCIAL">Commercial (₹25/sqft)</option>
              <option value="INDUSTRIAL">Industrial (₹35/sqft)</option>
              <option value="VACANT">Vacant Land (₹8/sqft)</option>
            </select>
          </div>

          <button type="submit" className="primary btn-calc" disabled={calcBusy}>
            <Calculator size={16} /> {calcBusy ? 'Calculating…' : 'Compute Tax'}
          </button>

          {calcResult && (
            <div className="calc-result-pill">
              <span>Base Rate: <b>₹{calcResult.baseRatePerSqft}/sqft</b></span>
              <span>Calculated Tax: <b>₹{Number(calcResult.calculatedTax).toLocaleString('en-IN')}</b></span>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
