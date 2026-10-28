import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react'

export default function AccessDenied({ user }) {
  const navigate = useNavigate()

  return (
    <div className="access-denied-page">
      <div className="access-denied-card">
        <div className="denied-icon-wrap">
          <ShieldAlert className="denied-icon" size={48} />
        </div>
        <p className="eyebrow error-tag">HTTP 403 • Restricted Access</p>
        <h2>Access Denied</h2>
        <p className="denied-copy">
          You do not have administrative authorization or operational permissions to access this municipal module with your current assigned role.
        </p>

        <div className="denied-meta">
          <div>
            <span>Active Account</span>
            <strong>{user?.name || 'Municipal User'}</strong>
          </div>
          <div>
            <span>Current Role</span>
            <span className="role-chip">{user?.role || 'UNAUTHENTICATED'}</span>
          </div>
        </div>

        <div className="denied-actions">
          <button onClick={() => navigate(-1)} className="btn btn-outline">
            <ArrowLeft size={16} /> Go Back
          </button>
          <Link to="/dashboard" className="btn btn-primary">
            <Home size={16} /> Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
