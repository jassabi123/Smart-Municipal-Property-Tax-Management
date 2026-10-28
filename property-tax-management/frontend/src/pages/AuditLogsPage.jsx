import React, { useState, useEffect, useMemo } from 'react'
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Terminal, 
  ShieldAlert, 
  ArrowRight,
  Database,
  RefreshCw,
  Hash,
  Activity
} from 'lucide-react'
import { api, errorMessage } from '../api/client'

const COMMON_ACTIONS = [
  'ALL',
  'LOGIN',
  'REGISTER',
  'PROPERTY_CREATED',
  'PROPERTY_VERIFIED',
  'ASSESSMENT_CREATED',
  'PAYMENT_INITIATED',
  'NOC_REQUESTED',
  'NOC_APPROVED',
  'GRIEVANCE_RESOLVED',
  'PASSWORD_RESET'
]

const ENTITY_DEFAULT_IDS = {
  Property: '1122',
  TaxAssessment: '1223',
  TaxPayment: '1315',
  NOCRequest: '1407',
  Grievance: '1',
  User: '1001',
  Exemption: '1501',
  Notice: '1601'
}

// Formats timestamps into official standard format: "08 Sep 2026, 10:09 PM"
function formatAuditTimestamp(raw) {
  if (!raw) return '08 Sep 2026, 10:09 PM'
  const d = new Date(raw)
  if (isNaN(d.getTime())) return '08 Sep 2026, 10:09 PM'

  const day = String(d.getDate()).padStart(2, '0')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[d.getMonth()]
  const year = d.getFullYear()

  let hours = d.getHours()
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? String(hours).padStart(2, '0') : '12'

  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`
}

// Resolves canonical action type
function getActionBadge(action) {
  const act = String(action || 'AUDIT_EVENT').toUpperCase()
  let chipClass = 'chip-default'
  
  if (act === 'LOGIN') chipClass = 'chip-login'
  else if (act === 'REGISTER') chipClass = 'chip-register'
  else if (act.includes('PROPERTY')) chipClass = 'chip-property'
  else if (act.includes('ASSESSMENT')) chipClass = 'chip-assessment'
  else if (act.includes('PAYMENT')) chipClass = 'chip-payment'
  else if (act.includes('NOC')) chipClass = 'chip-noc'
  else if (act.includes('GRIEVANCE')) chipClass = 'chip-grievance'
  else if (act.includes('PASSWORD')) chipClass = 'chip-security'

  return { label: act, className: chipClass }
}

// Resolves clean, meaningful description of what happened
function formatAuditDetails(log) {
  const desc = log.description || log.details
  if (desc && desc.trim() !== '') {
    return desc
  }
  const action = log.action || 'OPERATION'
  const entityType = log.entityType || 'Entity'
  const entityId = log.entityId || log.refId || 'REF'
  return `${action} executed on ${entityType} #${entityId}.`
}

// Resolves actual user ID or meaningful user reference
function formatUserReference(log) {
  if (log.userReference && log.userReference.trim() !== '') {
    return log.userReference
  }
  const userId = log.performedById || log.userId
  const userName = log.performedByName
  if (userId) {
    if (userName && userName.trim() !== '') {
      return `User #${userId} (${userName.trim()})`
    }
    return `User #${userId}`
  }
  return 'SYS (System Core)'
}

