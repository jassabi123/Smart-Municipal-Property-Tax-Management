import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  MapPin, 
  Maximize2, 
  FileText, 
  X,
  CreditCard,
  Calculator,
  Eye,
  Trash2,
  ChevronDown
} from 'lucide-react'
import { api, errorMessage } from '../api/client'

export default function PropertiesPage({ user }) {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  // Filters and Search
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWard, setSelectedWard] = useState('ALL')
  const [selectedType, setSelectedType] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [propertyAssessments, setPropertyAssessments] = useState([])
  const [loadingAssessments, setLoadingAssessments] = useState(false)

  // New Property Form State
  const [formData, setFormData] = useState({
    propertyId: '',
    ownerId: user?.userId || '',
    address: '',
    wardNo: '1',
    areaSqft: '',
    constructionType: 'RESIDENTIAL'
  })
  const [submitting, setSubmitting] = useState(false)

  // Generate suggested Property ID
  const generatePropertyId = (ward) => {
    const randomHex = Math.floor(1000 + Math.random() * 9000)
    const wardPadded = String(ward).padStart(2, '0')
    return `PROP-W${wardPadded}-${randomHex}`
  }

  // Load properties
  const fetchProperties = async () => {
    setLoading(true)
    setError('')
    try {
      // Backend automatically filters to user's properties if PROPERTY_OWNER
      const res = await api.get('/api/properties')
      setProperties(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProperties()
  }, [])

  // Open Property Details modal & fetch assessments
  const handleViewDetails = async (property) => {
    setSelectedProperty(property)
    setLoadingAssessments(true)
    setPropertyAssessments([])
    try {
      const res = await api.get(`/api/properties/${property.id}/assessment`)
      setPropertyAssessments(Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []))
    } catch {
      // No assessments or not yet assessed
    } finally {
      setLoadingAssessments(false)
    }
  }

  // Ward Officer / Admin Property Verification
  const handleVerifyProperty = async (propertyId) => {
    try {
      await api.put(`/api/properties/${propertyId}/verify`)
      setSuccessMessage(`Property #${propertyId} verified and activated successfully.`)
      fetchProperties()
      if (selectedProperty && selectedProperty.id === propertyId) {
        setSelectedProperty(prev => ({ ...prev, status: 'ACTIVE' }))
      }
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  // Open Add Modal with generated ID
  const handleOpenAddModal = () => {
    setFormData({
      propertyId: generatePropertyId('1'),
      ownerId: user?.userId || '1',
      address: '',
      wardNo: '1',
      areaSqft: '',
      constructionType: 'RESIDENTIAL'
    })
    setShowAddModal(true)
  }

  // Submit New Property
  const handleCreateProperty = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.post('/api/properties', {
        propertyId: formData.propertyId.trim(),
        ownerId: Number(formData.ownerId),
        address: formData.address.trim(),
        wardNo: Number(formData.wardNo),
        areaSqft: Number(formData.areaSqft),
        constructionType: formData.constructionType
      })
      setSuccessMessage('Property registered successfully and cataloged in municipal registry.')
      setShowAddModal(false)
      fetchProperties()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  // Filtered Properties list
  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      const matchesSearch = 
        !searchQuery ||
        p.propertyId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesWard = selectedWard === 'ALL' || String(p.wardNo) === String(selectedWard)
      const matchesType = selectedType === 'ALL' || p.constructionType === selectedType
      const matchesStatus = 
        selectedStatus === 'ALL' || 
        p.status === selectedStatus || 
        (selectedStatus === 'PENDING_VERIFICATION' && (p.status === 'PENDING_VERIFICATION' || p.status === 'PENDING'))

      return matchesSearch && matchesWard && matchesType && matchesStatus
    })
  }, [properties, searchQuery, selectedWard, selectedType, selectedStatus])

  const canVerify = ['WARD_OFFICER', 'ADMIN'].includes(user?.role)
  const canAdd = ['PROPERTY_OWNER', 'ADMIN', 'WARD_OFFICER'].includes(user?.role)

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <span className="page-pretitle">CIVIC ASSET REGISTRY</span>
          <h2 className="page-title">Properties &amp; Real Estate Catalog</h2>
          <p className="page-subtitle">
            {user?.role === 'PROPERTY_OWNER' 
              ? 'Catalog of verified properties and land parcels registered under your account.' 
              : 'Municipal land database, GIS ward assignments, and structural assessment parameters.'}
          </p>
        </div>

        <div className="page-actions-group">
          {canAdd && (
            <button onClick={handleOpenAddModal} className="btn btn-primary">
              <Plus size={16} /> Register Property
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

      {/* Filters & Search Toolbar */}
      <div className="toolbar-container">
        <div className="search-bar-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Property ID (e.g. PROP-W01-...) or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filters-group">
          {/* Ward filter */}
          <div className="filter-select-wrap">
            <span className="filter-label">Ward:</span>
            <select value={selectedWard} onChange={(e) => setSelectedWard(e.target.value)}>
              <option value="ALL">All Wards (1-20)</option>
              {Array.from({ length: 20 }, (_, i) => i + 1).map(w => (
                <option key={w} value={w}>Ward {w}</option>
              ))}
            </select>
          </div>

          {/* Construction Type filter */}
          <div className="filter-select-wrap">
            <span className="filter-label">Type:</span>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
              <option value="ALL">All Types</option>
              <option value="RESIDENTIAL">Residential</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="INDUSTRIAL">Industrial</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="filter-select-wrap">
            <span className="filter-label">Status:</span>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active (Verified)</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="DISPUTED">Disputed</option>
              <option value="EXEMPTED">Exempted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Properties Grid/Table */}
      {loading ? (
        <div className="loading-state-card">
          <span className="spinner-icon-lg" />
          <p>Querying Municipal Property Ledger…</p>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="empty-state-card">
          <Building2 size={48} className="empty-icon" />
          <h3>No properties match your filter criteria</h3>
          <p>Try resetting filters or click &apos;Register Property&apos; to submit a new parcel.</p>
        </div>
      ) : (
        <div className="data-table-card">
          <div className="table-responsive">
            <table className="civic-table">
              <thead>
                <tr>
                  <th>Property ID</th>
                  <th>Location &amp; Address</th>
                  <th>Ward</th>
                  <th>Area (sq ft)</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.map((p) => (
                  <tr key={p.id} className="hoverable-row">
                    <td>
                      <div className="property-id-cell">
                        <Building2 size={16} className="text-primary" />
                        <strong>{p.propertyId}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="address-cell" title={p.address}>
                        <MapPin size={14} className="text-muted" />
                        <span>{p.address}</span>
                      </div>
                    </td>
                    <td>
                      <span className="ward-pill">Ward {p.wardNo}</span>
                    </td>
                    <td>
                      <strong>{Number(p.areaSqft || 0).toLocaleString()}</strong> sq ft
                    </td>
                    <td>
                      <span className={`type-tag type-${p.constructionType?.toLowerCase()}`}>
                        {p.constructionType}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill status-${p.status?.toLowerCase()}`}>
                        <span className="dot" />
                        {p.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="action-buttons-cell">
                        <button
                          onClick={() => handleViewDetails(p)}
                          className="btn-action-icon"
                          title="View property details & assessments"
                        >
                          <Eye size={15} /> Details
                        </button>

                        {canVerify && (p.status === 'PENDING' || p.status === 'PENDING_VERIFICATION') && (
                          <button
                            onClick={() => handleVerifyProperty(p.id)}
                            className="btn-action-verify"
                            title="Verify and Activate Property"
                          >
                            <CheckCircle2 size={15} /> Verify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer-info">
            <span>Showing {filteredProperties.length} of {properties.length} recorded properties</span>
            <span className="ledger-sync-tag"><span className="live-dot" /> Database Synchronized</span>
          </div>
        </div>
      )}

      {/* Property Details Modal */}
      {selectedProperty && (
        <div className="modal-backdrop" onClick={() => setSelectedProperty(null)}>
          <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <Building2 size={22} className="text-primary" />
                <div>
                  <h3>Property Details: {selectedProperty.propertyId}</h3>
                  <p>Municipal Registry Record #{selectedProperty.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedProperty(null)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="property-specs-grid">
                <div className="spec-item">
                  <span className="spec-label">Municipal Ward</span>
                  <strong className="spec-value">Ward No. {selectedProperty.wardNo}</strong>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Covered Area</span>
                  <strong className="spec-value">{Number(selectedProperty.areaSqft).toLocaleString()} sq. ft.</strong>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Construction Category</span>
                  <strong className="spec-value">{selectedProperty.constructionType}</strong>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Verification Status</span>
                  <span className={`status-pill status-${selectedProperty.status?.toLowerCase()}`}>
                    <span className="dot" /> {selectedProperty.status}
                  </span>
                </div>
                <div className="spec-item col-span-2">
                  <span className="spec-label">Site Address</span>
                  <p className="spec-address-text">{selectedProperty.address}</p>
                </div>
              </div>

              {/* Linked Tax Assessments section */}
              <div className="modal-sub-section">
                <div className="sub-section-header">
                  <FileText size={18} />
                  <h4>Linked Tax Assessments ({propertyAssessments.length})</h4>
                </div>

                {loadingAssessments ? (
                  <div className="loading-state-card py-4">
                    <span className="spinner-icon" />
                    <span>Loading tax assessments…</span>
                  </div>
                ) : propertyAssessments.length === 0 ? (
                  <div className="empty-sub-card">
                    <p>No tax assessments generated yet for this property.</p>
                  </div>
                ) : (
                  <table className="civic-table table-compact">
                    <thead>
                      <tr>
                        <th>Assessment ID</th>
                        <th>Financial Year</th>
                        <th>Base Tax</th>
                        <th>Penalty</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {propertyAssessments.map(a => (
                        <tr key={a.id}>
                          <td>#{a.id}</td>
                          <td><strong>{a.financialYear}</strong></td>
                          <td>₹{Number(a.taxAmount).toLocaleString('en-IN')}</td>
                          <td>₹{Number(a.penalty || 0).toLocaleString('en-IN')}</td>
                          <td>
                            <span className={`status-pill status-${a.status?.toLowerCase()}`}>
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="modal-footer">
              {canVerify && (selectedProperty.status === 'PENDING' || selectedProperty.status === 'PENDING_VERIFICATION') && (
                <button
                  onClick={() => handleVerifyProperty(selectedProperty.id)}
                  className="btn btn-success mr-auto"
                >
                  <CheckCircle2 size={16} /> Verify &amp; Activate Property
                </button>
              )}
              <button onClick={() => setSelectedProperty(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Property Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <Building2 size={22} className="text-primary" />
                <div>
                  <h3>Register New Property</h3>
                  <p>Submit property attributes to the municipal GIS ledger</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProperty}>
              <div className="modal-body">
                <div className="form-group">
                  <div className="label-with-action">
                    <label>Property Identification Code (PID)</label>
                    <button
                      type="button"
                      className="text-btn-sm"
                      onClick={() => setFormData(p => ({ ...p, propertyId: generatePropertyId(p.wardNo) }))}
                    >
                      Regenerate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.propertyId}
                    onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                    placeholder="PROP-W01-1001"
                  />
                </div>

                <div className="form-row-2col">
                  <div className="form-group">
                    <label>Ward Number (1-20)</label>
                    <select
                      value={formData.wardNo}
                      onChange={(e) => {
                        const newWard = e.target.value
                        setFormData({
                          ...formData,
                          wardNo: newWard,
                          propertyId: generatePropertyId(newWard)
                        })
                      }}
                    >
                      {Array.from({ length: 20 }, (_, i) => i + 1).map(w => (
                        <option key={w} value={w}>Ward {w}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Construction Category</label>
                    <select
                      value={formData.constructionType}
                      onChange={(e) => setFormData({ ...formData, constructionType: e.target.value })}
                    >
                      <option value="RESIDENTIAL">Residential</option>
                      <option value="COMMERCIAL">Commercial</option>
                      <option value="INDUSTRIAL">Industrial</option>
                    </select>
                  </div>
                </div>

                <div className="form-row-2col">
                  <div className="form-group">
                    <label>Built-Up Area (sq. ft.)</label>
                    <input
                      type="number"
                      required
                      min="50"
                      max="1000000"
                      placeholder="e.g. 1450"
                      value={formData.areaSqft}
                      onChange={(e) => setFormData({ ...formData, areaSqft: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Owner ID</label>
                    <input
                      type="number"
                      required
                      readOnly={user?.role === 'PROPERTY_OWNER'}
                      value={formData.ownerId}
                      onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Full Site / Postal Address</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Plot No., Street, Locality, Landmark, PIN Code"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                  {submitting ? 'Registering…' : 'Submit Property Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
