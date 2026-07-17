import React, { useState } from 'react'
import { deliveryApi } from '../api/client.js'

/* Preset locations for easy testing */
const PRESETS = [
  {
    label: 'Same location (verified ✓)',
    user: { lat: 28.6139, lon: 77.2090 },
    delivery: { lat: 28.6139, lon: 77.2090 },
  },
  {
    label: '~50m apart (verified ✓)',
    user: { lat: 28.6139, lon: 77.2090 },
    delivery: { lat: 28.6143, lon: 77.2091 },
  },
  {
    label: '~5km apart (flagged ✗)',
    user: { lat: 28.6139, lon: 77.2090 },
    delivery: { lat: 28.6600, lon: 77.2300 },
  },
  {
    label: 'Different city (flagged ✗)',
    user: { lat: 28.6139, lon: 77.2090 },
    delivery: { lat: 19.0760, lon: 72.8777 },
  },
]

function MapPreview({ userLat, userLon, dlLat, dlLon, result }) {
  /* Simple visual distance arc — not a real map */
  const isVerified = result?.status === 'verified'
  const colour = result
    ? (isVerified ? 'var(--green)' : 'var(--red)')
    : 'var(--border-strong)'

  return (
    <div
      role="img"
      aria-label="Delivery location visual preview"
      style={{
        background: 'var(--bg-alt)',
        border: `1px solid ${colour}`,
        borderRadius: 2,
        padding: 20,
        minHeight: 160,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        transition: 'border-color .3s',
        boxShadow: result ? `0 0 20px ${isVerified ? 'var(--green-glow)' : 'var(--red-glow)'}` : 'none',
      }}
    >
      <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
        {/* User marker */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, lineHeight: 1 }}>👤</div>
          <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--txt-sub)', marginTop: 6 }}>
            {Number(userLat).toFixed(4)}, {Number(userLon).toFixed(4)}
          </div>
          <div style={{ fontFamily: 'var(--f-label)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--accent)', marginTop: 2 }}>User</div>
        </div>

        {/* Line */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 60, height: 2, background: colour, boxShadow: `0 0 6px ${colour}`, borderRadius: 1 }} />
          {result && (
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: colour }}>
              {result.distance_difference_meters}m
            </div>
          )}
        </div>

        {/* Delivery marker */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, lineHeight: 1 }}>📦</div>
          <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--txt-sub)', marginTop: 6 }}>
            {Number(dlLat).toFixed(4)}, {Number(dlLon).toFixed(4)}
          </div>
          <div style={{ fontFamily: 'var(--f-label)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--violet)', marginTop: 2 }}>Drop-off</div>
        </div>
      </div>

      {result && (
        <div style={{
          fontFamily: 'var(--f-display)', fontSize: 13, letterSpacing: '.06em',
          color: colour, marginTop: 4,
        }}>
          {isVerified ? '✓ LOCATION VERIFIED' : '✗ MISMATCH FLAGGED'}
        </div>
      )}
    </div>
  )
}

function DeliveryPanel({ toast }) {
  const [form, setForm] = useState({
    ticket_id: '1001',
    user_lat: '28.6139',
    user_lon: '77.2090',
    mock_delivery_lat: '28.6139',
    mock_delivery_lon: '77.2090',
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  function applyPreset(preset) {
    setForm((p) => ({
      ...p,
      user_lat: String(preset.user.lat),
      user_lon: String(preset.user.lon),
      mock_delivery_lat: String(preset.delivery.lat),
      mock_delivery_lon: String(preset.delivery.lon),
    }))
    setResult(null)
  }

  async function submit(e) {
    e.preventDefault()
    const parsed = {
      ticket_id: parseInt(form.ticket_id),
      user_lat: parseFloat(form.user_lat),
      user_lon: parseFloat(form.user_lon),
      mock_delivery_lat: parseFloat(form.mock_delivery_lat),
      mock_delivery_lon: parseFloat(form.mock_delivery_lon),
    }
    if (Object.values(parsed).some(isNaN)) {
      toast('All fields must be valid numbers.', 'red'); return
    }
    setLoading(true); setResult(null)
    try {
      const { data } = await deliveryApi.verifyLocation(parsed)
      setResult(data)
      toast(data.status === 'verified' ? 'Location verified ✓' : 'Location mismatch flagged ✗',
            data.status === 'verified' ? 'green' : 'red')
    } catch (err) {
      toast(err.response?.data?.detail || 'Verification failed — check backend.', 'red')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="section-head">Delivery Location Verifier</div>

      {/* Preset buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {PRESETS.map((p, i) => (
          <button
            key={i}
            id={`dlv-preset-${i}`}
            className="btn btn-ghost"
            style={{ fontSize: 12 }}
            onClick={() => applyPreset(p)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px,1fr))', gap: 20 }}>
        {/* Form */}
        <div className="panel">
          <div style={{ fontFamily: 'var(--f-label)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--txt-sub)', marginBottom: 16 }}>
            Coordinates Input
          </div>
          <form onSubmit={submit} noValidate>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="field" style={{ gridColumn: '1/-1' }}>
                <label className="field-label" htmlFor="dlv-ticket">Ticket ID</label>
                <input id="dlv-ticket" className="input" type="number" value={form.ticket_id} onChange={set('ticket_id')} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="dlv-ulat">User Latitude</label>
                <input id="dlv-ulat" className="input" step="any" value={form.user_lat} onChange={set('user_lat')} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="dlv-ulon">User Longitude</label>
                <input id="dlv-ulon" className="input" step="any" value={form.user_lon} onChange={set('user_lon')} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="dlv-dlat">Drop-off Latitude</label>
                <input id="dlv-dlat" className="input" step="any" value={form.mock_delivery_lat} onChange={set('mock_delivery_lat')} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="dlv-dlon">Drop-off Longitude</label>
                <input id="dlv-dlon" className="input" step="any" value={form.mock_delivery_lon} onChange={set('mock_delivery_lon')} />
              </div>
            </div>
            <div className="form-actions">
              <button id="dlv-submit" type="submit" className="btn btn-accent" disabled={loading}>
                {loading
                  ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Verifying…</>
                  : '⬡ Verify Location'}
              </button>
            </div>
          </form>
        </div>

        {/* Visual + Result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <MapPreview
            userLat={form.user_lat} userLon={form.user_lon}
            dlLat={form.mock_delivery_lat} dlLon={form.mock_delivery_lon}
            result={result}
          />

          {result && (
            <div className="result-card" style={{
              borderColor: result.status === 'verified' ? 'var(--green)' : 'var(--red)',
            }}>
              <div className="result-label">Engine Decision</div>
              <div className="result-decision" style={{
                color: result.status === 'verified' ? 'var(--green)' : 'var(--red)',
              }}>
                {result.status === 'verified' ? '✓' : '✗'} {result.resolution}
              </div>
              <div className="result-text">{result.message}</div>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--txt-sub)', marginTop: 4 }}>
                Distance: <span style={{ color: 'var(--txt)' }}>{result.distance_difference_meters}m</span>
                &nbsp;·&nbsp; Ticket: <span style={{ color: 'var(--txt)' }}>#{result.ticket_id}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DeliveryPanel