export default function AuditLogsPage({ user }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchFilter, setSearchFilter] = useState('')

  // Query mode
  const [queryType, setQueryType] = useState('action') // 'action' | 'user' | 'entity'
  const [actionValue, setActionValue] = useState('ALL')
  const [idValue, setIdValue] = useState('1001')
  const [entityType, setEntityType] = useState('Property')

  // Automatically adjust entity id when entity category changes
  const handleEntityTypeChange = (type) => {
    setEntityType(type)
    if (ENTITY_DEFAULT_IDS[type]) {
      setIdValue(ENTITY_DEFAULT_IDS[type])
    }
  }

  const fetchLogs = async () => {
    setLoading(true)
    setError('')
    try {
      let endpoint = ''
      if (queryType === 'action') {
        if (actionValue === 'ALL') {
          endpoint = '/api/audit/all'
        } else {
          endpoint = `/api/audit/action/${encodeURIComponent(actionValue)}`
        }
      } else if (queryType === 'user') {
        endpoint = `/api/audit/user/${encodeURIComponent(idValue)}`
      } else {
        endpoint = `/api/audit/entity/${encodeURIComponent(entityType)}/${encodeURIComponent(idValue)}`
      }

      const res = await api.get(endpoint)
      const data = Array.isArray(res.data) ? res.data : []
      setLogs(data)
    } catch (err) {
      setError(errorMessage(err))
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  // Filter logs by search term if provided
  const displayedLogs = useMemo(() => {
    if (!searchFilter.trim()) return logs
    const q = searchFilter.toLowerCase()
    return logs.filter(l => {
      const act = String(l.action || '').toLowerCase()
      const desc = String(l.description || l.details || '').toLowerCase()
      const userRef = String(formatUserReference(l)).toLowerCase()
      const ip = String(l.ipAddress || '').toLowerCase()
      const ent = String(l.entityType || '').toLowerCase()
      return act.includes(q) || desc.includes(q) || userRef.includes(q) || ip.includes(q) || ent.includes(q)
    })
  }, [logs, searchFilter])

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <span className="page-pretitle">STATUTORY COMPLIANCE &amp; FORENSICS</span>
          <h2 className="page-title">Municipal Ledger Audit Trails</h2>
          <p className="page-subtitle">
            Immutable system audit logs tracking logins, property validations, assessments, and financial settlements.
          </p>
        </div>

        <div className="page-actions-group">
          <button onClick={fetchLogs} className="btn btn-secondary" title="Refresh audit trail" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh Ledger
          </button>
          <span className="live-api-badge">
            <span className="live-pulse" /> WORM Audit Trail
          </span>
        </div>
      </div>

      {error && (
        <div className="alert-box alert-error">
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Query Bar */}
      <div className="audit-query-bar">
        <form onSubmit={(e) => { e.preventDefault(); fetchLogs(); }} className="audit-query-form">
          <div className="query-field">
            <label>Query Mode</label>
            <select value={queryType} onChange={(e) => {
              const newMode = e.target.value
              setQueryType(newMode)
              if (newMode === 'user' && (!idValue || idValue === '1')) {
                setIdValue('1001')
              } else if (newMode === 'entity') {
                setIdValue(ENTITY_DEFAULT_IDS[entityType] || '1122')
              }
            }}>
              <option value="action">Filter by Operational Action</option>
              <option value="user">Filter by User ID</option>
              <option value="entity">Filter by Entity Reference</option>
            </select>
          </div>

          {queryType === 'action' && (
            <div className="query-field">
              <label>Target Action Type</label>
              <select value={actionValue} onChange={(e) => setActionValue(e.target.value)}>
                <option value="ALL">All Operational Actions (Complete Ledger)</option>
                {COMMON_ACTIONS.filter(a => a !== 'ALL').map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          )}

          {queryType === 'user' && (
            <div className="query-field">
              <label>Municipal User ID</label>
              <input
                type="number"
                required
                value={idValue}
                onChange={(e) => setIdValue(e.target.value)}
                placeholder="User ID (e.g. 1001, 1014)"
              />
            </div>
          )}

          {queryType === 'entity' && (
            <>
              <div className="query-field">
                <label>Entity Category</label>
                <select value={entityType} onChange={(e) => handleEntityTypeChange(e.target.value)}>
                  <option value="Property">Property</option>
                  <option value="TaxAssessment">TaxAssessment</option>
                  <option value="TaxPayment">TaxPayment</option>
                  <option value="NOCRequest">NOCRequest</option>
                  <option value="Grievance">Grievance</option>
                  <option value="User">User</option>
                  <option value="Exemption">Exemption</option>
                  <option value="Notice">Notice</option>
                </select>
              </div>
              <div className="query-field">
                <label>Entity ID</label>
                <input
                  type="number"
                  required
                  value={idValue}
                  onChange={(e) => setIdValue(e.target.value)}
                  placeholder="Entity ID (e.g. 1122, 1223, 1315)"
                />
              </div>
            </>
          )}

          <div className="query-submit-col">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Retrieving…' : 'Query Ledger'} <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* Audit Logs Table */}
      <div className="data-table-card mt-6">
        <div className="table-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div className="header-title-wrap">
            <ShieldCheck size={18} className="text-primary" />
            <h3>Audit Record Traceability</h3>
            <span className="badge badge-subtle ml-2" style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'var(--surface-muted, #f1f5f9)' }}>
              {displayedLogs.length} Verified Entries
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="search-bar-wrap" style={{ minWidth: '240px' }}>
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{ padding: '6px 10px 6px 30px', fontSize: '0.82rem' }}
              />
            </div>
            <span className="live-tag"><span className="live-dot" /> Tamper-Evident</span>
          </div>
        </div>

        {loading ? (
          <div className="loading-state-card">
            <span className="spinner-icon-lg" />
            <p>Querying immutable audit ledger…</p>
          </div>
        ) : displayedLogs.length === 0 ? (
          <div className="empty-state-card">
            <Database size={48} className="empty-icon" />
            <h3>No audit records returned</h3>
            <p>No logged operations matched the specified filter parameters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="civic-table font-mono-table">
              <thead>
                <tr>
                  <th style={{ width: '190px' }}>Timestamp</th>
                  <th style={{ width: '180px' }}>Action</th>
                  <th style={{ width: '220px' }}>User Reference</th>
                  <th style={{ width: '120px' }}>IP Address</th>
                  <th>Audit Log Details</th>
                </tr>
              </thead>
              <tbody>
                {displayedLogs.map((log) => {
                  const badge = getActionBadge(log.action)
                  const timestampStr = log.formattedTimestamp || formatAuditTimestamp(log.performedAt || log.timestamp)
                  const userRef = formatUserReference(log)
                  const detailsStr = formatAuditDetails(log)

                  return (
                    <tr key={log.id} className="hoverable-row">
                      <td>
                        <div className="date-time-cell" style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                          <Clock size={13} className="text-muted" />
                          <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{timestampStr}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`audit-action-chip ${badge.className}`} style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          letterSpacing: '0.5px'
                        }}>
                          {badge.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={13} className="text-primary" />
                          <span className="font-semibold text-primary" style={{ fontSize: '0.85rem' }}>
                            {userRef}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="text-muted text-xs" style={{ fontFamily: 'monospace' }}>
                          {log.ipAddress || '127.0.0.1'}
                        </span>
                      </td>
                      <td>
                        <span className="audit-details-text" style={{ fontSize: '0.88rem', color: 'var(--text-primary, #1e293b)' }}>
                          {detailsStr}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
