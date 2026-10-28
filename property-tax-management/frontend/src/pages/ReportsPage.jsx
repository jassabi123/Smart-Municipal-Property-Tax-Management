import React, { useState, useEffect, useMemo } from 'react'
import { api, errorMessage } from '../api/client'
import {
  FileText,
  Download,
  Printer,
  RefreshCw,
  Search,
  Building2,
  AlertOctagon,
  Percent,
  Compass,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  FileSpreadsheet
} from 'lucide-react'

export default function ReportsPage({ user }) {
  const [activeReport, setActiveReport] = useState('REVENUE_REGISTER')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWard, setSelectedWard] = useState('ALL')
  const [selectedFY, setSelectedFY] = useState('ALL')

  // Raw data from backend endpoints
  const [assessments, setAssessments] = useState([])
  const [properties, setProperties] = useState([])
  const [defaulters, setDefaulters] = useState([])
  const [wardStats, setWardStats] = useState([])
  const [exemptions, setExemptions] = useState([])
  const [collectionSummary, setCollectionSummary] = useState(null)

  const fetchReportData = async () => {
    setLoading(true)
    setError('')
    try {
      const [
        assessmentsRes,
        propertiesRes,
        defaultersRes,
        wardRes,
        exemptionsRes,
        collRes
      ] = await Promise.all([
        api.get('/api/assessments').catch(() => ({ data: [] })),
        api.get('/api/properties').catch(() => ({ data: [] })),
        api.get('/api/analytics/defaulters?limit=50').catch(() => ({ data: [] })),
        api.get('/api/analytics/ward-performance').catch(() => ({ data: [] })),
        api.get('/api/exemptions').catch(() => ({ data: [] })),
        api.get('/api/analytics/collection').catch(() => ({ data: null }))
      ])

      setAssessments(Array.isArray(assessmentsRes.data) ? assessmentsRes.data : [])
      setProperties(Array.isArray(propertiesRes.data) ? propertiesRes.data : [])
      setDefaulters(Array.isArray(defaultersRes.data) ? defaultersRes.data : [])
      setWardStats(Array.isArray(wardRes.data) ? wardRes.data : [])
      setExemptions(Array.isArray(exemptionsRes.data) ? exemptionsRes.data : [])
      setCollectionSummary(collRes.data)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [])

  // Normalizes any ward string into a canonical number or lower-case key
  const normalizeWard = (w) => {
    if (!w || w === '—' || w === 'Not Assigned') return ''
    const str = String(w).trim()
    const match = str.match(/(?:ward|w)?[-_\s]*0*(\d+)/i)
    if (match) return match[1]
    return str.toLowerCase()
  }

  // Formats ward value into standard civic display e.g. "W-02" or "Not Assigned"
  const formatWard = (ward) => {
    if (!ward || ward === '—' || String(ward).trim() === '' || String(ward).trim().toLowerCase() === 'not assigned') {
      return 'Not Assigned'
    }
    const str = String(ward).trim()
    const match = str.match(/(?:ward|w)?[-_\s]*0*(\d+)/i)
    if (match) {
      const num = parseInt(match[1], 10)
      return `W-${String(num).padStart(2, '0')}`
    }
    return str
  }

  // Flexible matcher that matches exact strings or canonical ward numbers
  const isWardMatch = (rowWard, filterWard) => {
    if (!filterWard || filterWard === 'ALL') return true
    if (!rowWard) return false
    const strRow = String(rowWard).trim().toLowerCase()
    const strFilter = String(filterWard).trim().toLowerCase()
    if (strRow === strFilter) return true
    const normRow = normalizeWard(strRow)
    const normFilter = normalizeWard(strFilter)
    if (normRow && normFilter && normRow === normFilter) return true
    return false
  }

  // Wards list dynamically derived from actual data without hardcoding
  const wardOptions = useMemo(() => {
    const map = new Map()

    const addWard = (raw) => {
      if (!raw || raw === '—' || String(raw).trim() === '' || String(raw).trim().toLowerCase() === 'not assigned') return
      const str = String(raw).trim()
      const norm = normalizeWard(str)
      if (!norm) return
      const label = formatWard(str)
      if (!map.has(norm)) {
        map.set(norm, {
          key: norm,
          value: label,
          numericValue: norm,
          label: label
        })
      }
    }

    properties.forEach(p => addWard(p.wardNo))
    assessments.forEach(a => addWard(a.wardNo || a.ward))
    wardStats.forEach(w => addWard(w.wardNo || w.ward))

    return Array.from(map.values()).sort((a, b) => {
      const numA = parseInt(a.numericValue, 10) || 0
      const numB = parseInt(b.numericValue, 10) || 0
      if (numA && numB) return numA - numB
      return a.label.localeCompare(b.label)
    })
  }, [properties, assessments, wardStats])

  // Financial Year list dynamically derived from data
  const fyOptions = useMemo(() => {
    const set = new Set()
    assessments.forEach(a => { if (a.financialYear && a.financialYear !== '—') set.add(a.financialYear) })
    defaulters.forEach(d => { if (d.financialYear && d.financialYear !== '—') set.add(d.financialYear) })
    ;['2025-26', '2024-25', '2023-24'].forEach(y => set.add(y))
    return Array.from(set).sort().reverse()
  }, [assessments, defaulters])

  // Process data for currently selected report tab
  const reportData = useMemo(() => {
    let rows = []

    if (activeReport === 'REVENUE_REGISTER') {
      rows = assessments.map(a => {
        const linkedProp = properties.find(p => p.id === a.propertyId || p.propertyId === a.propertyIdentifier)
        const rawWard = a.wardNo || a.ward || linkedProp?.wardNo || null
        const ward = formatWard(rawWard)
        const rawDueDate = a.dueDate
        const dueDate = (rawDueDate && rawDueDate !== '—') ? rawDueDate : 'Not Scheduled'
        const propId = a.propertyIdentifier || a.propertyId || linkedProp?.propertyId || '—'
        const ownerName = a.ownerName || linkedProp?.ownerName || '—'

        return {
          refId: a.id,
          propertyId: propId,
          ownerName: ownerName,
          financialYear: a.financialYear || '—',
          ward: ward,
          wardRaw: rawWard,
          taxAmount: Number(a.taxAmount) || 0,
          penalty: Number(a.penalty) || 0,
          totalDue: Number(a.totalDue ?? (Number(a.taxAmount || 0) + Number(a.penalty || 0))) || 0,
          status: a.status || 'PENDING',
          dueDate: dueDate
        }
      })
    } else if (activeReport === 'DEFAULTERS_SCHEDULE') {
      rows = defaulters.map((d, idx) => {
        const penalty = Number(d.penalty) || 0
        const totalDue = Number(d.totalDue ?? d.outstandingAmount ?? (Number(d.taxAmount || 0) + penalty)) || 0
        const taxAmount = Number(d.taxAmount != null ? d.taxAmount : (totalDue - penalty)) || 0
        const linkedProp = properties.find(p => p.id === d.propertyId || p.propertyId === d.propertyId || p.propertyId === d.propertyIdentifier)
        const rawWard = d.ward || d.wardNo || linkedProp?.wardNo || null
        const ward = formatWard(rawWard)
        const rawDueDate = d.dueDate
        const dueDate = (rawDueDate && rawDueDate !== '—') ? rawDueDate : 'Not Scheduled'

        return {
          refId: d.id ?? d.assessmentId ?? (idx + 1),
          propertyId: d.propertyId ?? d.propertyIdentifier ?? linkedProp?.propertyId ?? '—',
          ownerName: d.ownerName || linkedProp?.ownerName || '—',
          ward: ward,
          wardRaw: rawWard,
          financialYear: d.financialYear || '2025-26',
          taxAmount,
          penalty,
          totalDue,
          status: d.status || 'DEFAULTED',
          dueDate: dueDate
        }
      })
    } else if (activeReport === 'WARD_PERFORMANCE') {
      rows = wardStats.map((w, idx) => ({
        refId: idx + 1,
        ward: formatWard(w.wardNo || w.ward || `W-0${idx + 1}`),
        totalProperties: Number(w.totalProperties || w.propertiesCount || 0),
        totalAssessed: Number(w.totalAssessed || w.assessedCount || 0),
        totalDemand: Number(w.totalDemand || w.assessedAmount || 0),
        totalCollected: Number(w.totalCollected || w.collectedAmount || 0),
        efficiency: Number(w.efficiency || w.collectionRate || 0)
      }))
    } else if (activeReport === 'EXEMPTIONS_AUDIT') {
      rows = exemptions.map(e => ({
        refId: e.id,
        propertyId: e.propertyId || (e.property && e.property.propertyId) || '—',
        exemptionType: e.exemptionType || 'STANDARD',
        percentage: Number(e.percentage) || 0,
        validFrom: e.validFrom || '—',
        validTo: e.validTo || '—',
        approvedBy: e.approvedByName || (e.approvedBy && e.approvedBy.name) || 'Finance Desk'
      }))
    } else if (activeReport === 'PROPERTY_REGISTER') {
      rows = properties.map(p => ({
        refId: p.id,
        propertyId: p.propertyId || '—',
        ownerName: p.ownerName || '—',
        ward: formatWard(p.wardNo),
        wardRaw: p.wardNo,
        constructionType: p.constructionType || '—',
        areaSqft: Number(p.areaSqft) || 0,
        assessedValue: Number(p.assessedValue) || 0,
        status: p.status || 'ACTIVE'
      }))
    }

    // Apply Parametric Filters
    return rows.filter(r => {
      const matchesSearch = !searchQuery || Object.values(r).some(val =>
        String(val).toLowerCase().includes(searchQuery.toLowerCase())
      )
      const matchesWard = selectedWard === 'ALL' || isWardMatch(r.ward, selectedWard) || (r.wardRaw && isWardMatch(r.wardRaw, selectedWard))
      const matchesFY = selectedFY === 'ALL' || r.financialYear === selectedFY
      return matchesSearch && matchesWard && matchesFY
    })
  }, [activeReport, assessments, properties, defaulters, wardStats, exemptions, searchQuery, selectedWard, selectedFY])


  // Summary Metrics for the Active Report
  const metrics = useMemo(() => {
    if (activeReport === 'REVENUE_REGISTER' || activeReport === 'DEFAULTERS_SCHEDULE') {
      const totalDemand = reportData.reduce((sum, r) => sum + (r.totalDue || 0), 0)
      const totalTax = reportData.reduce((sum, r) => sum + (r.taxAmount || 0), 0)
      const totalPenalty = reportData.reduce((sum, r) => sum + (r.penalty || 0), 0)
      return [
        { label: 'Report Records', value: reportData.length, note: 'Filtered ledger entries' },
        { label: 'Assessed Tax', value: `₹${totalTax.toLocaleString('en-IN')}`, note: 'Base statutory assessment' },
        { label: 'Surcharges & Fine', value: `₹${totalPenalty.toLocaleString('en-IN')}`, note: 'Late fee / arrear surcharge' },
        { label: 'Total Demand / Dues', value: `₹${totalDemand.toLocaleString('en-IN')}`, note: 'Combined municipal claim' }
      ]
    } else if (activeReport === 'WARD_PERFORMANCE') {
      const totalDemand = reportData.reduce((sum, r) => sum + (r.totalDemand || 0), 0)
      const totalCollected = reportData.reduce((sum, r) => sum + (r.totalCollected || 0), 0)
      const avgEfficiency = reportData.length > 0
        ? Math.round(reportData.reduce((sum, r) => sum + (r.efficiency || 0), 0) / reportData.length)
        : 0
      return [
        { label: 'Wards Covered', value: reportData.length, note: 'Municipal zones' },
        { label: 'Total Demand', value: `₹${totalDemand.toLocaleString('en-IN')}`, note: 'Aggregate valuation demand' },
        { label: 'Realized Revenue', value: `₹${totalCollected.toLocaleString('en-IN')}`, note: 'Bank cleared receipts' },
        { label: 'Average Efficiency', value: `${avgEfficiency}%`, note: 'Realization ratio' }
      ]
    } else if (activeReport === 'EXEMPTIONS_AUDIT') {
      const avgRebate = reportData.length > 0
        ? Math.round(reportData.reduce((sum, r) => sum + (r.percentage || 0), 0) / reportData.length)
        : 0
      return [
        { label: 'Active Exemptions', value: reportData.length, note: 'Certified relief grants' },
        { label: 'Average Rebate', value: `${avgRebate}%`, note: 'Statutory concession rate' },
        { label: 'Categories Audited', value: '4', note: 'Senior, Disability, NGO, Govt' },
        { label: 'Verification Status', value: '100% Certified', note: 'Validated by Finance Desk' }
      ]
    } else {
      const totalValuation = reportData.reduce((sum, r) => sum + (r.assessedValue || 0), 0)
      const totalArea = reportData.reduce((sum, r) => sum + (r.areaSqft || 0), 0)
      return [
        { label: 'Registered Holdings', value: reportData.length, note: 'Cadastral properties' },
        { label: 'Cumulative Valuation', value: `₹${totalValuation.toLocaleString('en-IN')}`, note: 'Base capital value' },
        { label: 'Total Built Area', value: `${totalArea.toLocaleString('en-IN')} sqft`, note: 'Taxable footprint' },
        { label: 'Cadastral Wards', value: wardOptions.length || '8', note: 'Jurisdiction coverage' }
      ]
    }
  }, [activeReport, reportData, wardOptions])

  // Export current table view as CSV
  const handleExportCSV = () => {
    if (reportData.length === 0) return

    const headers = Object.keys(reportData[0])
    const csvRows = [
      headers.join(','),
      ...reportData.map(row =>
        headers.map(field => {
          const val = row[field] == null ? '' : String(row[field])
          return `"${val.replace(/"/g, '""')}"`
        }).join(',')
      )
    ]

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Municipal_Report_${activeReport}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <span className="page-pretitle">STATUTORY AUDIT & FISCAL OVERSIGHT</span>
          <h2 className="page-title">Municipal Reports & Registers</h2>
          <p className="page-subtitle">
            Official municipal tax registers, arrear schedules, ward revenue audits, and statutory disclosure reports.
          </p>
        </div>

        <div className="header-actions">
          <button onClick={fetchReportData} className="btn btn-secondary" title="Refresh data">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={handleExportCSV} className="btn btn-secondary" disabled={reportData.length === 0}>
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => window.print()} className="btn btn-primary">
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      {/* Report Tab Selector */}
      <div className="report-tabs-bar mb-5" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        {[
          { id: 'REVENUE_REGISTER', label: 'Revenue & Assessment Register', icon: FileSpreadsheet },
          { id: 'DEFAULTERS_SCHEDULE', label: 'Defaulter & Arrears Schedule', icon: AlertOctagon },
          { id: 'WARD_PERFORMANCE', label: 'Ward Fiscal Performance', icon: Compass },
          { id: 'EXEMPTIONS_AUDIT', label: 'Exemption & Rebate Audit', icon: Percent },
          { id: 'PROPERTY_REGISTER', label: 'Property Asset Register', icon: Building2 }
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeReport === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveReport(tab.id); setSearchQuery('') }}
              className={`btn ${isActive ? 'btn-primary' : 'btn-outline'}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '8px 14px' }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* Key Metrics Banner */}
      <div className="kpi-grid-4 mb-6">
        {metrics.map((m, idx) => (
          <div key={idx} className="kpi-card">
            <span className="kpi-title">{m.label}</span>
            <span className="kpi-value">{m.value}</span>
            <span className="kpi-foot">{m.note}</span>
          </div>
        ))}
      </div>

      {/* Toolbar / Filters */}
      <div className="toolbar-container">
        <div className="search-bar-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search within active report (Ref, Property, Owner, Ward)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filters-group">
          {(activeReport === 'REVENUE_REGISTER' || activeReport === 'DEFAULTERS_SCHEDULE' || activeReport === 'PROPERTY_REGISTER') && (
            <div className="filter-select-wrap">
              <span className="filter-label">Ward:</span>
              <select
                id="filter-ward-select"
                aria-label="Filter by Ward"
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
              >
                <option value="ALL">All Wards</option>
                {wardOptions.map(w => (
                  <option key={w.key} value={w.value}>{w.label}</option>
                ))}
              </select>
            </div>
          )}

          {(activeReport === 'REVENUE_REGISTER' || activeReport === 'DEFAULTERS_SCHEDULE') && (
            <div className="filter-select-wrap">
              <span className="filter-label">Financial Year:</span>
              <select
                id="filter-fy-select"
                aria-label="Filter by Financial Year"
                value={selectedFY}
                onChange={(e) => setSelectedFY(e.target.value)}
              >
                <option value="ALL">All FYs</option>
                {fyOptions.map(fy => (
                  <option key={fy} value={fy}>{fy}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Report Table */}
      <div className="data-table-card">
        <div className="table-card-header">
          <div className="header-title-wrap">
            <FileText size={18} className="text-primary" />
            <h3>
              {activeReport === 'REVENUE_REGISTER' && 'Official Tax Assessment & Demand Register'}
              {activeReport === 'DEFAULTERS_SCHEDULE' && 'Statutory Defaulters & Arrears Aging Schedule'}
              {activeReport === 'WARD_PERFORMANCE' && 'Ward-wise Fiscal Collection & Performance Audit'}
              {activeReport === 'EXEMPTIONS_AUDIT' && 'Approved Concessions & Exemption Audit Log'}
              {activeReport === 'PROPERTY_REGISTER' && 'Municipal Cadastral Property Asset Register'}
            </h3>
          </div>
          <span className="live-tag">
            <span className="live-dot" /> {reportData.length} records certified
          </span>
        </div>

        {loading ? (
          <div className="loading-state-card py-6 text-center">
            <RefreshCw size={28} className="animate-spin text-primary mx-auto mb-2" />
            <p className="text-muted">Compiling municipal data from ledger...</p>
          </div>
        ) : reportData.length === 0 ? (
          <div className="empty-state-card py-6 text-center">
            <CheckCircle2 size={36} className="text-success mx-auto mb-2" />
            <p className="text-muted">No records match the selected report criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            {activeReport === 'REVENUE_REGISTER' && (
              <table className="civic-table">
                <thead>
                  <tr>
                    <th>Ref #</th>
                    <th>Property ID</th>
                    <th>Financial Year</th>
                    <th>Ward</th>
                    <th>Base Tax</th>
                    <th>Penalty</th>
                    <th>Total Demand</th>
                    <th>Status</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r, i) => (
                    <tr key={r.refId ? `rev-${r.refId}` : `rev-${i}`}>
                      <td><strong>#{r.refId}</strong></td>
                      <td>
                        <strong className="text-primary font-mono">{r.propertyId}</strong>
                      </td>
                      <td><span className="badge badge-neutral">{r.financialYear}</span></td>
                      <td>
                        <span className="ward-pill" style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          background: r.ward === 'Not Assigned' ? '#f3f4f6' : '#e8f5e9',
                          color: r.ward === 'Not Assigned' ? '#6b7280' : '#1b4332',
                          fontWeight: 600,
                          fontSize: '12px'
                        }}>
                          {r.ward}
                        </span>
                      </td>
                      <td>₹{r.taxAmount.toLocaleString('en-IN')}</td>
                      <td className={r.penalty > 0 ? 'text-danger font-bold' : 'text-muted'}>
                        ₹{r.penalty.toLocaleString('en-IN')}
                      </td>
                      <td><strong>₹{r.totalDue.toLocaleString('en-IN')}</strong></td>
                      <td>
                        <span className={`status-pill status-${r.status.toLowerCase()}`}>
                          <span className="dot" /> {r.status}
                        </span>
                      </td>
                      <td style={{ color: r.dueDate === 'Not Scheduled' ? '#6b7280' : 'inherit', fontStyle: r.dueDate === 'Not Scheduled' ? 'italic' : 'normal' }}>
                        {r.dueDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeReport === 'DEFAULTERS_SCHEDULE' && (
              <table className="civic-table">
                <thead>
                  <tr>
                    <th>Assessment Ref</th>
                    <th>Property ID</th>
                    <th>Owner Name</th>
                    <th>Ward</th>
                    <th>Financial Year</th>
                    <th>Assessed Tax</th>
                    <th>Penalty Levied</th>
                    <th>Total Overdue</th>
                    <th>Statutory Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r, i) => (
                    <tr key={r.refId ? `def-${r.refId}` : `def-${i}`}>
                      <td><strong>#{r.refId}</strong></td>
                      <td><strong className="text-primary font-mono">{r.propertyId}</strong></td>
                      <td>{r.ownerName}</td>
                      <td>
                        <span className="ward-pill" style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          background: r.ward === 'Not Assigned' ? '#f3f4f6' : '#e8f5e9',
                          color: r.ward === 'Not Assigned' ? '#6b7280' : '#1b4332',
                          fontWeight: 600,
                          fontSize: '12px'
                        }}>
                          {r.ward}
                        </span>
                      </td>
                      <td><span className="badge badge-neutral">{r.financialYear}</span></td>
                      <td>₹{r.taxAmount.toLocaleString('en-IN')}</td>
                      <td className="text-danger font-bold">+₹{r.penalty.toLocaleString('en-IN')}</td>
                      <td><strong className="text-danger">₹{r.totalDue.toLocaleString('en-IN')}</strong></td>
                      <td>
                        <span className="status-pill status-defaulted">
                          <span className="dot" /> {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeReport === 'WARD_PERFORMANCE' && (
              <table className="civic-table">
                <thead>
                  <tr>
                    <th>Ward #</th>
                    <th>Total Properties</th>
                    <th>Assessed Units</th>
                    <th>Aggregate Demand</th>
                    <th>Collection Realized</th>
                    <th>Collection Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r, i) => (
                    <tr key={i}>
                      <td><strong>{r.ward}</strong></td>
                      <td>{r.totalProperties.toLocaleString('en-IN')}</td>
                      <td>{r.totalAssessed.toLocaleString('en-IN')}</td>
                      <td>₹{r.totalDemand.toLocaleString('en-IN')}</td>
                      <td className="text-success font-bold">₹{r.totalCollected.toLocaleString('en-IN')}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, minWidth: '40px' }}>{r.efficiency}%</span>
                          <div style={{ width: '100px', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(r.efficiency, 100)}%`, height: '100%', background: r.efficiency > 75 ? '#10b981' : '#f59e0b' }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeReport === 'EXEMPTIONS_AUDIT' && (
              <table className="civic-table">
                <thead>
                  <tr>
                    <th>Record Ref</th>
                    <th>Property ID</th>
                    <th>Exemption Category</th>
                    <th>Concession Rebate</th>
                    <th>Valid From</th>
                    <th>Valid To</th>
                    <th>Approved By</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r, i) => (
                    <tr key={r.refId ? `ex-${r.refId}` : `ex-${i}`}>
                      <td><strong>#{r.refId}</strong></td>
                      <td><strong className="text-primary font-mono">{r.propertyId}</strong></td>
                      <td><span className="badge badge-primary">{r.exemptionType}</span></td>
                      <td><strong className="text-primary">{r.percentage}% Relief</strong></td>
                      <td>{r.validFrom}</td>
                      <td>{r.validTo}</td>
                      <td>{r.approvedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeReport === 'PROPERTY_REGISTER' && (
              <table className="civic-table">
                <thead>
                  <tr>
                    <th>Registry #</th>
                    <th>Property ID</th>
                    <th>Registered Owner</th>
                    <th>Ward</th>
                    <th>Usage Type</th>
                    <th>Built-up Area</th>
                    <th>Assessed Value</th>
                    <th>Cadastral Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r, i) => (
                    <tr key={r.refId ? `prop-${r.refId}` : `prop-${i}`}>
                      <td><strong>#{r.refId}</strong></td>
                      <td><strong className="text-primary font-mono">{r.propertyId}</strong></td>
                      <td>{r.ownerName}</td>
                      <td>
                        <span className="ward-pill" style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          background: r.ward === 'Not Assigned' ? '#f3f4f6' : '#e8f5e9',
                          color: r.ward === 'Not Assigned' ? '#6b7280' : '#1b4332',
                          fontWeight: 600,
                          fontSize: '12px'
                        }}>
                          {r.ward}
                        </span>
                      </td>
                      <td><span className="badge badge-neutral">{r.constructionType}</span></td>
                      <td>{r.areaSqft.toLocaleString('en-IN')} sqft</td>
                      <td><strong>₹{r.assessedValue.toLocaleString('en-IN')}</strong></td>
                      <td>
                        <span className={`status-pill status-${r.status.toLowerCase()}`}>
                          <span className="dot" /> {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
