import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Building2, 
  ShieldCheck, 
  CreditCard, 
  FileCheck, 
  MessageSquare, 
  ArrowRight, 
  Calculator, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  Sparkles,
  Award,
  ChevronRight
} from 'lucide-react'
import { api } from '../api/client'

export default function LandingPage() {
  const [stats, setStats] = useState({
    totalProperties: 1240,
    totalCollected: 48500000,
    collectionEfficiency: 88.5,
    activeWards: 20
  })

  // Attempt to fetch live public metrics if available
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get('/api/analytics/collection')
        if (res.data) {
          setStats(prev => ({
            ...prev,
            totalProperties: res.data.totalProperties || prev.totalProperties,
            totalCollected: res.data.totalCollected || prev.totalCollected,
            collectionEfficiency: res.data.collectionEfficiencyPercent || prev.collectionEfficiency
          }))
        }
      } catch {
        // Fallback to municipal default indicators
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="public-landing-container">
      {/* Top Civic Navigation */}
      <header className="public-nav">
        <div className="public-brand">
          <div className="civic-seal-badge">
            <Building2 size={24} />
          </div>
          <div className="brand-text-block">
            <span className="portal-sub">MUNICIPAL REVENUE PORTAL</span>
            <h1 className="brand-title">Civic<span>Ledger</span></h1>
          </div>
        </div>

        <nav className="public-nav-links">
          <Link to="/public-info">Municipal Tax Info</Link>
          <Link to="/tax-rules">Tax Rules & Calculator</Link>
        </nav>

        <div className="public-nav-actions">
          <Link to="/login" className="btn btn-outline">
            Sign In
          </Link>
          <Link to="/register" className="btn btn-primary">
            Citizen Register <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-kicker">
            <span className="live-dot pulse" />
            <span>Digital Governance &amp; Municipal Tax Administration</span>
          </div>

          <h2 className="hero-headline">
            Transparent, Accountable &amp; Seamless 
            <span className="highlight-text"> Property Tax Operations</span>
          </h2>

          <p className="hero-description">
            Empowering citizens and municipal revenue authorities with instant tax assessments, 
            secure digital payments, verified No Objection Certificates (NOC), 
            and transparent grievance resolution.
          </p>

          <div className="hero-cta-group">
            <Link to="/login" className="btn btn-primary btn-lg">
              Access Municipal Portal <ArrowRight size={18} />
            </Link>
            <Link to="/tax-rules" className="btn btn-outline btn-lg">
              <Calculator size={18} /> Tax Rules &amp; Calculator
            </Link>
          </div>

          {/* Trust points */}
          <div className="trust-badges-row">
            <div className="trust-badge-item">
              <ShieldCheck size={18} className="text-primary" />
              <span>JWT &amp; RBAC 2.0 Security</span>
            </div>
            <div className="trust-badge-item">
              <CheckCircle2 size={18} className="text-success" />
              <span>Government Audit Compliant</span>
            </div>
            <div className="trust-badge-item">
              <Sparkles size={18} className="text-accent" />
              <span>Real-Time Payment Receipts</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive Showcase Card */}
        <div className="hero-card-container">
          <div className="hero-glass-card">
            <div className="card-header-accent">
              <span className="portal-chip">MUNICIPALITY AT A GLANCE</span>
              <span className="status-badge-active">Online</span>
            </div>

            <div className="live-stats-grid">
              <div className="stat-card">
                <span className="stat-label">Properties Cataloged</span>
                <strong className="stat-value">{stats.totalProperties.toLocaleString()}</strong>
                <span className="stat-meta">Across 20 Wards</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Revenue Collected</span>
                <strong className="stat-value">₹{(stats.totalCollected / 10000000).toFixed(2)} Cr</strong>
                <span className="stat-meta">{Number(stats.collectionEfficiency).toFixed(1)}% Efficiency</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Citizen Services</span>
                <strong className="stat-value">100% Digital</strong>
                <span className="stat-meta">NOCs, Receipts &amp; Appeals</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Turnaround Time</span>
                <strong className="stat-value">&lt; 48 Hours</strong>
                <span className="stat-meta">Grievance Redressal</span>
              </div>
            </div>

            <div className="portal-quick-link-box">
              <div className="quick-info-text">
                <strong>Need your property tax receipt?</strong>
                <p>Log in with your registered phone or email to download authenticated municipal receipts.</p>
              </div>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Get Receipt <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Capabilities Section */}
      <section className="landing-features">
        <div className="section-heading-center">
          <span className="sub-heading">INTEGRATED CIVIC SERVICES</span>
          <h3>Everything Citizens &amp; Officials Need</h3>
          <p>A unified digital infrastructure replacing manual paperwork with automated municipal workflows.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon bg-blue">
              <Building2 size={24} />
            </div>
            <h4>Property Registration &amp; GIS Wards</h4>
            <p>Register residential, commercial, or industrial parcels with verified ward mapping and area measurements.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon bg-green">
              <Calculator size={24} />
            </div>
            <h4>Unit Area Tax Assessment</h4>
            <p>Automated formula assessment based on covered area, construction grade, age depreciation, and municipal zoning.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon bg-purple">
              <CreditCard size={24} />
            </div>
            <h4>Instant Tax Payments</h4>
            <p>Multi-channel payment simulation via UPI, Credit/Debit cards, Net Banking, and municipal challans with instant printable receipts.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon bg-amber">
              <FileCheck size={24} />
            </div>
            <h4>Online NOC Certificates</h4>
            <p>Submit digital requests for tax clearance No Objection Certificates. Download verified certificates upon officer approval.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon bg-rose">
              <MessageSquare size={24} />
            </div>
            <h4>Grievance Redressal</h4>
            <p>Citizen dispute filing for tax re-evaluation, incorrect property details, or payment queries with direct Commissioner oversight.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon bg-teal">
              <Award size={24} />
            </div>
            <h4>Exemption Programs</h4>
            <p>Statutory municipal concessions for senior citizens, widows, charitable trusts, and defense personnel with automatic ledger adjustment.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="public-footer">
        <div className="footer-content">
          <div className="footer-col brand-col">
            <div className="public-brand">
              <div className="civic-seal-badge-sm">
                <Building2 size={20} />
              </div>
              <h4 className="footer-brand-title">Civic<span>Ledger</span></h4>
            </div>
            <p>Smart Municipal Property Tax Management &amp; Revenue Operations System.</p>
            <p className="copyright-line">© 2026 Smart Municipal Corporation. All rights reserved.</p>
          </div>

          <div className="footer-col">
            <h5>Citizen Services</h5>
            <ul>
              <li><Link to="/login">Pay Property Tax</Link></li>
              <li><Link to="/register">Register New Property</Link></li>
              <li><Link to="/login">Apply for NOC</Link></li>
              <li><Link to="/tax-rules">Tax Calculator</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Official Access</h5>
            <ul>
              <li><Link to="/login">Ward Officer Login</Link></li>
              <li><Link to="/login">Tax Assessor Portal</Link></li>
              <li><Link to="/login">Finance &amp; Audit Desk</Link></li>
              <li><Link to="/login">Commissioner Dashboard</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Security &amp; Support</h5>
            <ul>
              <li><Link to="/public-info">Public Notice Board</Link></li>
              <li><Link to="/tax-rules">Assessment Guidelines</Link></li>
              <li><Link to="/login">Citizen Grievances</Link></li>
              <li><span className="compliance-tag">ISO 27001 &amp; IT Act Compliant</span></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}
