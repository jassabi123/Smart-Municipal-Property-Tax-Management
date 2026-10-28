import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react'
import { api, errorMessage } from '../api/client'

export default function RegisterPage({ setUser }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'PROPERTY_OWNER'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Validation checks for password complexity
  const passwordCriteria = [
    { label: 'At least 8 characters', met: formData.password.length >= 8 },
    { label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(formData.password) },
    { label: 'One lowercase letter (a-z)', met: /[a-z]/.test(formData.password) },
    { label: 'One digit (0-9)', met: /\d/.test(formData.password) },
    { label: 'One special character (@$!%*?&)', met: /[@$!%*?&#^_-]/.test(formData.password) }
  ]

  const isPasswordValid = passwordCriteria.every(c => c.met)
  const passwordsMatch = formData.password && formData.password === formData.confirmPassword

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate phone number
    if (!/^\d{10}$/.test(formData.phoneNumber)) {
      setError('Please enter a valid 10-digit Indian mobile number.')
      return
    }

    if (!isPasswordValid) {
      setError('Password does not satisfy municipal security complexity requirements.')
      return
    }

    if (!passwordsMatch) {
      setError('Password and Confirm Password do not match.')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/api/auth/register', {
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: 'PROPERTY_OWNER'
      })

      const data = response.data
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
      <div className="auth-mesh-bg" />

      <div className="auth-card-wrapper auth-card-wide">
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

        <div className="auth-card">
          <div className="auth-card-top">
            <span className="auth-eyebrow">CITIZEN ENROLLMENT</span>
            <h2>Create Property Owner Account</h2>
            <p>Register to manage assessments, pay property tax online, and track NOC requests.</p>
          </div>

          {error && (
            <div className="alert-box alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row-2col">
              <div className="form-group">
                <label htmlFor="name">Full Legal Name</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">10-Digit Mobile Number</label>
                <div className="input-with-icon">
                  <Phone size={18} className="input-icon" />
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="ramesh.kumar@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            {/* Password security checklist */}
            {formData.password && (
              <div className="password-checklist-box">
                <span className="checklist-title">Password Security Requirements:</span>
                <div className="checklist-grid">
                  {passwordCriteria.map((c, i) => (
                    <div key={i} className={`checklist-item ${c.met ? 'valid' : 'invalid'}`}>
                      <span className="check-dot">{c.met ? '✓' : '•'}</span>
                      <span>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="role-disclosure-box">
              <ShieldCheck size={18} className="disclosure-icon" />
              <p>
                Self-registration automatically provisions a <strong>PROPERTY_OWNER</strong> role. 
                Municipal official accounts (Ward Officer, Assessor, Finance, Commissioner) 
                are provisioned by the Corporation Administrator.
              </p>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block btn-lg" 
              disabled={loading}
            >
              {loading ? 'Creating Account…' : (
                <>
                  Register Citizen Account <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-card-footer">
            <p>
              Already registered with the corporation?{' '}
              <Link to="/login" className="auth-link-strong">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        <div className="auth-bottom-nav">
          <Link to="/" className="text-muted-link">
            ← Return to Public Portal
          </Link>
        </div>
      </div>
    </div>
  )
}
