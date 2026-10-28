import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Landmark, Compass, Award, AlertOctagon, Building2, TrendingUp, FileText, ArrowUpRight } from 'lucide-react'
import { api, errorMessage } from '../../api/client'
import NumberCounter from '../charts/NumberCounter'
import LineChart from '../charts/LineChart'
import BarChart from '../charts/BarChart'
import GroupedBarChart from '../charts/GroupedBarChart'
import DonutChart from '../charts/DonutChart'
import GaugeChart from '../charts/GaugeChart'

export default function CommissionerDashboard({ user }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({})
  const [revenueTrend, setRevenueTrend] = useState([])
  const [wardPerformance, setWardPerformance] = useState([])
  const [propertyDistribution, setPropertyDistribution] = useState([])
  const [revenueByWard, setRevenueByWard] = useState([])

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError('')

        const [statsRes, trendRes, wardRes, distRes] = await Promise.all([
          api.get('/api/analytics/dashboard'),
          api.get('/api/analytics/revenue-trend'),
          api.get('/api/analytics/ward-performance'),
          api.get('/api/analytics/property-distribution'),
        ])

        setStats(statsRes.data || {})
        setRevenueTrend(trendRes.data || [])
        setWardPerformance(wardRes.data || [])
        setPropertyDistribution(distRes.data || [])

        // Transform ward performance to Revenue by Ward bar chart
        const wardRev = (wardRes.data || []).map(w => ({
          label: w.ward,
          value: Number(w.collected) || 0,
        }))
        setRevenueByWard(wardRev)
      } catch (err) {
        setError(errorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <div className="dashboard-view executive-view">
      {/* Welcome Banner */}
      <div className="dashboard-welcome-banner executive-banner">
        <div>
          <p className="eyebrow">Municipal Executive Suite</p>
          <h2>Commissioner Operations & Strategy Deck</h2>
          <p className="welcome-sub">
            High-level civic revenue intelligence, inter-ward collection benchmarks, and operational governance.
          </p>
        </div>
        <div className="quick-action-buttons">
          <Link to="/ward-performance" className="action-btn primary">
            <Compass size={16} /> Ward Benchmarks
          </Link>
          <Link to="/reports" className="action-btn secondary">
            <FileText size={16} /> Executive Briefing
          </Link>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* 6 Mandatory Executive KPI Cards */}
      <div className="kpi-grid executive-kpis">
        <div className="kpi-card emerald" style={{ animationDelay: '0.04s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><Landmark size={20} /></span>
            <span className="kpi-tag">Total Inflow</span>
          </div>
          <p className="kpi-title">Total Municipal Revenue</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.totalMunicipalRevenue || 0} isMoney />
          </h3>
          <span className="kpi-foot">Verified ledger collections</span>
        </div>

        <div className="kpi-card teal" style={{ animationDelay: '0.08s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><Award size={20} /></span>
            <span className="kpi-tag">KPI</span>
          </div>
          <p className="kpi-title">Collection Efficiency</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.collectionEfficiencyPercent || 0} suffix="%" />
          </h3>
          <span className="kpi-foot">Collected vs Assessed ratio</span>
        </div>

        <div className="kpi-card blue" style={{ animationDelay: '0.12s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><Building2 size={20} /></span>
            <span className="kpi-tag">Assets</span>
          </div>
          <p className="kpi-title">Total Properties</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.totalProperties || 0} />
          </h3>
          <span className="kpi-foot">All municipal ward zones</span>
        </div>

        <div className="kpi-card forest" style={{ animationDelay: '0.16s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><TrendingUp size={20} /></span>
            <span className="kpi-tag">Collected</span>
          </div>
          <p className="kpi-title">Total Tax Collected</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.totalTaxCollected || 0} isMoney />
          </h3>
          <span className="kpi-foot">Completed citizen receipts</span>
        </div>

        <div className="kpi-card amber" style={{ animationDelay: '0.2s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><AlertOctagon size={20} /></span>
            <span className="kpi-tag">Arrears</span>
          </div>
          <p className="kpi-title">Pending Revenue</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.pendingRevenue || 0} isMoney />
          </h3>
          <span className="kpi-foot">Remaining target balance</span>
        </div>

        <div className="kpi-card coral" style={{ animationDelay: '0.24s' }}>
          <div className="kpi-top">
            <span className="kpi-icon-box"><AlertOctagon size={20} /></span>
            <span className="kpi-tag">Compliance</span>
          </div>
          <p className="kpi-title">Total Defaulters</p>
          <h3 className="kpi-value">
            <NumberCounter value={stats.totalDefaulters || 0} />
          </h3>
          <span className="kpi-foot">Flagged accounts</span>
        </div>
      </div>

      {/* Real Charts Grid */}
      <div className="dashboard-charts-grid">
        {/* Chart 1: Revenue Trend AREA/LINE CHART */}
        <div className="chart-card wide-card">
          <div className="chart-card-head">
            <div>
              <p className="eyebrow">Municipality Growth</p>
              <h4>1. Revenue Growth Trend</h4>
            </div>
            <span className="chart-badge">Live API Data</span>
          </div>
          <p className="chart-desc">Progressive monthly tax collections across all municipal administrative zones.</p>
          <LineChart data={revenueTrend} height={230} isMoney color="#1b5149" gradientId="commRevGrad" />
        </div>

        {/* Chart 2: Ward Performance GROUPED BAR CHART */}
        <div className="chart-card wide-card">
          <div className="chart-card-head">
            <div>
              <p className="eyebrow">Zonal Comparison</p>
              <h4>2. Ward Performance (Properties, Collected, Pending)</h4>
            </div>
          </div>
          <p className="chart-desc">Side-by-side performance review comparing collected vs pending tax per ward.</p>
          <GroupedBarChart data={wardPerformance} height={240} />
        </div>

        {/* Chart 3: Collection Efficiency GAUGE CHART */}
        <div className="chart-card">
          <div className="chart-card-head">
            <div>
              <p className="eyebrow">Benchmark</p>
              <h4>3. Collection Efficiency</h4>
            </div>
          </div>
          <p className="chart-desc">Formula: (Total Tax Collected / Total Tax Due) × 100</p>
          <div className="center-gauge-box">
            <GaugeChart value={stats.collectionEfficiencyPercent || 0} label="Municipal Efficiency" />
          </div>
        </div>

        {/* Chart 4: Property Distribution DONUT CHART */}
        <div className="chart-card">
          <div className="chart-card-head">
            <div>
              <p className="eyebrow">Zoning</p>
              <h4>4. Property Distribution</h4>
            </div>
          </div>
          <p className="chart-desc">Distribution across Residential, Commercial, Industrial, and Vacant.</p>
          <DonutChart data={propertyDistribution} centerLabel="Properties" />
        </div>

        {/* Chart 5: Revenue by Ward BAR CHART */}
        <div className="chart-card wide-card">
          <div className="chart-card-head">
            <div>
              <p className="eyebrow">Regional Revenue</p>
              <h4>5. Revenue by Ward</h4>
            </div>
          </div>
          <p className="chart-desc">Ranked revenue collection totals achieved by each administrative ward.</p>
          <BarChart data={revenueByWard} height={220} isMoney color="#317461" />
        </div>
      </div>
    </div>
  )
}
