import React, { useState, useEffect, useMemo } from 'react'
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  Printer, 
  ShieldAlert, 
  Building2, 
  X,
  FileText,
  Send
} from 'lucide-react'
import { api, errorMessage } from '../api/client'

export default function NoticesPage({ user }) {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeNotice, setActiveNotice] = useState(null) // for print preview

  // Form
  const [formData, setFormData] = useState({
    propertyId: '',
    noticeType: 'TAX_DEMAND',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchNotices = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/api/notices')
      setNotices(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotices()
  }, [])

  const handleGenerateNotice = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const storedUser = (() => {
        try {
          return JSON.parse(localStorage.getItem('tax_user') || '{}')
        } catch {
          return {}
        }
      })()
      const resolvedUserId = user?.userId || user?.id || storedUser.userId || storedUser.id

      const payload = {
        propertyId: Number(formData.propertyId),
        issuedById: resolvedUserId ? Number(resolvedUserId) : undefined,
        noticeType: formData.noticeType,
        message: formData.message.trim()
      }

      await api.post('/api/notices/generate', payload)
      setSuccessMessage('Statutory notice served and registered in municipal dispatch log.')
      setShowCreateModal(false)
      setFormData({ propertyId: '', noticeType: 'TAX_DEMAND', message: '' })
      fetchNotices()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (noticeId, newStatus) => {
    try {
      await api.put(`/api/notices/${noticeId}/status?status=${newStatus}`)
      setSuccessMessage(`Notice #${noticeId} status updated to ${newStatus}.`)
      fetchNotices()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const canIssue = ['WARD_OFFICER', 'TAX_ASSESSOR', 'ADMIN'].includes(user?.role)

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <span className="page-pretitle">STATUTORY ENFORCEMENT</span>
          <h2 className="page-title">Municipal Demand Notices</h2>
          <p className="page-subtitle">
            Formal demand notices, property verification queries, and legal summons issued to defaulting property owners.
          </p>
        </div>

        <div className="page-actions-group">
          {canIssue && (
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              <Plus size={16} /> Issue Statutory Notice
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

      {/* Notices Table */}
      <div className="data-table-card">
        <div className="table-card-header">
          <div className="header-title-wrap">
            <AlertTriangle size={18} className="text-primary" />
            <h3>Municipal Notice Dispatch Log</h3>
          </div>
          <span className="live-tag"><span className="live-dot" /> Section 142 Register</span>
        </div>

        {loading ? (
          <div className="loading-state-card">
            <span className="spinner-icon-lg" />
            <p>Loading notices…</p>
          </div>
        ) : notices.length === 0 ? (
          <div className="empty-state-card">
            <AlertTriangle size={48} className="empty-icon" />
            <h3>No statutory notices issued</h3>
            <p>All property records are currently in compliance or no demand notices have been generated.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="civic-table">
              <thead>
                <tr>
                  <th>Notice Ref #</th>
                  <th>Property Ref</th>
                  <th>Notice Category</th>
                  <th>Notice Terms &amp; Demands</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {notices.map((n) => (
                  <tr key={n.id} className="hoverable-row">
                    <td>
                      <div className="property-id-cell">
                        <FileText size={16} className="text-primary" />
                        <strong>NTC-{n.id?.toString().padStart(5, '0')}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="ward-pill">Property #{n.propertyId}</span>
                    </td>
                    <td>
                      <span className={`notice-type-tag ${n.noticeType?.toLowerCase()}`}>
                        {n.noticeType}
                      </span>
                    </td>
                    <td>
                      <p className="notice-msg-cell">{n.message}</p>
                    </td>
                    <td>
                      <span className={`status-pill status-${n.status?.toLowerCase()}`}>
                        <span className="dot" /> {n.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="action-buttons-cell">
                        <button
                          onClick={() => setActiveNotice(n)}
                          className="btn-action-icon"
                          title="View & Print Official Notice"
                        >
                          <Printer size={15} /> Print
                        </button>

                        {canIssue && n.status === 'ISSUED' && (
                          <button
                            onClick={() => handleUpdateStatus(n.id, 'SERVED')}
                            className="btn-action-verify"
                            title="Mark as Served"
                          >
                            <CheckCircle2 size={14} /> Mark Served
                          </button>
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

      {/* Issue Notice Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <AlertTriangle size={22} className="text-warning" />
                <div>
                  <h3>Issue Statutory Municipal Notice</h3>
                  <p>Publish an enforceable demand notice under Municipal Corporation Act</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGenerateNotice}>
              <div className="modal-body">
                <div className="form-group mb-4">
                  <label>Issuing Authority / Officer</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={`${user?.name || 'Authorized Ward Officer'} (User ID: ${user?.userId || user?.id || 'Active Session'})`}
                    className="bg-muted cursor-not-allowed opacity-80"
                  />
                  <small className="text-muted text-xs block mt-1">
                    Automatically authenticated from your active Ward Officer session.
                  </small>
                </div>

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
                    <label>Notice Classification</label>
                    <select
                      value={formData.noticeType}
                      onChange={(e) => setFormData({ ...formData, noticeType: e.target.value })}
                    >
                      <option value="TAX_DEMAND">Tax Demand Notice (30 Days)</option>
                      <option value="FINAL_NOTICE">Final Warning Notice (7 Days)</option>
                      <option value="DEFECT_NOTICE">Defect / Area Discrepancy Notice</option>
                      <option value="LEGAL_SUMMONS">Revenue Tribunal Legal Summons</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Notice Directives &amp; Particulars</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Demand particulars, outstanding assessment references, compliance deadline..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
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
                  {submitting ? 'Dispatching…' : 'Issue Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Notice Modal */}
      {activeNotice && (
        <div className="modal-backdrop" onClick={() => setActiveNotice(null)}>
          <div className="modal-card modal-receipt" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-actions-top no-print">
              <button onClick={() => window.print()} className="btn btn-primary btn-sm">
                <Printer size={15} /> Print Notice
              </button>
              <button onClick={() => setActiveNotice(null)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <div className="printable-receipt-document">
              <div className="receipt-header">
                <div className="receipt-crest">
                  <Building2 size={40} />
                </div>
                <div className="receipt-authority">
                  <h2>SMART MUNICIPAL CORPORATION</h2>
                  <h4>OFFICE OF THE MUNICIPAL REVENUE COMMISSIONER</h4>
                  <p className="text-danger font-bold uppercase tracking-wider mt-1">
                    {activeNotice.noticeType?.replaceAll('_', ' ')}
                  </p>
                </div>
              </div>

              <div className="receipt-divider" />

              <div className="certificate-meta-bar">
                <span>Dispatch Ref: <strong>SMC/REV/NTC/{activeNotice.id}</strong></span>
                <span>Date of Issue: <strong>{new Date().toLocaleDateString('en-IN')}</strong></span>
              </div>

              <div className="notice-body-content mt-6">
                <p><strong>TO THE OWNER / OCCUPIER, PROPERTY REF #{activeNotice.propertyId}</strong></p>
                <p className="mt-4 text-justify">
                  WHEREAS, under the provisions of the Municipal Corporation Property Taxation Act, 
                  you are liable to discharge the assessed property tax and municipal charges due in respect 
                  of the aforementioned property parcel.
                </p>
                <div className="notice-text-box">
                  <p>{activeNotice.message}</p>
                </div>
                <p className="mt-4 text-justify">
                  TAKE NOTICE that upon failure to comply or settle the outstanding liability within the stipulated 
                  period from the service of this notice, the Corporation shall proceed with statutory recovery actions, 
                  including disconnection of civic amenities, attachment, or sealing of premises.
                </p>
              </div>

              <div className="receipt-footer-section mt-10">
                <div className="authority-seal-box">
                  <small>ISSUED BY ORDER OF</small>
                  <strong>MUNICIPAL REVENUE OFFICER</strong>
                  <span>SMART MUNICIPAL CORPORATION</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
