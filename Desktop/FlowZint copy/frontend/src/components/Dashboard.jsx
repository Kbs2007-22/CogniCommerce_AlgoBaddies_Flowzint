import React, { useEffect, useState } from 'react'
import { claimsApi, analyticsApi } from '../api/client.js'

function StatCard({ label, value, sub, color = 'var(--accent)' }) {
  return (
    <div className="stat-card" style={{ '--c': color }}>
      <div className="stat-lbl">{label}</div>
      <div className="stat-val">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

function Dashboard({ toast }) {
  const [claims, setClaims]       = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.allSettled([claimsApi.list({ limit: 200 }), analyticsApi.status()])
      .then(([c, a]) => {
        if (c.status === 'fulfilled') setClaims(c.value.data)
        if (a.status === 'fulfilled') setAnalytics(a.value.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const byStatus = (s) => claims.filter((c) => c.status === s).length
  const totalVal  = claims.reduce((sum, c) => sum + c.amount_claimed, 0)

  return (
    <div>
      <div className="section-head">System Overview</div>

      {loading ? (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: 'var(--txt-sub)' }}>
          <div className="spinner" /> Fetching live data…
        </div>
      ) : (
        <>
          <div className="stat-grid">
            <StatCard label="Total Claims"    value={claims.length}           sub="all time"            color="var(--accent)" />
            <StatCard label="Open"            value={byStatus('open')}         sub="awaiting review"     color="var(--accent)" />
            <StatCard label="Approved"        value={byStatus('approved')}     sub="auto-approved"       color="var(--green)" />
            <StatCard label="Rejected"        value={byStatus('rejected')}     sub="flagged"             color="var(--red)" />
            <StatCard label="Resolved"        value={byStatus('resolved')}     sub="closed"              color="var(--violet)" />
            <StatCard
              label="Total Claimed ($)"
              value={`$${totalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sub="aggregate value"
              color="var(--amber)"
            />
          </div>

          {analytics?.system_top_offender && (
            <div className="panel" style={{ marginTop: 24 }}>
              <div className="section-head">⚠ Top Defect Offender</div>
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: 'var(--f-label)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--txt-sub)', marginBottom: 4 }}>Batch ID</div>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, color: 'var(--red)', letterSpacing: '.06em' }}>
                    {analytics.system_top_offender.worst_batch_id}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--f-label)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--txt-sub)', marginBottom: 4 }}>Cluster Size</div>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: 28, color: 'var(--red)' }}>
                    {analytics.system_top_offender.cluster_size}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--f-label)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--txt-sub)', marginBottom: 4 }}>Cluster ID</div>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: 28, color: 'var(--amber)' }}>
                    #{analytics.system_top_offender.cluster_id}
                  </div>
                </div>
              </div>
            </div>
          )}

          {claims.length > 0 && (
            <div className="panel" style={{ marginTop: 24 }}>
              <div className="section-head">Recent Claims</div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Claimant</th>
                      <th>Delivery ID</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.slice(0, 6).map((c) => (
                      <tr key={c.id}>
                        <td>{c.claimant_name}</td>
                        <td className="td-mono">{c.delivery_id}</td>
                        <td className="td-mono">${c.amount_claimed.toFixed(2)}</td>
                        <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                        <td className="td-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Dashboard
