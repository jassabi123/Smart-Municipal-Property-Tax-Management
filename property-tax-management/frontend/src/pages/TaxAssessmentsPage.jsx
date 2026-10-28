import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FileSpreadsheet, 
  Calculator, 
  Plus, 
  Search, 
  Filter, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldAlert, 
  X,
  ArrowRight,
  TrendingUp,
  Percent
} from 'lucide-react'
import { api, errorMessage } from '../api/client'

export default function TaxAssessmentsPage({ user }) {
  const navigate = useNavigate()
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [selectedFY, setSelectedFY] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCalculatorModal, setShowCalculatorModal] = useState(false)

  // Create Form State
  const [createForm, setCreateForm] = useState({
    propertyId: '',
    financialYear: '2024-25',
    taxAmount: '',
    penalty: '0'
  })
  const [submitting, setSubmitting] = useState(false)

  // Interactive Calculator State
  const [calcInput, setCalcInput] = useState({
    areaSqft: 1200,
    constructionType: 'RESIDENTIAL',
    wardZone: 'A', // Zone A (Wards 1-5), Zone B (Wards 6-12), Zone C (Wards 13-20)
    structureAgeYears: 5
  })

  // Calculation logic based on standard municipal unit area method
  const calculationResult = useMemo(() => {
    const area = Number(calcInput.areaSqft) || 0
    
    // Base unit rates per sq ft
    const baseRates = {
      RESIDENTIAL: 2.5,
      COMMERCIAL: 6.0,
      INDUSTRIAL: 4.5
    }
    const unitRate = baseRates[calcInput.constructionType] || 2.5

    // Zone factor
    const zoneFactors = { A: 1.25, B: 1.0, C: 0.85 }
    const zoneFactor = zoneFactors[calcInput.wardZone] || 1.0

    // Age depreciation factor
    const age = Number(calcInput.structureAgeYears) || 0
    let depreciation = 0
    if (age > 20) depreciation = 0.20
    else if (age > 10) depreciation = 0.10
    else if (age > 5) depreciation = 0.05

    const annualValue = area * unitRate * zoneFactor * (1 - depreciation) * 12
    const taxRatePercent = 0.10 // 10% standard municipal tax
    const estimatedTax = Math.round(annualValue * taxRatePercent)
    const educationCess = Math.round(estimatedTax * 0.05)
    const totalTax = estimatedTax + educationCess

    return {
      annualValue: Math.round(annualValue),
      estimatedTax,
      educationCess,
      totalTax
    }
  }, [calcInput])

  // Fetch assessments
  const fetchAssessments = async () => {
    setLoading(true)
    setError('')
    try {
      if (user?.role === 'PROPERTY_OWNER') {
        // Fetch properties first, then assessments linked to each property
        const propsRes = await api.get('/api/properties')
        const props = Array.isArray(propsRes.data) ? propsRes.data : []
        const assessmentsNested = await Promise.all(
          props.map(p => api.get(`/api/properties/${p.id}/assessment`).then(r => r.data).catch(() => []))
        )
        const flat = assessmentsNested.flat().filter(Boolean)
        setAssessments(flat)
      } else {
        // Staff can view all assessments
        const res = await api.get('/api/assessments')
        setAssessments(Array.isArray(res.data) ? res.data : [])
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssessments()
  }, [])

  // Create assessment submit
  const handleCreateAssessment = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.post('/api/assessments', {
        propertyId: Number(createForm.propertyId),
        financialYear: createForm.financialYear,
        taxAmount: Number(createForm.taxAmount),
        penalty: Number(createForm.penalty || 0)
      })
      setSuccessMessage('Assessment created and registered in municipal ledger.')
      setShowCreateModal(false)
      fetchAssessments()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  // Apply calculated amount to create form
  const applyCalculationToForm = () => {
    setCreateForm(prev => ({
      ...prev,
      taxAmount: String(calculationResult.totalTax)
    }))
    setShowCalculatorModal(false)
    setShowCreateModal(true)
  }

  // Filtered assessments list
  const filteredAssessments = useMemo(() => {
    return assessments.filter(a => {
      const matchesSearch = 
        !searchQuery ||
        String(a.id).includes(searchQuery) ||
        String(a.propertyId).includes(searchQuery) ||
        a.financialYear?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = selectedStatus === 'ALL' || a.status === selectedStatus
      const matchesFY = selectedFY === 'ALL' || a.financialYear === selectedFY

      return matchesSearch && matchesStatus && matchesFY
    })
  }, [assessments, searchQuery, selectedStatus, selectedFY])

  const canCreate = ['TAX_ASSESSOR', 'ADMIN'].includes(user?.role)

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <span className="page-pretitle">STATUTORY VALUATION</span>
          <h2 className="page-title">Property Tax Assessments</h2>
          <p className="page-subtitle">
            {user?.role === 'PROPERTY_OWNER'
              ? 'Financial-year tax liability, penalties, and payment status for your properties.'
              : 'Valuation records, rate multipliers, demand notices, and financial year ledgers.'}
          </p>
        </div>

        <div className="page-actions-group">
          <button 
            onClick={() => setShowCalculatorModal(true)} 
            className="btn btn-outline"
          >
            <Calculator size={16} /> Tax Calculator
          </button>

          {canCreate && (
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="btn btn-primary"
            >
              <Plus size={16} /> New Assessment
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert-box alert-error">
          <ShieldAlert size={18} />
          <span>{error}</span>
          <button onClick={() => setError('')} className="alert-close">×</button>
        </div>
      )}

      {successMessage && (
        <div className="alert-box alert-success">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="alert-close">×</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar-container">
        <div className="search-bar-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Assessment ID, Property ID, or FY..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filters-group">
          <div className="filter-select-wrap">
            <span className="filter-label">Financial Year:</span>
            <select value={selectedFY} onChange={(e) => setSelectedFY(e.target.value)}>
              <option value="ALL">All FYs</option>
              <option value="2024-25">2024-25</option>
              <option value="2023-24">2023-24</option>
              <option value="2025-26">2025-26</option>
            </select>
          </div>

          <div className="filter-select-wrap">
            <span className="filter-label">Status:</span>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="PENDING">Pending</option>
              <option value="DEFAULTED">Defaulted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assessments Table */}
      {loading ? (
        <div className="loading-state-card">
          <span className="spinner-icon-lg" />
          <p>Retrieving Assessment Records…</p>
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className="empty-state-card">
          <FileSpreadsheet size={48} className="empty-icon" />
          <h3>No tax assessment records found</h3>
          <p>No assessment records match your filter criteria or no assessments have been issued.</p>
        </div>
      ) : (
        <div className="data-table-card">
          <div className="table-responsive">
            <table className="civic-table">
              <thead>
                <tr>
                  <th>Assessment ID</th>
                  <th>Property ID</th>
                  <th>Financial Year</th>
                  <th>Assessed Tax</th>
                  <th>Penalty</th>
                  <th>Total Due</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssessments.map((a) => {
                  const totalDue = Number(a.taxAmount || 0) + Number(a.penalty || 0)
                  const isPayable = a.status !== 'PAID'
                  
                  return (
                    <tr key={a.id} className="hoverable-row">
                      <td>
                        <div className="property-id-cell">
                          <FileSpreadsheet size={16} className="text-primary" />
                          <strong>#{a.id}</strong>
                        </div>
                      </td>
                      <td>
                        <span className="ward-pill">Property #{a.propertyId}</span>
                      </td>
                      <td>
                        <strong>{a.financialYear}</strong>
                      </td>
                      <td>₹{Number(a.taxAmount || 0).toLocaleString('en-IN')}</td>
                      <td>
                        {Number(a.penalty || 0) > 0 ? (
                          <span className="text-danger font-semibold">
                            +₹{Number(a.penalty).toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-muted">₹0</span>
                        )}
                      </td>
                      <td>
                        <strong className="text-highlight">₹{totalDue.toLocaleString('en-IN')}</strong>
                      </td>
                      <td>
                        <span className={`status-pill status-${a.status?.toLowerCase()}`}>
                          <span className="dot" /> {a.status}
                        </span>
                      </td>
                      <td className="text-right">
                        {isPayable ? (
                          <button
                            onClick={() => navigate(`/tax-payments?assessmentId=${a.id}&amount=${totalDue}`)}
                            className="btn-action-pay"
                            title="Pay this assessment"
                          >
                            <CreditCard size={14} /> Pay Tax
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/tax-payments?assessmentId=${a.id}`)}
                            className="btn-action-icon"
                            title="View payments for this assessment"
                          >
                            <CheckCircle2 size={14} /> Receipts
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="table-footer-info">
            <span>Showing {filteredAssessments.length} assessment records</span>
            <span className="ledger-sync-tag"><span className="live-dot" /> Audit Ledger Ready</span>
          </div>
        </div>
      )}

      {/* Tax Calculator Modal */}
      {showCalculatorModal && (
        <div className="modal-backdrop" onClick={() => setShowCalculatorModal(false)}>
          <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <Calculator size={22} className="text-primary" />
                <div>
                  <h3>Municipal Unit Area Tax Calculator</h3>
                  <p>Standardized statutory property valuation engine</p>
                </div>
              </div>
              <button onClick={() => setShowCalculatorModal(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-row-2col">
                <div className="form-group">
                  <label>Covered Area (sq. ft.)</label>
                  <input
                    type="number"
                    min="50"
                    max="100000"
                    value={calcInput.areaSqft}
                    onChange={(e) => setCalcInput({ ...calcInput, areaSqft: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label>Usage / Construction Type</label>
                  <select
                    value={calcInput.constructionType}
                    onChange={(e) => setCalcInput({ ...calcInput, constructionType: e.target.value })}
                  >
                    <option value="RESIDENTIAL">Residential (Base ₹2.5/sqft/mo)</option>
                    <option value="COMMERCIAL">Commercial (Base ₹6.0/sqft/mo)</option>
                    <option value="INDUSTRIAL">Industrial (Base ₹4.5/sqft/mo)</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label>Municipal Ward Zone</label>
                  <select
                    value={calcInput.wardZone}
                    onChange={(e) => setCalcInput({ ...calcInput, wardZone: e.target.value })}
                  >
                    <option value="A">Zone A: Prime Commercial / Arterial (1.25x)</option>
                    <option value="B">Zone B: Developing Urban (1.00x)</option>
                    <option value="C">Zone C: Suburban / Peripheral (0.85x)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Building Age (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={calcInput.structureAgeYears}
                    onChange={(e) => setCalcInput({ ...calcInput, structureAgeYears: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Calculation Breakdown Preview Box */}
              <div className="calculator-result-box">
                <div className="calc-result-header">
                  <span>Valuation Estimate</span>
                  <span className="annual-val-chip">Annual Value: ₹{calculationResult.annualValue.toLocaleString('en-IN')}</span>
                </div>
                
                <div className="calc-breakdown-grid">
                  <div className="breakdown-item">
                    <span>Base Property Tax (10%)</span>
                    <strong>₹{calculationResult.estimatedTax.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="breakdown-item">
                    <span>Education &amp; Library Cess (5%)</span>
                    <strong>+₹{calculationResult.educationCess.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="breakdown-item total-item">
                    <span>Total Annual Tax Liability</span>
                    <strong className="total-amount-highlight">
                      ₹{calculationResult.totalTax.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowCalculatorModal(false)} className="btn btn-secondary">
                Close
              </button>
              {canCreate && (
                <button onClick={applyCalculationToForm} className="btn btn-primary">
                  Apply Value to Assessment Form <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Assessment Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <FileSpreadsheet size={22} className="text-primary" />
                <div>
                  <h3>Issue Tax Assessment</h3>
                  <p>Publish an assessed tax liability into the municipal database</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAssessment}>
              <div className="modal-body">
                <div className="form-row-2col">
                  <div className="form-group">
                    <label>Internal Property ID</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 1"
                      value={createForm.propertyId}
                      onChange={(e) => setCreateForm({ ...createForm, propertyId: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Financial Year</label>
                    <select
                      value={createForm.financialYear}
                      onChange={(e) => setCreateForm({ ...createForm, financialYear: e.target.value })}
                    >
                      <option value="2024-25">2024-25</option>
                      <option value="2023-24">2023-24</option>
                      <option value="2025-26">2025-26</option>
                    </select>
                  </div>
                </div>

                <div className="form-row-2col">
                  <div className="form-group">
                    <label>Assessed Tax Amount (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 12500"
                      value={createForm.taxAmount}
                      onChange={(e) => setCreateForm({ ...createForm, taxAmount: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Penalty Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={createForm.penalty}
                      onChange={(e) => setCreateForm({ ...createForm, penalty: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Issuing Assessment…' : 'Issue Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
