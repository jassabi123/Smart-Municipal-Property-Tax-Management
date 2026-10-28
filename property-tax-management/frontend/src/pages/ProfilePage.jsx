import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  KeyRound, 
  CheckCircle2, 
  ShieldAlert, 
  Building2, 
  Edit3, 
  X,
  Calendar,
  Lock
} from 'lucide-react'
import { api, errorMessage } from '../api/client'
import { ROLE_CONFIGS } from '../config/roles'

export default function ProfilePage({ user, setUser }) {
  const [profile, setProfile] = useState(user || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phoneNumber: user?.phoneNumber || ''
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchProfile = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/api/users/profile')
      if (res.data) {
        setProfile(res.data)
        setFormData({
          name: res.data.name || '',
          phoneNumber: res.data.phoneNumber || ''
        })
        if (setUser) {
          setUser(res.data)
          localStorage.setItem('tax_user', JSON.stringify(res.data))
        }
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await api.put('/api/users/profile', {
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim()
      })
      setSuccessMessage('Profile credentials updated successfully.')
      setShowEditModal(false)
      fetchProfile()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const roleConfig = ROLE_CONFIGS[profile?.role] || {}

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <span className="page-pretitle">ACCOUNT CREDENTIALS</span>
          <h2 className="page-title">User Account &amp; Security Profile</h2>
          <p className="page-subtitle">
            Manage your personal contact details, review role authorizations, and audit login access.
          </p>
        </div>

        <div className="page-actions-group">
          <button onClick={() => setShowEditModal(true)} className="btn btn-outline">
            <Edit3 size={16} /> Edit Profile
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

      <div className="profile-layout-grid">
        {/* Profile Card */}
        <div className="profile-summary-card">
          <div className="profile-avatar-large">
            {(profile?.name || 'User').slice(0, 1).toUpperCase()}
          </div>

          <h3 className="profile-name-text">{profile?.name}</h3>
          <span className={`role-badge role-${profile?.role?.toLowerCase()}`}>
            {profile?.role?.replaceAll('_', ' ')}
          </span>

          <div className="profile-details-list mt-6">
            <div className="profile-detail-item">
              <div className="detail-icon"><Mail size={16} /></div>
              <div>
                <span className="detail-label">Email Address</span>
                <strong>{profile?.email}</strong>
              </div>
            </div>

            <div className="profile-detail-item">
              <div className="detail-icon"><Phone size={16} /></div>
              <div>
                <span className="detail-label">Mobile Number</span>
                <strong>{profile?.phoneNumber || 'Not Provided'}</strong>
              </div>
            </div>

            <div className="profile-detail-item">
              <div className="detail-icon"><Calendar size={16} /></div>
              <div>
                <span className="detail-label">Account Created</span>
                <strong>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN') : 'Registered'}</strong>
              </div>
            </div>

            <div className="profile-detail-item">
              <div className="detail-icon"><ShieldCheck size={16} /></div>
              <div>
                <span className="detail-label">Ledger State</span>
                <span className="status-pill status-active"><span className="dot" /> ACTIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security and Role Privileges Card */}
        <div className="profile-security-card">
          <div className="security-card-header">
            <ShieldCheck size={20} className="text-primary" />
            <div>
              <h3>Role Privileges &amp; Workspace Access</h3>
              <p>Capabilities granted to your assigned role ({profile?.role})</p>
            </div>
          </div>

          <div className="privileges-list-grid mt-4">
            {roleConfig.actions && Object.entries(roleConfig.actions).map(([key, enabled]) => (
              <div key={key} className="privilege-item">
                <CheckCircle2 size={16} className="text-success" />
                <span>{key.replace(/^can/, '').replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
            ))}
          </div>

          <div className="security-card-divider" />

          <div className="security-actions-box">
            <div className="security-action-text">
              <KeyRound size={18} className="text-warning" />
              <div>
                <strong>Password &amp; Authentication</strong>
                <p>Change or recover your account password through our secure 4-step OTP system.</p>
              </div>
            </div>

            <Link to="/forgot-password" className="btn btn-outline btn-sm">
              <Lock size={14} /> Reset Password
            </Link>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <Edit3 size={22} className="text-primary" />
                <div>
                  <h3>Update Contact Profile</h3>
                  <p>Modify legal name and primary phone number</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>10-Digit Mobile Number</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Email Address (Immutable)</label>
                  <input
                    type="email"
                    disabled
                    readOnly
                    value={profile?.email || ''}
                    className="input-disabled"
                  />
                  <small className="text-muted text-xs">Email is tied to your cryptographic ledger identifier.</small>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
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
                  {submitting ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
