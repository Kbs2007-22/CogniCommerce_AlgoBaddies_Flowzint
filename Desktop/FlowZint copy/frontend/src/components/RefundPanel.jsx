import React, { useState } from 'react'
import { refundsApi } from '../api/client.js'

const SEED_USERS = [
  { label: 'VIP Buyer (trusted, high spend)', email: 'vip_buyer@example.com' },
  { label: 'Risk Buyer (untrusted, low spend)', email: 'risk_buyer@example.com' },
]

function DecisionBadge({ decision }) {
  const map = {
    AUTO_APPROVED: { color: 'var(--green)', icon: '✓' },
    ESCALATE_TO_HUMAN: { color: 'var(--red)', icon: '⚠' },
    STANDARD_RETURN_REQUIRED: { color: 'var(--accent)', icon: '↩' },
  }
  const cfg = map[decision] || { color: 'var(--txt-sub)', icon: '?' }
  return (
    <div className="result-decision" style={{ color: cfg.color }}>
      {cfg.icon} {decision?.replace(/_/g, ' ')}
    </div>
  )
}

function RefundPanel({ toast }) {
  const [form, setForm] = useState({
    user_email: 'vip_buyer@example.com',
    order_id: 'ORD-20241',
    item_value: '89.99',
    is_non_returnable: false,
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) =>
    setForm((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  async function submit(e) {
    e.preventDefault()
    const val = parseFloat(form.item_value)
    if (!form.user_email || !form.order_id || isNaN(val) || val <= 0) {
      toast('Fill in all fields with valid values.', 'red'); return
    }
    setLoading(true); setResult(null)
    try {
      const { data } = await refundsApi.evaluate({
        user_email: form.user_email,
        order_id: form.order_id,
        item_value: val,
        is_non_returnable: form.is_non_returnable,
      })
      setResult(data)
      toast('Refund evaluation complete.', 'green')
    } catch (err) {
      toast(err.response?.data?.detail || 'Evaluation failed — check backend.', 'red')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="section-head">Trust Score & Autonomous Refunds</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px,1fr))', gap: 20 }}>
        {/* Form */}
        <div className="panel">
          <div style={{ fontFamily: 'var(--f-label)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--txt-sub)', marginBottom: 16 }}>
            Evaluate Refund Request
          </div>
          <form onSubmit={submit} noValidate>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="field">
                <label className="field-label" htmlFor="rf-preset">Quick Select User</label>
                <select
                  id="rf-preset"
                  className="input"
                  value={form.user_email}
                  onChange={(e) => setForm((p) => ({ ...p, user_email: e.target.value }))}
                >
                  {SEED_USERS.map((u) => (
                    <option key={u.email} value={u.email}>{u.label}</option>
                  ))}
                  <option value="">Custom email…</option>
                </select>
              </div>

              {form.user_email === '' && (
                <div className="field">
                  <label className="field-label" htmlFor="rf-email">User Email</label>
                  <input id="rf-email" className="input" type="email" placeholder="user@example.com"
                    value={form.user_email} onChange={set('user_email')} />
                </div>
              )}

              <div className="field">
                <label className="field-label" htmlFor="rf-order">Order ID</label>
                <input id="rf-order" className="input" placeholder="ORD-20241"
                  value={form.order_id} onChange={set('order_id')} />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="rf-value">Item Value ($)</label>
                <input id="rf-value" className="input" type="number" min="0.01" step="0.01"
                  placeholder="89.99" value={form.item_value} onChange={set('item_value')} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <input
                  id="rf-nonret"
                  type="checkbox"
                  checked={form.is_non_returnable}
                  onChange={set('is_non_returnable')}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
                <label htmlFor="rf-nonret" style={{ fontFamily: 'var(--f-label)', fontSize: 13, cursor: 'pointer' }}>
                  Non-returnable item (triggers trust policy check)
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button id="rf-submit" type="submit" className="btn btn-accent" disabled={loading}>
                {loading
                  ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Evaluating…</>
                  : '↩ Evaluate Refund'}
              </button>
            </div>
          </form>
        </div>

        {/* Result */}
        <div>
          {result ? (
            <div className="result-card">
              <div className="result-label">Engine Decision</div>
              <DecisionBadge decision={result.decision} />
              {result.reason && <div className="result-text"><strong>Reason:</strong> {result.reason}</div>}
              {result.resolution && <div className="result-text"><strong>Resolution:</strong> {result.resolution}</div>}
              {result.actions_taken && <div className="result-text"><strong>Actions Taken:</strong> {result.actions_taken}</div>}
            </div>
          ) : (
            <div className="empty-state" style={{ minHeight: 200 }}>
              <div className="empty-state-icon">↩</div>
              <p>Submit a request to see the engine decision.</p>
            </div>
          )}

          {/* Policy explanation */}
          <div className="panel" style={{ marginTop: 16 }}>
            <div style={{ fontFamily: 'var(--f-label)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--txt-sub)', marginBottom: 10 }}>
              Policy Rules
            </div>
            {[
              ['AUTO_APPROVED', 'var(--green)', 'High trust score + non-returnable → instant credit, keep item'],
              ['ESCALATE_TO_HUMAN', 'var(--red)', 'Low trust or flagged + non-returnable → human review queue'],
              ['STANDARD_RETURN_REQUIRED', 'var(--accent)', 'Standard item → normal return window, ship back required'],
            ].map(([k, c, desc]) => (
              <div key={k} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: c, flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: 12, color: 'var(--txt-sub)' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RefundPanel
