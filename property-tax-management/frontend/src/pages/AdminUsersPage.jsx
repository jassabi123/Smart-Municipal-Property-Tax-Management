import React, { useState, useEffect, useMemo } from 'react'
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  UserX, 
  KeyRound, 
  Edit2, 
  X,
  Phone,
  Mail,
  Lock
} from 'lucide-react'
import { api, errorMessage } from '../api/client'

const ROLES_LIST = [
  'PROPERTY_OWNER',
  'WARD_OFFICER',
  'TAX_ASSESSOR',
  'FINANCE_OFFICER',
  'COMMISSIONER',
  'ADMIN'
]

export default function AdminUsersPage({ user }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState('ALL')

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [roleModalUser, setRoleModalUser] = useState(null) // User object for role update
  const [targetRole, setTargetRole] = useState('PROPERTY_OWNER')

  // Create Form State
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    password: '',
    role: 'WARD_OFFICER'
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/api/users')
      setUsers(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Create user
  const handleCreateUser = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.post('/api/users', {
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role
      })
      setSuccessMessage(`Municipal account for "${formData.name}" created successfully.`)
      setShowCreateModal(false)
      setFormData({ name: '', phoneNumber: '', email: '', password: '', role: 'WARD_OFFICER' })
      fetchUsers()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle user activation
  const handleToggleActive = async (targetUser) => {
    const isActivating = !targetUser.isActive
    try {
      const endpoint = isActivating 
        ? `/api/users/${targetUser.id}/activate` 
        : `/api/users/${targetUser.id}/deactivate`
      await api.put(endpoint)
      setSuccessMessage(`Account #${targetUser.id} (${targetUser.name}) ${isActivating ? 'activated' : 'suspended'}.`)
      fetchUsers()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  // Change Role
  const handleChangeRole = async () => {
    if (!roleModalUser) return
    setSubmitting(true)
    try {
      await api.put(`/api/users/${roleModalUser.id}/role?role=${targetRole}`)
      setSuccessMessage(`Role for ${roleModalUser.name} updated to ${targetRole}.`)
      setRoleModalUser(null)
      fetchUsers()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        !searchQuery ||
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phoneNumber?.includes(searchQuery)
      
      const matchesRole = selectedRole === 'ALL' || u.role === selectedRole
      return matchesSearch && matchesRole
    })
  }, [users, searchQuery, selectedRole])

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <span className="page-pretitle">IDENTITY &amp; ACCESS GOVERNANCE</span>
          <h2 className="page-title">User Account Administration</h2>
          <p className="page-subtitle">
            Manage official municipal staff accounts, citizen profiles, role elevations, and security suspensions.
          </p>
        </div>

        <div className="page-actions-group">
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <UserPlus size={16} /> Provision User Account
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
        <div className="search-bar-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search users by name, email, or mobile number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filters-group">
          <div className="filter-select-wrap">
            <span className="filter-label">Filter by Role:</span>
            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
              <option value="ALL">All Roles</option>
              {ROLES_LIST.map(r => (
                <option key={r} value={r}>{r.replaceAll('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="data-table-card">
        <div className="table-card-header">
          <div className="header-title-wrap">
            <Users size={18} className="text-primary" />
            <h3>Municipal Personnel Directory</h3>
          </div>
          <span className="live-tag"><span className="live-dot" /> RBAC 2.0 Enforced</span>
        </div>

        {loading ? (
          <div className="loading-state-card">
            <span className="spinner-icon-lg" />
            <p>Loading Accounts…</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state-card">
            <Users size={48} className="empty-icon" />
            <h3>No users found</h3>
            <p>No account matches your search query or filter selection.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="civic-table">
              <thead>
                <tr>
                  <th>User #</th>
                  <th>Legal Name &amp; Contact</th>
                  <th>Assigned Role</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th className="text-right">Administration</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hoverable-row">
                    <td>
                      <span className="font-mono text-muted">#{u.id}</span>
                    </td>
                    <td>
                      <div className="user-profile-cell">
                        <strong>{u.name}</strong>
                        <div className="contact-details-sub">
                          <span>{u.email}</span>
                          <span className="dot-sep">•</span>
                          <span>{u.phoneNumber}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge role-${u.role?.toLowerCase()}`}>
                        {u.role?.replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${u.isActive ? 'status-active' : 'status-inactive'}`}>
                        <span className="dot" /> {u.isActive ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-muted">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : 'Enrolled'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="action-buttons-cell">
                        <button
                          onClick={() => {
                            setRoleModalUser(u)
                            setTargetRole(u.role)
                          }}
                          className="btn-action-icon"
                          title="Change Assigned Role"
                        >
                          <Edit2 size={14} /> Role
                        </button>

                        <button
                          onClick={() => handleToggleActive(u)}
                          className={u.isActive ? 'btn-action-danger' : 'btn-action-verify'}
                          title={u.isActive ? 'Suspend account' : 'Reactivate account'}
                        >
                          {u.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provision User Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <UserPlus size={22} className="text-primary" />
                <div>
                  <h3>Provision Municipal Account</h3>
                  <p>Issue authenticated role credentials for municipal operations</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                <div className="form-row-2col">
                  <div className="form-group">
                    <label>Full Legal Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suresh Patel"
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
                      placeholder="9876543210"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2col">
                  <div className="form-group">
                    <label>Official Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="suresh.patel@smartmunicipal.gov.in"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Role Assignment</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      {ROLES_LIST.map(r => (
                        <option key={r} value={r}>{r.replaceAll('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Initial Secure Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Min 8 chars, 1 uppercase, 1 digit, 1 special char"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                  {submitting ? 'Provisioning…' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {roleModalUser && (
        <div className="modal-backdrop" onClick={() => setRoleModalUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <ShieldCheck size={22} className="text-primary" />
                <div>
                  <h3>Change Role: {roleModalUser.name}</h3>
                  <p>Reassign RBAC privileges for Account #{roleModalUser.id}</p>
                </div>
              </div>
              <button onClick={() => setRoleModalUser(null)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Select Target Role</label>
                <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
                  {ROLES_LIST.map(r => (
                    <option key={r} value={r}>{r.replaceAll('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div className="alert-box alert-info">
                <p className="text-xs">
                  Changing the assigned role modifies the user’s accessible workspace modules, 
                  sidebar items, and administrative action authorizations.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleChangeRole}
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Saving…' : 'Update Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
