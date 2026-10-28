import React, { useState, useEffect, useMemo } from 'react'
import { 
  MessageSquare, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldAlert, 
  Building2, 
  X,
  ArrowRight,
  User
} from 'lucide-react'
import { api, errorMessage } from '../api/client'

export default function GrievancesPage({ user }) {
  const [grievances, setGrievances] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Modals
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showResolveModal, setShowResolveModal] = useState(null) // Grievance item
  const [resolutionRemarks, setResolutionRemarks] = useState('')

  // Form
  const [formData, setFormData] = useState({
    propertyId: '',
    subject: '',
    description: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Filter
  const [selectedStatus, setSelectedStatus] = useState('ALL')

  const fetchGrievances = async () => {
    setLoading(true)
    setError('')
    try {
      if (user?.role === 'PROPERTY_OWNER') {
        const res = await api.get('/api/grievances/my')
        setGrievances(Array.isArray(res.data) ? res.data : [])
      } else {
        const res = await api.get('/api/grievances')
        setGrievances(Array.isArray(res.data) ? res.data : [])
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGrievances()
  }, [])

  // Citizen submit grievance
  const handleSubmitGrievance = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.post('/api/grievances', {
        propertyId: formData.propertyId ? Number(formData.propertyId) : null,
        subject: formData.subject.trim(),
        description: formData.description.trim()
      })
      setSuccessMessage('Grievance registered. Assigned to Municipal Commissioner Desk.')
      setShowSubmitModal(false)
      setFormData({ propertyId: '', subject: '', description: '' })
      fetchGrievances()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  // Commissioner / Admin resolve grievance
  const handleResolveGrievance = async () => {
    if (!showResolveModal) return
    setSubmitting(true)
    setError('')
    try {
      await api.put(`/api/grievances/${showResolveModal.id}/resolve?remarks=${encodeURIComponent(resolutionRemarks || 'Resolved after official inspection')}`)
      setSuccessMessage(`Grievance #${showResolveModal.id} marked as RESOLVED.`)
      setShowResolveModal(null)
      setResolutionRemarks('')
      fetchGrievances()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const filteredGrievances = useMemo(() => {
    if (selectedStatus === 'ALL') return grievances
    return grievances.filter(g => g.status === selectedStatus)
  }, [grievances, selectedStatus])

  const canResolve = ['COMMISSIONER', 'ADMIN'].includes(user?.role)

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <span className="page-pretitle">CITIZEN ENGAGEMENT &amp; REDRESSAL</span>
          <h2 className="page-title">Tax Disputes &amp; Grievances</h2>
          <p className="page-subtitle">
            Formal citizen appeals regarding assessment valuation, payment reconciliations, or property attributes.
          </p>
        </div>

        <div className="page-actions-group">
          <button onClick={() => setShowSubmitModal(true)} className="btn btn-primary">
            <Plus size={16} /> File New Grievance
          </button>
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

      {/* Filter Toolbar */}
      <div className="toolbar-container">
        <div className="filters-group">
          <div className="filter-select-wrap">
            <span className="filter-label">Filter by Status:</span>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="ALL">All Grievances</option>
              <option value="SUBMITTED">Submitted (Pending)</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grievances Table */}
      <div className="data-table-card">
        <div className="table-card-header">
          <div className="header-title-wrap">
            <MessageSquare size={18} className="text-primary" />
            <h3>Municipal Grievance Dossiers</h3>
          </div>
          <span className="live-tag"><span className="live-dot" /> Redressal Portal</span>
        </div>

        {loading ? (
          <div className="loading-state-card">
            <span className="spinner-icon-lg" />
            <p>Fetching Grievances…</p>
          </div>
        ) : filteredGrievances.length === 0 ? (
          <div className="empty-state-card">
            <MessageSquare size={48} className="empty-icon" />
            <h3>No grievances recorded</h3>
            <p>No grievances filed under the selected criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="civic-table">
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Property Ref</th>
                  <th>Filing Date</th>
                  <th>Dispute Summary</th>
                  <th>Status</th>
                  <th>Resolution Remarks</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrievances.map((g) => (
                  <tr key={g.id} className="hoverable-row">
                    <td>
                      <div className="property-id-cell">
                        <MessageSquare size={16} className="text-primary" />
                        <strong>TKT-{g.id?.toString().padStart(5, '0')}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="ward-pill">Property #{g.propertyId}</span>
                    </td>
                    <td>
                      <div className="date-time-cell">
                        <Clock size={14} className="text-muted" />
                        <span>{g.createdAt ? new Date(g.createdAt).toLocaleDateString('en-IN') : 'Recent'}</span>
                      </div>
                    </td>
                    <td>
                      <strong className="text-sm block text-navy">{g.subject || 'Municipal Grievance'}</strong>
                      <p className="grievance-desc-cell">{g.description}</p>
                    </td>
                    <td>
                      <span className={`status-pill status-${g.status?.toLowerCase()}`}>
                        <span className="dot" /> {g.status}
                      </span>
                    </td>
                    <td>
                      <span className="remarks-text">{g.resolutionRemarks || 'Pending review by Commissioner'}</span>
                    </td>
                    <td className="text-right">
                      {canResolve && g.status !== 'RESOLVED' ? (
                        <button
                          onClick={() => {
                            setShowResolveModal(g)
                            setResolutionRemarks('')
                          }}
                          className="btn-action-verify"
                          title="Resolve Grievance"
                        >
                          <CheckCircle2 size={14} /> Resolve
                        </button>
                      ) : (
                        <span className="text-muted text-xs">
                          {g.status === 'RESOLVED' ? 'Closed' : 'Under Review'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submit Grievance Modal */}
      {showSubmitModal && (
        <div className="modal-backdrop" onClick={() => setShowSubmitModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <MessageSquare size={22} className="text-primary" />
                <div>
                  <h3>File Citizen Dispute / Grievance</h3>
                  <p>Direct submission to the Municipal Commissionerate</p>
                </div>
              </div>
              <button onClick={() => setShowSubmitModal(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitGrievance}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Affected Property ID</label>
                  <input
                    type="number"
                    placeholder="e.g. 1 (optional if general query)"
                    value={formData.propertyId}
                    onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Dispute Subject / Classification</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Valuation Discrepancy or Measurement Assessment"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Dispute Description &amp; Justification</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe discrepancy in assessment valuation, covered area calculation, or uncredited payment..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
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
                  {submitting ? 'Submitting…' : 'File Grievance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Grievance Modal */}
      {showResolveModal && (
        <div className="modal-backdrop" onClick={() => setShowResolveModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <CheckCircle2 size={22} className="text-success" />
                <div>
                  <h3>Resolve Grievance #{showResolveModal.id}</h3>
                  <p>Issue executive determination and close ticket</p>
                </div>
              </div>
              <button onClick={() => setShowResolveModal(null)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="dispute-context-box">
                <span className="spec-label">Citizen Statement:</span>
                <p className="mt-1 text-sm">{showResolveModal.description}</p>
              </div>

              <div className="form-group mt-4">
                <label>Commissioner Resolution Findings</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Site inspection conducted by Ward Assessor. Assessment recalculated and penalty waived."
                  value={resolutionRemarks}
                  onChange={(e) => setResolutionRemarks(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowResolveModal(null)}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolveGrievance}
                className="btn btn-success"
                disabled={submitting}
              >
                {submitting ? 'Saving…' : 'Mark Resolved & Notify Citizen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
