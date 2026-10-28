import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Calculator, ArrowLeft, ArrowRight, CheckCircle2, Percent, Layers, ShieldCheck } from 'lucide-react'

export default function TaxRulesPage() {
  // Embedded interactive calculator
  const [calcInput, setCalcInput] = useState({
    areaSqft: 1500,
    constructionType: 'RESIDENTIAL',
    wardZone: 'B',
    ageYears: 6
  })

  const calcResult = useMemo(() => {
    const area = Number(calcInput.areaSqft) || 0
    const rates = { RESIDENTIAL: 2.5, COMMERCIAL: 6.0, INDUSTRIAL: 4.5 }
    const unitRate = rates[calcInput.constructionType] || 2.5

    const zones = { A: 1.25, B: 1.0, C: 0.85 }
    const zoneFactor = zones[calcInput.wardZone] || 1.0

    let dep = 0
    const age = Number(calcInput.ageYears) || 0
    if (age > 20) dep = 0.20
    else if (age > 10) dep = 0.10
    else if (age > 5) dep = 0.05

    const annualVal = area * unitRate * zoneFactor * (1 - dep) * 12
    const baseTax = Math.round(annualVal * 0.10)
    const cess = Math.round(baseTax * 0.05)
    const total = baseTax + cess

    return { annualVal: Math.round(annualVal), baseTax, cess, total }
  }, [calcInput])

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
            <span className="page-pretitle">REGULATORY FRAMEWORK</span>
            <h2 className="page-title">Unit Area Property Tax Calculation Rules</h2>
            <p className="page-subtitle">
              Transparent, objective assessment methodology compliant with the Municipal Corporation Property Tax Act.
            </p>
          </div>
        </div>

        {/* Formula breakdown */}
        <div className="formula-explanation-box mt-6">
          <div className="formula-header">
            <Layers size={20} className="text-primary" />
            <h3>The Unit Area Method (UAM) Equation</h3>
          </div>
          <div className="formula-code-banner">
            <code>Annual Rateable Value (ARV) = Built-Up Area (sq. ft.) × Base Unit Rate × Zone Multiplier × (1 - Depreciation) × 12</code>
          </div>
          <p className="mt-3 text-muted">
            Total Annual Property Tax = <strong>(ARV × 10% Municipal Tax) + (5% Statutory Education &amp; Library Cess)</strong>.
          </p>
        </div>

        {/* Interactive Calculator Section */}
        <div className="interactive-calc-wrapper mt-8">
          <div className="calc-card-public">
            <div className="calc-header">
              <Calculator size={22} className="text-primary" />
              <div>
                <h3>Self-Assessment Tax Estimator</h3>
                <p>Simulate your estimated municipal property tax liability</p>
              </div>
            </div>

            <div className="calc-inputs-grid mt-4">
              <div className="form-group">
                <label>Covered / Plinth Area (sq. ft.)</label>
                <input
                  type="number"
                  min="50"
                  max="100000"
                  value={calcInput.areaSqft}
                  onChange={(e) => setCalcInput({ ...calcInput, areaSqft: Number(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label>Structural Usage</label>
                <select
                  value={calcInput.constructionType}
                  onChange={(e) => setCalcInput({ ...calcInput, constructionType: e.target.value })}
                >
                  <option value="RESIDENTIAL">Residential (₹2.50 / sqft / mo)</option>
                  <option value="COMMERCIAL">Commercial (₹6.00 / sqft / mo)</option>
                  <option value="INDUSTRIAL">Industrial (₹4.50 / sqft / mo)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Ward Zone Multiplier</label>
                <select
                  value={calcInput.wardZone}
                  onChange={(e) => setCalcInput({ ...calcInput, wardZone: e.target.value })}
                >
                  <option value="A">Zone A (Wards 1-5) • 1.25x Multiplier</option>
                  <option value="B">Zone B (Wards 6-12) • 1.00x Multiplier</option>
                  <option value="C">Zone C (Wards 13-20) • 0.85x Multiplier</option>
                </select>
              </div>

              <div className="form-group">
                <label>Age of Construction (Years)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={calcInput.ageYears}
                  onChange={(e) => setCalcInput({ ...calcInput, ageYears: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Results */}
            <div className="calc-result-display mt-6">
              <div className="result-kpi-item">
                <span>Calculated Annual Value</span>
                <strong>₹{calcResult.annualVal.toLocaleString('en-IN')}</strong>
              </div>
              <div className="result-kpi-item">
                <span>Base Property Tax (10%)</span>
                <strong>₹{calcResult.baseTax.toLocaleString('en-IN')}</strong>
              </div>
              <div className="result-kpi-item">
                <span>Education Cess (5%)</span>
                <strong>+₹{calcResult.cess.toLocaleString('en-IN')}</strong>
              </div>
              <div className="result-kpi-item highlight">
                <span>Estimated Annual Tax</span>
                <strong className="text-success text-2xl">₹{calcResult.total.toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
