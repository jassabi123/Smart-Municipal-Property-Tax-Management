import React from 'react'
import { Link } from 'react-router-dom'
import { Building2, Info, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, MapPin, Phone, Mail } from 'lucide-react'

export default function PublicInfoPage() {
  return (
    <div className="public-landing-container">
      <header className="public-nav">
        <Link to="/" className="public-brand">
          <div className="civic-seal-badge">
            <Building2 size={24} />
          </div>
          <div className="brand-text-block">
            <span className="portal-sub">MUNICIPAL REVENUE PORTAL</span>
            <h1 className="brand-title">Civic<span>Ledger</span></h1>
          </div>
        </Link>

        <div className="public-nav-actions">
          <Link to="/" className="btn btn-outline">
            <ArrowLeft size={16} /> Home
          </Link>
          <Link to="/login" className="btn btn-primary">
            Citizen Sign In <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <div className="public-content-container">
        <div className="page-header-row">
          <div>
            <span className="page-pretitle">PUBLIC INFORMATION DIRECTORY</span>
            <h2 className="page-title">Municipal Property Taxation Overview</h2>
            <p className="page-subtitle">
              Official guide to municipal tax schedules, assessment cycles, civic ward boundaries, and contact desks.
            </p>
          </div>
        </div>

        <div className="info-cards-grid mt-6">
          <div className="info-card">
            <h3>Assessment Schedule &amp; Fiscal Year</h3>
            <p>
              The municipal financial year runs from <strong>April 1st to March 31st</strong>. 
              Annual assessments are issued at the commencement of each financial year. 
              Property owners are allowed a <strong>30-day grace period</strong> to settle dues 
              without statutory late penalty fees.
            </p>
          </div>

          <div className="info-card">
            <h3>Early Bird Incentive (5% Rebate)</h3>
            <p>
              Property owners settling their total annual assessed property tax on or before 
              <strong> April 30th</strong> are eligible for an immediate <strong>5% prompt payment discount</strong> 
              applied automatically to their ledger at checkout.
            </p>
          </div>

          <div className="info-card">
            <h3>Ward Boundaries &amp; Zonal Classifications</h3>
            <p>
              The municipal territory is divided into <strong>20 Administrative Wards</strong> categorized into 
              three distinct tax zones:
            </p>
            <ul className="info-bullet-list">
              <li><strong>Zone A (Wards 1-5):</strong> Prime commercial hubs, arterial corridors (1.25x unit rate)</li>
              <li><strong>Zone B (Wards 6-12):</strong> Established residential and mixed developments (1.00x unit rate)</li>
              <li><strong>Zone C (Wards 13-20):</strong> Developing suburban sectors and agricultural fringes (0.85x unit rate)</li>
            </ul>
          </div>

          <div className="info-card">
            <h3>Citizen Support &amp; Revenue Helpdesk</h3>
            <p>Need assistance with property verification, mutation, or payment reconciliation?</p>
            <div className="helpdesk-contact-box mt-4">
              <div className="flex items-center gap-2"><MapPin size={16} className="text-primary" /> Central Municipal Corporation Building, Civic Centre</div>
              <div className="flex items-center gap-2 mt-2"><Phone size={16} className="text-primary" /> Toll-Free Citizen Helpline: 1800-MUNICIPAL (686-424)</div>
              <div className="flex items-center gap-2 mt-2"><Mail size={16} className="text-primary" /> Email: support@smartmunicipal.gov.in</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
