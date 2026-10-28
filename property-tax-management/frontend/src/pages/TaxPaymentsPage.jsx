import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { 
  CreditCard, 
  CheckCircle2, 
  QrCode, 
  Building2, 
  Landmark, 
  Printer, 
  Download, 
  Search, 
  Clock, 
  ShieldAlert, 
  ArrowRight, 
  X,
  FileCheck,
  Receipt,
  Sparkles,
  Smartphone,
  Eye
} from 'lucide-react'
import { api, errorMessage } from '../api/client'

export default function TaxPaymentsPage({ user }) {
  const [searchParams] = useSearchParams()
  const prefilledAssessmentId = searchParams.get('assessmentId') || ''
  const prefilledAmount = searchParams.get('amount') || ''

  // Payment states
  const [payments, setPayments] = useState([])
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Checkout modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(Boolean(prefilledAssessmentId))
  const [checkoutStep, setCheckoutStep] = useState('FORM') // 'FORM' | 'PROCESSING' | 'SUCCESS'
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(prefilledAssessmentId)
  const [paymentAmount, setPaymentAmount] = useState(prefilledAmount || '5000')
  const [paymentMode, setPaymentMode] = useState('UPI') // 'UPI' | 'CARD' | 'NET_BANKING' | 'CASH' | 'DD'
  
  // Method details
  const [upiId, setUpiId] = useState('citizen@okaxis')
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821')
  const [cardExpiry, setCardExpiry] = useState('12/28')
  const [cardCvv, setCardCvv] = useState('842')
  const [selectedBank, setSelectedBank] = useState('State Bank of India')
  const [processingStatus, setProcessingStatus] = useState('')

  // Active Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState(null)

  // Fetch past payments and available assessments
  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      if (user?.role === 'PROPERTY_OWNER') {
        const propsRes = await api.get('/api/properties')
        const props = Array.isArray(propsRes.data) ? propsRes.data : []
        const assessmentsNested = await Promise.all(
          props.map(p => api.get(`/api/properties/${p.id}/assessment`).then(r => r.data).catch(() => []))
        )
        const flatAssessments = assessmentsNested.flat().filter(Boolean)
        setAssessments(flatAssessments)

        // Fetch payments for each assessment
        const paymentsNested = await Promise.all(
          flatAssessments.map(a => api.get(`/api/payments/assessment/${a.id}`).then(r => r.data).catch(() => []))
        )
        setPayments(paymentsNested.flat().filter(Boolean))
      } else {
        // Staff can view assessments and payments
        const aRes = await api.get('/api/assessments').catch(() => ({ data: [] }))
        const flatAssessments = Array.isArray(aRes.data) ? aRes.data : []
        setAssessments(flatAssessments)

        if (flatAssessments.length > 0) {
          const paymentsNested = await Promise.all(
            flatAssessments.slice(0, 20).map(a => api.get(`/api/payments/assessment/${a.id}`).then(r => r.data).catch(() => []))
          )
          setPayments(paymentsNested.flat().filter(Boolean))
        }
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Auto-update amount when assessment selection changes
  useEffect(() => {
    if (selectedAssessmentId) {
      const found = assessments.find(a => String(a.id) === String(selectedAssessmentId))
      if (found) {
        const due = Number(found.taxAmount || 0) + Number(found.penalty || 0)
        setPaymentAmount(String(due))
      }
    }
  }, [selectedAssessmentId, assessments])

  // Execute Simulated Payment & Save to Database
  const handleProcessPayment = async (e) => {
    e.preventDefault()
    if (!selectedAssessmentId) {
      setError('Please select an assessment to pay.')
      return
    }

    setCheckoutStep('PROCESSING')
    setProcessingStatus('Initiating secure handshake with Payment Gateway…')

    // Simulate gateway steps
    setTimeout(() => {
      setProcessingStatus('Validating property tax ledger account…')
    }, 600)

    setTimeout(async () => {
      try {
        const generatedTxnId = `TXN-${Date.now().toString().slice(-8)}`
        
        // Call backend payment initiation endpoint
        const response = await api.post('/api/payments/initiate', {
          assessmentId: Number(selectedAssessmentId),
          amountPaid: Number(paymentAmount),
          paymentMode: paymentMode,
          transactionId: generatedTxnId
        })

        const savedPayment = response.data
        setActiveReceipt(savedPayment)
        setCheckoutStep('SUCCESS')
        fetchData()
      } catch (err) {
        setError(errorMessage(err))
        setCheckoutStep('FORM')
      }
    }, 1400)
  }

  const handlePrintReceipt = () => {
    window.print()
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <span className="page-pretitle">REVENUE COLLECTION &amp; SETTLEMENT</span>
          <h2 className="page-title">Property Tax Payments</h2>
          <p className="page-subtitle">
            Instant digital tax payment simulation, transaction verification, and official municipal receipts.
          </p>
        </div>

        <div className="page-actions-group">
          <button
            onClick={() => {
              setCheckoutStep('FORM')
              setShowCheckoutModal(true)
            }}
            className="btn btn-primary"
          >
            <CreditCard size={16} /> Make Tax Payment
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

      {/* Payment History Table */}
      <div className="data-table-card">
        <div className="table-card-header">
          <div className="header-title-wrap">
            <Receipt size={18} className="text-primary" />
            <h3>Settled Municipal Tax Transactions</h3>
          </div>
          <span className="live-tag"><span className="live-dot" /> Verified Ledger</span>
        </div>

        {loading ? (
          <div className="loading-state-card">
            <span className="spinner-icon-lg" />
            <p>Querying Payment Records…</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="empty-state-card">
            <CreditCard size={48} className="empty-icon" />
            <h3>No tax payments recorded yet</h3>
            <p>Click &apos;Make Tax Payment&apos; to simulate an instant municipal tax transaction.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="civic-table">
              <thead>
                <tr>
                  <th>Receipt # / Txn ID</th>
                  <th>Assessment Ref</th>
                  <th>Amount Paid</th>
                  <th>Payment Mode</th>
                  <th>Transaction Date</th>
                  <th>Status</th>
                  <th className="text-right">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="hoverable-row">
                    <td>
                      <div className="txn-id-cell">
                        <strong>{p.transactionId || `TXN-REC-${p.id}`}</strong>
                        <small className="text-muted">ID #{p.id}</small>
                      </div>
                    </td>
                    <td>
                      <span className="ward-pill">Assessment #{p.assessmentId}</span>
                    </td>
                    <td>
                      <strong className="text-highlight">₹{Number(p.amountPaid).toLocaleString('en-IN')}</strong>
                    </td>
                    <td>
                      <span className="payment-mode-tag">
                        {p.paymentMode}
                      </span>
                    </td>
                    <td>
                      <div className="date-time-cell">
                        <Clock size={14} className="text-muted" />
                        <span>{p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="status-pill status-paid">
                        <span className="dot" /> SUCCESS
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => setActiveReceipt(p)}
                        className="btn-action-icon"
                        title="View & Print Official Municipal Receipt"
                      >
                        <Printer size={15} /> Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Checkout Simulator Modal */}
      {showCheckoutModal && (
        <div className="modal-backdrop" onClick={() => setShowCheckoutModal(false)}>
          <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <CreditCard size={22} className="text-primary" />
                <div>
                  <h3>Municipal Payment Simulator</h3>
                  <p>Encrypted payment gateway integration sandbox</p>
                </div>
              </div>
              <button onClick={() => setShowCheckoutModal(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            {checkoutStep === 'FORM' && (
              <form onSubmit={handleProcessPayment}>
                <div className="modal-body">
                  {/* Assessment Selection */}
                  <div className="form-row-2col">
                    <div className="form-group">
                      <label>Target Assessment ID</label>
                      <select
                        required
                        value={selectedAssessmentId}
                        onChange={(e) => setSelectedAssessmentId(e.target.value)}
                      >
                        <option value="">-- Select Due Assessment --</option>
                        {assessments.map(a => (
                          <option key={a.id} value={a.id}>
                            Assessment #{a.id} • FY {a.financialYear} (Due: ₹{Number(a.taxAmount || 0) + Number(a.penalty || 0)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Amount to Pay (₹)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Payment Mode Selector Tabs */}
                  <div className="payment-modes-selector">
                    <span className="selector-title">Select Payment Channel:</span>
                    <div className="modes-tab-grid">
                      <button
                        type="button"
                        className={`mode-tab ${paymentMode === 'UPI' ? 'active' : ''}`}
                        onClick={() => setPaymentMode('UPI')}
                      >
                        <Smartphone size={18} />
                        <span>UPI / QR Code</span>
                      </button>
                      <button
                        type="button"
                        className={`mode-tab ${paymentMode === 'CARD' ? 'active' : ''}`}
                        onClick={() => setPaymentMode('CARD')}
                      >
                        <CreditCard size={18} />
                        <span>Credit / Debit Card</span>
                      </button>
                      <button
                        type="button"
                        className={`mode-tab ${paymentMode === 'NET_BANKING' ? 'active' : ''}`}
                        onClick={() => setPaymentMode('NET_BANKING')}
                      >
                        <Landmark size={18} />
                        <span>Net Banking</span>
                      </button>
                      <button
                        type="button"
                        className={`mode-tab ${paymentMode === 'CASH' ? 'active' : ''}`}
                        onClick={() => setPaymentMode('CASH')}
                      >
                        <Building2 size={18} />
                        <span>Municipal Cash Desk</span>
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Channel Inputs */}
                  <div className="channel-details-box">
                    {paymentMode === 'UPI' && (
                      <div className="upi-payment-sim">
                        <div className="qr-box">
                          <QrCode size={120} className="qr-graphic" />
                          <small>Scan using Google Pay, PhonePe, or Paytm</small>
                        </div>
                        <div className="upi-input-group">
                          <label>Or enter UPI Virtual Private Address (VPA):</label>
                          <input
                            type="text"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="username@bank"
                          />
                          <p className="vpa-hint">Verified Payee: <strong>SMART MUNICIPAL CORPORATION (TAX DIVISION)</strong></p>
                        </div>
                      </div>
                    )}

                    {paymentMode === 'CARD' && (
                      <div className="card-payment-sim">
                        <div className="form-group">
                          <label>Card Number</label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="1234 5678 9012 3456"
                          />
                        </div>
                        <div className="form-row-2col">
                          <div className="form-group">
                            <label>Valid Thru</label>
                            <input
                              type="text"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              placeholder="MM/YY"
                            />
                          </div>
                          <div className="form-group">
                            <label>CVV / CVC</label>
                            <input
                              type="password"
                              maxLength={3}
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value)}
                              placeholder="•••"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMode === 'NET_BANKING' && (
                      <div className="net-banking-sim">
                        <label>Select Authorized Banking Partner:</label>
                        <select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)}>
                          <option value="State Bank of India">State Bank of India</option>
                          <option value="HDFC Bank">HDFC Bank</option>
                          <option value="ICICI Bank">ICICI Bank</option>
                          <option value="Punjab National Bank">Punjab National Bank</option>
                          <option value="Axis Bank">Axis Bank</option>
                          <option value="Bank of Baroda">Bank of Baroda</option>
                        </select>
                        <p className="bank-redirect-hint">
                          You will be routed via the municipal payment gateway with direct settlement.
                        </p>
                      </div>
                    )}

                    {paymentMode === 'CASH' && (
                      <div className="cash-desk-sim">
                        <Building2 size={24} className="text-primary mb-2" />
                        <p>
                          Challan simulation for Municipal Corporation Over-the-Counter (OTC) cash desk payment.
                          A receipt with official cashier seal will be generated immediately upon confirmation.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Summary amount banner */}
                  <div className="payment-summary-banner">
                    <span>Total Debit Payable:</span>
                    <strong className="summary-amount">₹{Number(paymentAmount || 0).toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => setShowCheckoutModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-lg">
                    Confirm &amp; Authorize ₹{Number(paymentAmount || 0).toLocaleString('en-IN')} <ArrowRight size={18} />
                  </button>
                </div>
              </form>
            )}

            {/* PROCESSING STEP */}
            {checkoutStep === 'PROCESSING' && (
              <div className="modal-body text-center py-12">
                <div className="processing-pulse-wrapper">
                  <span className="spinner-icon-xl" />
                </div>
                <h3 className="mt-4">Processing Transaction</h3>
                <p className="text-muted mt-2">{processingStatus}</p>
                <div className="secure-badge mt-6">
                  <ShieldAlert size={14} /> 256-Bit SSL Encrypted Municipal Sandbox
                </div>
              </div>
            )}

            {/* SUCCESS STEP */}
            {checkoutStep === 'SUCCESS' && (
              <div className="modal-body text-center py-8">
                <div className="success-icon-wrap mb-4">
                  <CheckCircle2 size={56} className="text-success" />
                </div>
                <h3>Payment Successfully Settled!</h3>
                <p className="text-muted">
                  Transaction <strong>{activeReceipt?.transactionId}</strong> has been confirmed and written to the municipal property tax ledger.
                </p>

                <div className="mt-6 flex justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCheckoutModal(false)
                      // Keep active receipt open
                    }}
                    className="btn btn-primary"
                  >
                    <Printer size={16} /> View Official Municipal Receipt
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Official Tax Receipt Modal (Printable) */}
      {activeReceipt && (
        <div className="modal-backdrop" onClick={() => setActiveReceipt(null)}>
          <div className="modal-card modal-receipt" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-actions-top no-print">
              <button onClick={handlePrintReceipt} className="btn btn-primary btn-sm">
                <Printer size={15} /> Print / Save PDF
              </button>
              <button onClick={() => setActiveReceipt(null)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            {/* PRINTABLE RECEIPT CONTENT */}
            <div className="printable-receipt-document" id="printableReceipt">
              {/* Header */}
              <div className="receipt-header">
                <div className="receipt-crest">
                  <Building2 size={36} />
                </div>
                <div className="receipt-authority">
                  <h2>SMART MUNICIPAL CORPORATION</h2>
                  <h4>DEPARTMENT OF REVENUE &amp; PROPERTY TAXATION</h4>
                  <p>Official Municipal Tax Assessment &amp; Collection Receipt</p>
                </div>
              </div>

              <div className="receipt-divider" />

              {/* Receipt Meta */}
              <div className="receipt-meta-grid">
                <div>
                  <span className="meta-label">Receipt Number</span>
                  <strong>MCR-{activeReceipt.id?.toString().padStart(6, '0')}</strong>
                </div>
                <div>
                  <span className="meta-label">Transaction Reference</span>
                  <strong>{activeReceipt.transactionId || 'TXN-DIRECT'}</strong>
                </div>
                <div>
                  <span className="meta-label">Payment Date &amp; Time</span>
                  <strong>{activeReceipt.paidDate ? new Date(activeReceipt.paidDate).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span className="meta-label">Payment Channel</span>
                  <strong className="text-uppercase">{activeReceipt.paymentMode}</strong>
                </div>
              </div>

              {/* Assessment & Breakdown Table */}
              <table className="receipt-breakdown-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Assessment Ref</th>
                    <th className="text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>Property Tax Settlement</strong>
                      <p className="text-xs text-muted">Statutory Municipal Property Assessment Dues</p>
                    </td>
                    <td>#{activeReceipt.assessmentId}</td>
                    <td className="text-right font-mono font-bold">
                      ₹{Number(activeReceipt.amountPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} className="text-right font-bold">Total Amount Received:</td>
                    <td className="text-right font-mono font-bold text-lg">
                      ₹{Number(activeReceipt.amountPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Footer and Verification Seal */}
              <div className="receipt-footer-section">
                <div className="receipt-qr-stamp">
                  <QrCode size={70} />
                  <small>Scan to Verify on Municipal Portal</small>
                </div>

                <div className="receipt-sign-stamp">
                  <div className="digital-seal-box">
                    <span>DIGITALLY VERIFIED</span>
                    <strong>COMMISSIONER OF TAXATION</strong>
                    <small>SMART MUNICIPAL CORPORATION</small>
                  </div>
                </div>
              </div>

              <div className="receipt-notice-note">
                <p>
                  * This is a computer-generated official receipt and serves as valid evidence of municipal tax discharge 
                  pursuant to Section 120 of the Municipal Corporation Act.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
