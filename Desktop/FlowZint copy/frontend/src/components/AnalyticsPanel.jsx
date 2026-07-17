import React, { useState, useCallback, useEffect, useRef } from 'react'
import { analyticsApi } from '../api/client.js'

/* Colour palette for clusters — cycle if >8 */
const CLUSTER_COLOURS = [
  'var(--accent)', 'var(--violet)', 'var(--green)',
  'var(--amber)', '#ff6b9d', '#00ffa3',
  '#ffdd00', '#ff8c42',
]
const NOISE_COLOUR = '#344d63'

/* ── Mini PCA scatter plot (pure CSS positioning) ────── */
function ScatterPlot({ points }) {
  if (!points || points.length === 0) return null

  const xs  = points.map((p) => p.x)
  const ys  = points.map((p) => p.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1

  /* Normalise to 5%–95% of plot area */
  const nx = (v) => 5 + ((v - minX) / rangeX) * 90
  const ny = (v) => 95 - ((v - minY) / rangeY) * 90

  const clusters = [...new Set(points.map((p) => p.cluster).filter((c) => c !== -1))]

  return (
    <div>
      <div className="cluster-plot" aria-label="PCA scatter plot of defect embeddings" role="img">
        {points.map((p, i) => {
          const colour =
            p.cluster === -1
              ? NOISE_COLOUR
              : CLUSTER_COLOURS[p.cluster % CLUSTER_COLOURS.length]
          return (
            <div
              key={i}
              className="plot-dot"
              style={{
                left: `${nx(p.x)}%`,
                top: `${ny(p.y)}%`,
                background: colour,
                boxShadow: `0 0 8px ${colour}`,
                zIndex: 2,
              }}
              title={`${p.name} | Batch: ${p.batch_id} | Cluster: ${p.cluster === -1 ? 'Noise' : p.cluster}`}
            />
          )
        })}
        {/* Axis labels */}
        <span style={{ position:'absolute', bottom:6, left:'50%', transform:'translateX(-50%)', fontFamily:'var(--f-mono)', fontSize:10, color:'var(--txt-muted)' }}>PCA DIM 1</span>
        <span style={{ position:'absolute', top:'50%', left:6, transform:'rotate(-90deg) translateX(-50%)', fontFamily:'var(--f-mono)', fontSize:10, color:'var(--txt-muted)' }}>DIM 2</span>
      </div>

      {/* Legend */}
      <div className="plot-legend">
        {clusters.map((c) => (
          <div key={c} className="legend-item">
            <div className="legend-dot" style={{ background: CLUSTER_COLOURS[c % CLUSTER_COLOURS.length], boxShadow: `0 0 5px ${CLUSTER_COLOURS[c % CLUSTER_COLOURS.length]}` }} />
            Cluster {c}
          </div>
        ))}
        <div className="legend-item">
          <div className="legend-dot" style={{ background: NOISE_COLOUR }} />
          Noise / Outlier
        </div>
      </div>
    </div>
  )
}

function AnalyticsPanel({ toast }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: d } = await analyticsApi.status()
      setData(d)
      setFetched(true)
      toast('Analytics data refreshed.', 'accent')
    } catch (err) {
      toast(err.response?.data?.detail || 'Analytics fetch failed — is the backend running?', 'red')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  const summaries = data?.summaries ? Object.entries(data.summaries) : []
  const topOffender = data?.system_top_offender

  return (
    <div>
      <div className="section-head">Defect Cluster Analytics</div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <button id="analytics-refresh" className="btn btn-accent" onClick={load} disabled={loading}>
          {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Loading…</> : '◉ Refresh Analysis'}
        </button>
        {fetched && (
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--txt-sub)' }}>
            {data?.plot_data?.length || 0} embeddings clustered
          </span>
        )}
      </div>

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Top Offender highlight */}
          {topOffender && (
            <div className="panel" style={{ borderColor: 'var(--red)', boxShadow: '0 0 20px var(--red-glow)' }}>
              <div style={{ fontFamily: 'var(--f-label)', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: 12 }}>
                ⚠ Top Offending Batch
              </div>
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                {[
                  ['Worst Batch', topOffender.worst_batch_id, 'var(--red)'],
                  ['Cluster ID',  `#${topOffender.cluster_id}`, 'var(--amber)'],
                  ['Cluster Size', topOffender.cluster_size, 'var(--red)'],
                ].map(([lbl, val, c]) => (
                  <div key={lbl}>
                    <div style={{ fontFamily: 'var(--f-label)', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--txt-sub)', marginBottom: 4 }}>{lbl}</div>
                    <div style={{ fontFamily: lbl === 'Worst Batch' ? 'var(--f-display)' : 'var(--f-mono)', fontSize: 24, color: c, letterSpacing: '.04em' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PCA Scatter */}
          <div className="panel">
            <div style={{ fontFamily: 'var(--f-label)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--txt-sub)', marginBottom: 14 }}>
              PCA 2D Embedding Visualisation (DBSCAN)
            </div>
            <ScatterPlot points={data.plot_data} />
          </div>

          {/* Cluster summaries */}
          {summaries.length > 0 && (
            <div className="panel">
              <div style={{ fontFamily: 'var(--f-label)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--txt-sub)', marginBottom: 14 }}>
                Cluster Summaries
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Cluster ID</th>
                      <th>Top Batch</th>
                      <th>Defect Count</th>
                      <th>Total Cluster Size</th>
                      <th>Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaries.map(([id, s]) => {
                      const isTop = topOffender && topOffender.cluster_id === parseInt(id)
                      return (
                        <tr key={id} style={isTop ? { background: 'var(--red-dim)' } : {}}>
                          <td className="td-mono">
                            <span style={{ color: CLUSTER_COLOURS[parseInt(id) % CLUSTER_COLOURS.length] }}>#{id}</span>
                          </td>
                          <td className="td-mono">{s.top_batch_id}</td>
                          <td className="td-mono">{s.defect_count}</td>
                          <td className="td-mono">{s.total_cluster_size}</td>
                          <td>
                            {isTop
                              ? <span className="badge badge-rejected">⚠ Highest Risk</span>
                              : <span className="badge badge-open">Normal</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Raw data */}
          <div className="panel">
            <div style={{ fontFamily: 'var(--f-label)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--txt-sub)', marginBottom: 14 }}>
              Embedding Index
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Image</th><th>Batch ID</th><th>Cluster</th><th>X</th><th>Y</th></tr>
                </thead>
                <tbody>
                  {data.plot_data.map((p, i) => (
                    <tr key={i}>
                      <td className="td-mono">{p.name}</td>
                      <td className="td-mono">{p.batch_id}</td>
                      <td>
                        <span style={{ color: p.cluster === -1 ? 'var(--txt-muted)' : CLUSTER_COLOURS[p.cluster % CLUSTER_COLOURS.length], fontFamily: 'var(--f-mono)', fontSize: 12 }}>
                          {p.cluster === -1 ? 'Noise' : `#${p.cluster}`}
                        </span>
                      </td>
                      <td className="td-mono">{p.x.toFixed(4)}</td>
                      <td className="td-mono">{p.y.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">◉</div>
          <p>Click Refresh Analysis to load cluster data.</p>
        </div>
      )}
    </div>
  )
}

export default AnalyticsPanel
