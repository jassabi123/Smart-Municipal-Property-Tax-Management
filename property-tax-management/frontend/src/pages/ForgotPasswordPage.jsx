import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Building2, 
  Mail, 
  KeyRound, 
  Lock, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Clock,
  RotateCcw
} from 'lucide-react'
import { api, errorMessage } from '../api/client'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  
  // Step 1: Email, Step 2: OTP, Step 3: New Password, Step 4: Success
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [timerSeconds, setTimerSeconds] = useState(900) // 15 mins
  const [resendCooldown, setResendCooldown] = useState(0)

  // Timer countdown for OTP
  useEffect(() => {
    let interval = null
    if (step === 2 && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [step, timerSeconds])

  // Cooldown countdown for resend OTP
  useEffect(() => {
    let interval = null
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendCooldown])

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Step 1: Submit email to request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setStatusMessage('')

    try {
      const response = await api.post('/api/auth/forgot-password', { email: email.trim() })
      setStatusMessage(response.data?.message || 'Verification OTP dispatched to your registered email.')
      setStep(2)
      setTimerSeconds(900)
      setResendCooldown(60)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) {
      setError('Please enter the full 6-digit numeric OTP.')
      return
    }

    setLoading(true)
    setError('')
    setStatusMessage('')

    try {
      const response = await api.post('/api/auth/verify-reset-otp', {
        email: email.trim(),
        otp: otp.trim()
      })
      setStatusMessage(response.data?.message || 'OTP successfully verified.')
      setStep(3)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/api/auth/forgot-password', { email: email.trim() })
      setStatusMessage(response.data?.message || 'New OTP sent.')
      setTimerSeconds(900)
      setResendCooldown(60)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New Password and Confirm Password do not match.')
      return
    }

    setLoading(true)
    setError('')
    setStatusMessage('')

    try {
      const response = await api.post('/api/auth/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        newPassword: newPassword
      })
      setStatusMessage(response.data?.message || 'Your password has been successfully reset.')
      setStep(4)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page-container">
      <div className="auth-mesh-bg" />

      <div className="auth-card-wrapper">
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
          {/* Progress Indicator */}
          <div className="wizard-progress-bar">
            <div className={`step-dot ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>1</div>
            <div className={`step-line ${step >= 2 ? 'active' : ''}`} />
            <div className={`step-dot ${step >= 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}`}>2</div>
            <div className={`step-line ${step >= 3 ? 'active' : ''}`} />
            <div className={`step-dot ${step >= 3 ? 'active' : ''} ${step > 3 ? 'done' : ''}`}>3</div>
            <div className={`step-line ${step >= 4 ? 'active' : ''}`} />
            <div className={`step-dot ${step >= 4 ? 'active' : ''}`}>✓</div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="alert-box alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {statusMessage && (
            <div className="alert-box alert-info">
              <Info size={18} />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <div>
              <div className="auth-card-top">
                <span className="auth-eyebrow">STEP 1 OF 3 • ACCOUNT VERIFICATION</span>
                <h2>Recover Password</h2>
                <p>Provide your registered municipal email address to receive a secure 6-digit OTP code.</p>
              </div>

              <form onSubmit={handleRequestOtp} className="auth-form">
                <div className="form-group">
                  <label htmlFor="reset-email">Registered Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={18} className="input-icon" />
                    <input
                      id="reset-email"
                      type="email"
                      required
                      placeholder="e.g. owner@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="dev-mode-notice">
                  <Info size={16} />
                  <span>
                    <strong>Developer / Local Mode Note:</strong> If external SMTP is not active, 
                    the 6-digit OTP is automatically printed to your backend server terminal output.
                  </span>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-block btn-lg" 
                  disabled={loading}
                >
                  {loading ? 'Sending OTP…' : (
                    <>
                      Send 6-Digit OTP <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: Enter OTP */}
          {step === 2 && (
            <div>
              <div className="auth-card-top">
                <span className="auth-eyebrow">STEP 2 OF 3 • IDENTITY VALIDATION</span>
                <h2>Enter 6-Digit OTP</h2>
                <p>We dispatched a single-use code to <strong>{email}</strong>.</p>
              </div>

              <form onSubmit={handleVerifyOtp} className="auth-form">
                <div className="form-group">
                  <label htmlFor="otp-input">Verification Code (6 Digits)</label>
                  <div className="input-with-icon">
                    <KeyRound size={18} className="input-icon" />
                    <input
                      id="otp-input"
                      type="text"
                      required
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="otp-input-field"
                      autoComplete="one-time-code"
                    />
                  </div>
                </div>

                <div className="timer-resend-row">
                  <div className="otp-timer">
                    <Clock size={16} />
                    <span>Expires in: <strong>{formatTimer(timerSeconds)}</strong></span>
                  </div>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className="btn-resend-otp"
                  >
                    <RotateCcw size={14} />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>

                <div className="form-action-row">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(''); }}
                    className="btn btn-secondary"
                  >
                    <ArrowLeft size={16} /> Change Email
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? 'Verifying…' : (
                      <>
                        Verify OTP <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: Enter New Password */}
          {step === 3 && (
            <div>
              <div className="auth-card-top">
                <span className="auth-eyebrow">STEP 3 OF 3 • CREDENTIAL UPDATE</span>
                <h2>Set New Password</h2>
                <p>Define a new strong password for your municipal account.</p>
              </div>

              <form onSubmit={handleResetPassword} className="auth-form">
                <div className="form-group">
                  <label htmlFor="new-password">New Password</label>
                  <div className="input-with-icon">
                    <Lock size={18} className="input-icon" />
                    <input
                      id="new-password"
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirm-new-password">Confirm New Password</label>
                  <div className="input-with-icon">
                    <Lock size={18} className="input-icon" />
                    <input
                      id="confirm-new-password"
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-block btn-lg" 
                  disabled={loading}
                >
                  {loading ? 'Updating Password…' : (
                    <>
                      Save &amp; Activate Password <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 4: Success Screen */}
          {step === 4 && (
            <div className="password-reset-success">
              <div className="success-icon-wrap">
                <CheckCircle2 size={54} className="text-success" />
              </div>
              <h3>Password Reset Successfully</h3>
              <p>
                Your municipal security credentials have been updated in the database. 
                You can now log in using your newly defined password.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="btn btn-primary btn-block btn-lg"
              >
                Proceed to Sign In <ArrowRight size={18} />
              </button>
            </div>
          )}

          <div className="auth-card-footer">
            <p>
              Remembered your password?{' '}
              <Link to="/login" className="auth-link-strong">
                Return to Login
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
