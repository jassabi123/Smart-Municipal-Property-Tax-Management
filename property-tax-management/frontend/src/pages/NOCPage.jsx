import React, { useState, useEffect, useMemo } from 'react'
import { 
  FileCheck, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Printer, 
  ShieldAlert, 
  Building2, 
  X, 
  QrCode, 
  Eye,
  Filter,
  Check,
  RefreshCw,
  FileText
} from 'lucide-react'
import { api, errorMessage } from '../api/client'

export default function NOCPage({ user }) {
  const [nocRequests, setNocRequests] = useState([])
  const [myProperties, setMyProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Search and Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Modals
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [activeCertificate, setActiveCertificate] = useState(null)
  const [showActionModal, setShowActionModal] = useState(null) // { id, type: 'APPROVE' | 'REJECT', noc }
  const [showReviewModal, setShowReviewModal] = useState(null) // noc item
  const [remarks, setRemarks] = useState('')

  // Apply Form
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Fetch NOCs
  const fetchNOCs = async () => {
    setLoading(true)
    setError('')
    try {
      if (user?.role === 'PROPERTY_OWNER') {
        const [nocRes, propRes] = await Promise.all([
          api.get(`/api/noc/my/${user.userId || user.id}`),
          api.get('/api/properties')
        ])
        setNocRequests(Array.isArray(nocRes.data) ? nocRes.data : (nocRes.data ? [nocRes.data] : []))
        setMyProperties(Array.isArray(propRes.data) ? propRes.data : [])
      } else {
        // Staff/Admin - fetch all NOC requests for municipal scrutiny
        const nocRes = await api.get('/api/noc').catch(() => ({ data: [] }))
        setNocRequests(Array.isArray(nocRes.data) ? nocRes.data : (nocRes.data ? [nocRes.data] : []))
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNOCs()
  }, [])

  // Apply for NOC
  const handleApplyNOC = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.post('/api/noc/request', {
        propertyId: Number(selectedPropertyId),
        requestedById: Number(user?.userId || user?.id)
      })
      setSuccessMessage('NOC Request registered successfully and routed to Ward Officer.')
      setShowApplyModal(false)
      setSelectedPropertyId('')
      fetchNOCs()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  // Approve or Reject NOC
  const handleProcessNOC = async () => {
    if (!showActionModal) return
    setSubmitting(true)
    setError('')
    try {
      const officerId = user?.userId || user?.id || null
      const finalRemarks = (remarks || '').trim() || (showActionModal.type === 'APPROVE' ? 'All municipal tax dues verified as cleared.' : 'Outstanding property dues pending')

      if (showActionModal.type === 'APPROVE') {
        const queryParams = new URLSearchParams()
        if (officerId) queryParams.set('approvedById', String(officerId))
        queryParams.set('remarks', finalRemarks)

        await api.put(`/api/noc/${showActionModal.id}/approve?${queryParams.toString()}`, {
          id: showActionModal.id,
          officerId,
          approvedById: officerId,
          remarks: finalRemarks,
          status: 'APPROVED',
          action: 'APPROVE'
        })
        setSuccessMessage(`NOC Application #NOC-APP-${String(showActionModal.id).padStart(5, '0')} has been Approved and Issued.`)
      } else {
        const queryParams = new URLSearchParams()
        if (officerId) queryParams.set('officerId', String(officerId))
        queryParams.set('remarks', finalRemarks)

        await api.put(`/api/noc/${showActionModal.id}/reject?${queryParams.toString()}`, {
          id: showActionModal.id,
          officerId,
          remarks: finalRemarks,
          status: 'REJECTED',
          action: 'REJECT'
        })
        setSuccessMessage(`NOC Application #NOC-APP-${String(showActionModal.id).padStart(5, '0')} has been Rejected.`)
      }
      setShowActionModal(null)
      setShowReviewModal(null)
      setRemarks('')
      fetchNOCs()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const filteredNOCs = useMemo(() => {
    return nocRequests.filter(n => {
      const refStr = `NOC-APP-${String(n.id || '').padStart(5, '0')}`
      const propStr = `Property #${n.propertyId} ${n.propertyIdentifier || ''}`
      const matchesSearch =
        !searchQuery ||
        refStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        propStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.remarks?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.requestedByName?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === 'ALL' ||
        n.status === statusFilter ||
        (statusFilter === 'APPROVED' && (n.status === 'APPROVED' || n.status === 'ISSUED'))

      return matchesSearch && matchesStatus
    })
  }, [nocRequests, searchQuery, statusFilter])

  const canProcess = ['WARD_OFFICER', 'ADMIN', 'COMMISSIONER'].includes(user?.role)

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <span className="page-pretitle">STATUTORY CERTIFICATION</span>
          <h2 className="page-title">Tax Clearance No Objection Certificates (NOC)</h2>
          <p className="page-subtitle">
            Formal municipal clearance confirming that all property tax dues and statutory assessments have been satisfied.
          </p>
        </div>

        <div className="page-actions-group">
          {user?.role === 'PROPERTY_OWNER' && (
            <button onClick={() => setShowApplyModal(true)} className="btn btn-primary">
              <Plus size={16} /> Request NOC
            </button>
          )}
          <button onClick={fetchNOCs} className="btn btn-secondary" title="Refresh NOC records" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
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

      {/* Filters & Search Toolbar */}
      <div className="toolbar-container">
        <div className="search-bar-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by NOC Ref (e.g. NOC-APP-01402), property or remarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filters-group">
          <div className="filter-select-wrap">
            <span className="filter-label">Status:</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved / Issued</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* NOC Records Table */}
      <div className="data-table-card">
        <div className="table-card-header">
          <div className="header-title-wrap">
            <FileCheck size={18} className="text-primary" />
            <h3>NOC Applications &amp; Issued Certificates ({filteredNOCs.length})</h3>
          </div>
          <span className="live-tag"><span className="live-dot" /> Live Registry</span>
        </div>

        {loading ? (
          <div className="loading-state-card">
            <span className="spinner-icon-lg" />
            <p>Loading NOC Applications…</p>
          </div>
        ) : filteredNOCs.length === 0 ? (
          <div className="empty-state-card">
            <FileCheck size={48} className="empty-icon" />
            <h3>No NOC records found</h3>
            <p>
              {user?.role === 'PROPERTY_OWNER'
                ? 'You have not submitted any NOC applications yet. Click "Request NOC" to begin.'
                : 'No pending NOC applications matching your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="civic-table">
              <thead>
                <tr>
                  <th>Application Ref</th>
                  <th>Property Ref</th>
                  <th>Request Date</th>
                  <th>Status</th>
                  <th>Remarks / Clearance Note</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNOCs.map((n) => (
                  <tr key={n.id} className="hoverable-row">
                    <td>
                      <div className="property-id-cell">
                        <FileCheck size={16} className="text-primary" />
                        <strong>NOC-APP-{n.id?.toString().padStart(5, '0')}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="ward-pill">
                        Property #{n.propertyId} {n.propertyIdentifier ? `(${n.propertyIdentifier})` : ''}
                      </span>
                    </td>
                    <td>
                      <div className="date-time-cell">
                        <Clock size={14} className="text-muted" />
                        <span>{n.requestDate ? new Date(n.requestDate).toLocaleDateString('en-IN') : 'Recent'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill status-${n.status?.toLowerCase()}`}>
                        <span className="dot" /> {n.status}
                      </span>
                    </td>
                    <td>
                      <span className="remarks-text">{n.remarks || 'Under standard departmental scrutiny'}</span>
                    </td>
                    <td className="text-right">
                      <div className="action-buttons-cell">
                        {['APPROVED', 'ISSUED'].includes(n.status) ? (
                          <button
                            onClick={() => setActiveCertificate(n)}
                            className="btn-action-icon"
                            title="View official printable certificate"
                          >
                            <Printer size={15} /> View Certificate
                          </button>
                        ) : canProcess && n.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => setShowReviewModal(n)}
                              className="btn-action-icon"
                              title="Review NOC Application"
                            >
                              <Eye size={14} /> Review
                            </button>
                            <button
                              onClick={() => {
                                setRemarks('')
                                setShowActionModal({ id: n.id, type: 'APPROVE', noc: n })
                              }}
                              className="btn-action-verify"
                              title="Approve NOC"
                            >
                              <CheckCircle2 size={14} /> Approve
                            </button>
                            <button
                              onClick={() => {
                                setRemarks('')
                                setShowActionModal({ id: n.id, type: 'REJECT', noc: n })
                              }}
                              className="btn-action-danger"
                              title="Reject NOC"
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-muted text-xs">In Progress</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review NOC Modal */}
      {showReviewModal && (
        <div className="modal-backdrop" onClick={() => setShowReviewModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <FileText size={22} className="text-primary" />
                <div>
                  <h3>Review NOC Application</h3>
                  <p>Application Ref: NOC-APP-{String(showReviewModal.id).padStart(5, '0')}</p>
                </div>
              </div>
              <button onClick={() => setShowReviewModal(null)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="property-specs-grid">
                <div className="spec-item">
                  <span className="spec-label">Application ID</span>
                  <strong className="spec-value">NOC-APP-{String(showReviewModal.id).padStart(5, '0')}</strong>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Property Reference</span>
                  <strong className="spec-value">Property #{showReviewModal.propertyId}</strong>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Property Identifier</span>
                  <strong className="spec-value">{showReviewModal.propertyIdentifier || 'Registered'}</strong>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Applicant / Owner</span>
                  <strong className="spec-value">{showReviewModal.requestedByName || `User #${showReviewModal.requestedById}`}</strong>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Application Date</span>
                  <span className="spec-value">
                    {showReviewModal.requestDate ? new Date(showReviewModal.requestDate).toLocaleDateString('en-IN') : 'Recent'}
                  </span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Current Status</span>
                  <span className={`status-pill status-${showReviewModal.status?.toLowerCase()}`}>
                    <span className="dot" /> {showReviewModal.status}
                  </span>
                </div>
                <div className="spec-item col-span-2">
                  <span className="spec-label">Applicant Notes / Existing Remarks</span>
                  <p className="spec-address-text">{showReviewModal.remarks || 'No applicant remarks submitted.'}</p>
                </div>
              </div>

              <div className="alert-box alert-info mt-4">
                <p className="text-sm">
                  <strong>Departmental Scrutiny Note:</strong> Confirm all preceding and current tax assessments are marked PAID before issuing tax clearance.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              {showReviewModal.status === 'PENDING' && canProcess && (
                <>
                  <button
                    onClick={() => {
                      const n = showReviewModal
                      setShowReviewModal(null)
                      setRemarks('')
                      setShowActionModal({ id: n.id, type: 'APPROVE', noc: n })
                    }}
                    className="btn btn-success mr-auto"
                  >
                    <CheckCircle2 size={16} /> Approve NOC
                  </button>
                  <button
                    onClick={() => {
                      const n = showReviewModal
                      setShowReviewModal(null)
                      setRemarks('')
                      setShowActionModal({ id: n.id, type: 'REJECT', noc: n })
                    }}
                    className="btn btn-danger"
                  >
                    <XCircle size={16} /> Reject NOC
                  </button>
                </>
              )}
              <button onClick={() => setShowReviewModal(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action / Endorsement Modal for Ward Officer */}
      {showActionModal && (
        <div className="modal-backdrop" onClick={() => setShowActionModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <FileCheck size={22} className="text-primary" />
                <div>
                  <h3>{showActionModal.type === 'APPROVE' ? 'Approve & Issue NOC' : 'Reject NOC Request'}</h3>
                  <p>Application Ref: NOC-APP-{String(showActionModal.id).padStart(5, '0')}</p>
                </div>
              </div>
              <button onClick={() => setShowActionModal(null)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Officer Endorsement / Remarks</label>
                <textarea
                  rows={3}
                  required
                  placeholder={
                    showActionModal.type === 'APPROVE'
                      ? 'e.g. All municipal tax dues verified as cleared. NOC approved.'
                      : 'e.g. Outstanding property dues pending for FY 2024-2025.'
                  }
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowActionModal(null)}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessNOC}
                className={`btn ${showActionModal.type === 'APPROVE' ? 'btn-success' : 'btn-danger'}`}
                disabled={submitting}
              >
                {submitting
                  ? 'Updating…'
                  : showActionModal.type === 'APPROVE'
                  ? 'Confirm Approval'
                  : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply NOC Modal */}
      {showApplyModal && (
        <div className="modal-backdrop" onClick={() => setShowApplyModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <FileCheck size={22} className="text-primary" />
                <div>
                  <h3>Request Property Tax NOC</h3>
                  <p>Apply for an official Tax Clearance No Objection Certificate</p>
                </div>
              </div>
              <button onClick={() => setShowApplyModal(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleApplyNOC}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Your Property</label>
                  {myProperties.length > 0 ? (
                    <select
                      required
                      value={selectedPropertyId}
                      onChange={(e) => setSelectedPropertyId(e.target.value)}
                    >
                      <option value="">-- Choose Property --</option>
                      {myProperties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.propertyId} • {p.address} (Ward {p.wardNo})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      required
                      placeholder="Enter Property ID (e.g. 1)"
                      value={selectedPropertyId}
                      onChange={(e) => setSelectedPropertyId(e.target.value)}
                    />
                  )}
                </div>

                <div className="alert-box alert-info">
                  <p className="text-sm">
                    <strong>Prerequisite Notice:</strong> NOC will only be sanctioned if all assessments 
                    for the current and preceding financial years are fully cleared (Status: PAID).
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !selectedPropertyId}
                >
                  {submitting ? 'Submitting…' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable NOC Certificate Modal */}
      {activeCertificate && (
        <div className="modal-backdrop" onClick={() => setActiveCertificate(null)}>
          <div className="modal-card modal-receipt" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-actions-top no-print">
              <button onClick={() => window.print()} className="btn btn-primary btn-sm">
                <Printer size={15} /> Print Certificate
              </button>
              <button onClick={() => setActiveCertificate(null)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            {/* PRINTABLE CERTIFICATE DOCUMENT */}
            <div className="printable-receipt-document certificate-document">
              <div className="certificate-border">
                <div className="receipt-header">
                  <div className="receipt-crest">
                    <Building2 size={42} />
                  </div>
                  <div className="receipt-authority">
                    <h2>SMART MUNICIPAL CORPORATION</h2>
                    <h4>DEPARTMENT OF REVENUE &amp; TOWN PLANNING</h4>
                    <p className="certificate-subtitle">NO OBJECTION CERTIFICATE (NOC)</p>
                  </div>
                </div>

                <div className="receipt-divider" />

                <div className="certificate-meta-bar">
                  <span>Certificate Ref: <strong>SMC/NOC/{new Date().getFullYear()}/{activeCertificate.id}</strong></span>
                  <span>Issue Date: <strong>{new Date().toLocaleDateString('en-IN')}</strong></span>
                </div>

                <div className="certificate-body-text">
                  <p>
                    This is to officially certify that the property recorded in the municipal GIS register under:
                  </p>
                  <div className="cert-property-box">
                    <strong>Property ID Reference: #{activeCertificate.propertyId} {activeCertificate.propertyIdentifier ? `(${activeCertificate.propertyIdentifier})` : ''}</strong>
                    <span>Registered in Corporation Ward Registry</span>
                  </div>
                  <p>
                    has cleared all assessed municipal property taxes, solid waste management fees, 
                    and statutory levies up to the financial year <strong>{new Date().getFullYear()}-{new Date().getFullYear() + 1}</strong>.
                  </p>
                  <p>
                    Accordingly, the Smart Municipal Corporation has <strong>NO OBJECTION</strong> to the issuance 
                    of building sanction, title conveyance, mutation, or utility connection with respect to this property.
                  </p>
                </div>

                <div className="receipt-footer-section mt-8">
                  <div className="receipt-qr-stamp">
                    <QrCode size={75} />
                    <small>Scan to Verify Authenticity</small>
                  </div>

                  <div className="receipt-sign-stamp">
                    <div className="digital-seal-box">
                      <span>MUNICIPAL CORPORATION SEAL</span>
                      <strong>WARD REVENUE OFFICER</strong>
                      <small>REVENUE &amp; ASSESSMENT WING</small>
                    </div>
                  </div>
                </div>

                <div className="receipt-notice-note">
                  <p>* Valid for 12 months from the date of issue. Subject to municipal bylaws.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
