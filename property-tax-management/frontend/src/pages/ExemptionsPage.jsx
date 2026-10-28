import React, { useState, useEffect } from 'react'
import { 
  Percent, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ShieldAlert, 
  Building2, 
  X,
  Award
} from 'lucide-react'
import { api, errorMessage } from '../api/client'

export default function ExemptionsPage({ user }) {
  const [exemptions, setExemptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    propertyId: '',
    exemptionType: 'SENIOR_CITIZEN',
    percentage: '30',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
    approvedById: user?.userId || '1'
  })
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')

  const fetchExemptions = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/api/exemptions')
      setExemptions(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExemptions()
  }, [])

  const handleCreateExemption = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setModalError('')

    // Client-side date order validation
    if (formData.validFrom >= formData.validTo) {
      setModalError('Effective date must be before expiry date.')
      setSubmitting(false)
      return
    }

    try {
      await api.post('/api/exemptions', {
        propertyId: Number(formData.propertyId),
        exemptionType: formData.exemptionType,
        percentage: Number(formData.percentage),
        validFrom: formData.validFrom,
        validTo: formData.validTo,
        approvedById: Number(formData.approvedById)
      })
      setSuccessMessage('Tax exemption sanctioned and enrolled in municipal ledger.')
      setShowCreateModal(false)
      setModalError('')
      fetchExemptions()
    } catch (err) {
      // Surface validation errors (overlap, date order) inside the modal
      setModalError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const canManage = ['FINANCE_OFFICER', 'ADMIN'].includes(user?.role)

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <span className="page-pretitle">STATUTORY RELIEF PROGRAMS</span>
          <h2 className="page-title">Tax Exemptions &amp; Concessions</h2>
          <p className="page-subtitle">
            Statutory tax rebates and percentage exemptions granted to senior citizens, widows, defense veterans, and charitable institutions.
          </p>
        </div>

        <div className="page-actions-group">
          {canManage && (
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              <Plus size={16} /> Sanction Exemption
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

      {/* Exemptions Table */}
      <div className="data-table-card">
        <div className="table-card-header">
          <div className="header-title-wrap">
            <Percent size={18} className="text-primary" />
            <h3>Sanctioned Exemption Ledgers</h3>
          </div>
          <span className="live-tag"><span className="live-dot" /> Finance Division</span>
        </div>

        {loading ? (
          <div className="loading-state-card">
            <span className="spinner-icon-lg" />
            <p>Loading exemptions…</p>
          </div>
        ) : exemptions.length === 0 ? (
          <div className="empty-state-card">
            <Percent size={48} className="empty-icon" />
            <h3>No tax exemptions active</h3>
            <p>Sanctioned statutory exemptions will appear here.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="civic-table">
              <thead>
                <tr>
                  <th>Exemption Ref #</th>
                  <th>Property Ref</th>
                  <th>Category</th>
                  <th>Concession Rate</th>
                  <th>Valid From</th>
                  <th>Valid To</th>
                  <th>Approved By</th>
                </tr>
              </thead>
              <tbody>
                {exemptions.map((ex) => (
                  <tr key={ex.id} className="hoverable-row">
                    <td>
                      <div className="property-id-cell">
                        <Award size={16} className="text-primary" />
                        <strong>EXM-{ex.id?.toString().padStart(5, '0')}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="ward-pill">Property #{ex.propertyId}</span>
                    </td>
                    <td>
                      <span className="exemption-type-tag">
                        {ex.exemptionType?.replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <strong className="text-success font-bold text-base">
                        {ex.percentage}% Off
                      </strong>
                    </td>
                    <td>
                      <div className="date-time-cell">
                        <Calendar size={14} className="text-muted" />
                        <span>{ex.validFrom}</span>
                      </div>
                    </td>
                    <td>
                      <div className="date-time-cell">
                        <Calendar size={14} className="text-muted" />
                        <span>{ex.validTo}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm font-medium">Officer #{ex.approvedById}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sanction Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <Percent size={22} className="text-primary" />
                <div>
                  <h3>Sanction Tax Exemption</h3>
                  <p>Apply statutory percentage discount to a property tax ledger</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateExemption}>
              <div className="modal-body">
                {/* Inline validation error inside modal */}
                {modalError && (
                  <div className="alert-box alert-error" style={{ marginBottom: '1rem' }}>
                    <ShieldAlert size={16} />
                    <span>{modalError}</span>
                    <button type="button" onClick={() => setModalError('')} className="alert-close">×</button>
                  </div>
                )}
                <div className="form-row-2col">
                  <div className="form-group">
                    <label>Property ID</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 1"
                      value={formData.propertyId}
                      onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Exemption Category</label>
                    <select
                      value={formData.exemptionType}
                      onChange={(e) => setFormData({ ...formData, exemptionType: e.target.value })}
                    >
                      <option value="SENIOR_CITIZEN">Senior Citizen (30% rebate)</option>
                      <option value="WIDOW">Widow / Single Mother (40% rebate)</option>
                      <option value="ARMED_FORCES">Armed Forces Veteran (50% rebate)</option>
                      <option value="CHARITABLE_INSTITUTION">Charitable / Educational Trust (100% exempt)</option>
                      <option value="AGRICULTURAL">Agricultural Land Parcel (75% exempt)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Sanctioned Concession Percentage (%)</label>
                  <input
                    type="number"
                    required
                    min="5"
                    max="100"
                    value={formData.percentage}
                    onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                  />
                </div>

                <div className="form-row-2col">
                  <div className="form-group">
                    <label>Effective Date</label>
                    <input
                      type="date"
                      required
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input
                      type="date"
                      required
                      value={formData.validTo}
                      onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setModalError('') }}
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
                  {submitting ? 'Sanctioning…' : 'Enroll Exemption'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
