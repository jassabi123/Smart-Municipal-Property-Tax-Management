import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { 
  Building2, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle
} from 'lucide-react'
import { api, errorMessage } from '../api/client'

export default function LoginPage({ setUser }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(searchParams.get('expired') ? 'Your previous session expired. Please sign in again.' : '')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/api/auth/login', { email, password })
      const data = response.data
      
      // Store token and user details in localStorage
      localStorage.setItem('tax_token', data.token)
      localStorage.setItem('tax_user', JSON.stringify(data))
      
      if (setUser) {
        setUser(data)
      }
      
      navigate('/dashboard')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page-container">
      {/* Background visual accents */}
      <div className="auth-mesh-bg" />

      <div className="auth-card-wrapper">
        {/* Brand header */}
        <div className="auth-brand-header">
          <Link to="/" className="brand-logo-link">
            <div className="brand-icon-box">
              <Building2 size={24} />
            </div>
            <div className="brand-name">
              <span>Civic<span>Ledger</span></span>
              <small>Smart Municipal Corporation</small>
            </div>
          </Link>
        </div>

        {/* Main Sign-In Card */}
        <div className="auth-card">
          <div className="auth-card-top">
            <span className="auth-eyebrow">SECURE MUNICIPAL ACCESS</span>
            <h2>Sign In to Workspace</h2>
            <p>Enter your municipal credentials to access the system.</p>
          </div>

          {error && (
            <div className="alert-box alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@smartmunicipal.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-with-action">
                <label htmlFor="password">Password</label>
                <Link to="/forgot-password" className="forgot-password-link">
                  Forgot Password?
                </Link>
              </div>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block btn-lg" 
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading-text">
                  <span className="spinner-icon" /> Verifying Credentials…
                </span>
              ) : (
                <>
                  Authenticate &amp; Enter <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-card-footer">
            <p>
              New Property Owner?{' '}
              <Link to="/register" className="auth-link-strong">
                Register citizen account
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home link */}
        <div className="auth-bottom-nav">
          <Link to="/" className="text-muted-link">
            ← Return to Public Portal
          </Link>
        </div>
      </div>
    </div>
  )
}
