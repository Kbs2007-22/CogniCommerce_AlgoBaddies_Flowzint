import React, { useState, useEffect, useCallback } from 'react'
import { claimsApi } from '../api/client.js'

const STATUSES = ['open', 'approved', 'rejected', 'resolved']

/* ── File New Claim form ─────────────────────────────── */
function NewClaimForm({ onSuccess, toast }) {
  const [form, setForm] = useState({
    delivery_id: '',
    claimant_name: '',
    description: '',
    amount_claimed: '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (!form.delivery_id || !form.claimant_name || !form.description || !form.amount_claimed) {
      toast('Please fill in all fields.', 'red'); return
    }
    const amount = parseFloat(form.amount_claimed)
    if (isNaN(amount) || amount <= 0) { toast('Amount must be a positive number.', 'red'); return }

    setSaving(true)
    try {
      await claimsApi.create({ ...form, amount_claimed: amount })
      toast('Claim filed successfully.', 'green')
      setForm({ delivery_id: '', claimant_name: '', description: '', amount_claimed: '' })
      onSuccess()
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to file claim.', 'red')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="form-grid">
        <div className="field">
          <label className="field-label" htmlFor="cl-delivery">Delivery ID</label>
          <input id="cl-delivery" className="input" placeholder="DEL-0042" value={form.delivery_id} onChange={set('delivery_id')} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="cl-name">Claimant Name</label>
          <input id="cl-name" className="input" placeholder="Jane Doe" value={form.claimant_name} onChange={set('claimant_name')} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="cl-amount">Amount Claimed ($)</label>
          <input id="cl-amount" className="input" type="number" min="0.01" step="0.01" placeholder="150.00" value={form.amount_claimed} onChange={set('amount_claimed')} />
        </div>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label className="field-label" htmlFor="cl-desc">Description</label>
          <textarea id="cl-desc" className="input" placeholder="Describe the damage or loss in detail…" value={form.description} onChange={set('description')} />
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" id="cl-submit" className="btn btn-accent" disabled={saving}>
          {saving ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Submitting…</> : '◈ File Claim'}
        </button>
      </div>
    </form>
  )
}

/* ── Claims list + management ─────────────────────────── */
function ClaimsList({ claims, loading, onRefresh, toast }) {
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = statusFilter ? claims.filter((c) => c.status === statusFilter) : claims

  async function changeStatus(id, newStatus) {
    try {
      await claimsApi.updateStatus(id, newStatus)
      toast(`Claim status → ${newStatus}`, 'accent')
      onRefresh()
    } catch {
      toast('Failed to update status.', 'red')
    }
  }

  async function deleteClaim(id) {
    try {
      await claimsApi.remove(id)
      toast('Claim deleted.', 'violet')
      onRefresh()
    } catch {
      toast('Failed to delete claim.', 'red')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: 'var(--txt-sub)', padding: '24px 0' }}>
        <div className="spinner" /> Loading claims…
      </div>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          id="cl-filter"
          className="input"
          style={{ width: 'auto', minWidth: 160 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <button id="cl-refresh" className="btn btn-ghost" onClick={onRefresh} aria-label="Refresh claims list">
          ↺ Refresh
        </button>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--txt-muted)', marginLeft: 'auto' }}>
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">◈</div>
          <p>No claims found.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Claimant</th>
                <th>Delivery ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="td-mono" style={{ fontSize: 11 }} title={c.id}>{c.id.slice(0, 8)}…</td>
                  <td>{c.claimant_name}</td>
                  <td className="td-mono">{c.delivery_id}</td>
                  <td className="td-mono">${c.amount_claimed.toFixed(2)}</td>
                  <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                  <td className="td-muted">{new Date(c.created_at).toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {STATUSES.filter((s) => s !== c.status).map((s) => (
                        <button
                          key={s}
                          id={`cl-${s}-${c.id.slice(0,8)}`}
                          className={`btn btn-sm btn-ghost`}
                          style={{
                            color: s === 'approved' ? 'var(--green)' :
                                   s === 'rejected' ? 'var(--red)' :
                                   s === 'resolved' ? 'var(--violet)' : 'var(--accent)',
                            borderColor: 'currentColor',
                          }}
                          onClick={() => changeStatus(c.id, s)}
                          aria-label={`Set claim to ${s}`}
                        >
                          → {s}
                        </button>
                      ))}
                      <button
                        id={`cl-del-${c.id.slice(0,8)}`}
                        className="btn btn-sm btn-red"
                        onClick={() => deleteClaim(c.id)}
                        aria-label={`Delete claim ${c.id}`}
                      >
                        ✕
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
  )
}

/* ── Main ClaimsPanel ────────────────────────────────── */
function ClaimsPanel({ toast }) {
  const [tab, setTab]       = useState('list')
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await claimsApi.list({ limit: 200 })
      setClaims(data)
    } catch {
      toast('Could not load claims — is the backend running?', 'red')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="section-head">Claims Management</div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        {[['list','◈ All Claims'],['new','+ File New Claim']].map(([id, label]) => (
          <button
            key={id}
            id={`claims-tab-${id}`}
            className={`btn btn-ghost${tab === id ? '' : ''}`}
            style={tab === id ? { color: 'var(--accent)', borderColor: 'var(--accent)', background: 'var(--accent-dim)' } : {}}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="panel">
        {tab === 'new' ? (
          <NewClaimForm onSuccess={() => { setTab('list'); load() }} toast={toast} />
        ) : (
          <ClaimsList claims={claims} loading={loading} onRefresh={load} toast={toast} />
        )}
      </div>
    </div>
  )
}

export default ClaimsPanel
