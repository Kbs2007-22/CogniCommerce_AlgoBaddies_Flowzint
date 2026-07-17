/**
 * api/client.js — Axios instance + typed API wrappers for all 4 backend modules
 * All routes are proxied by Vite (vite.config.js) → http://localhost:8000
 */
import axios from 'axios'

const http = axios.create({ timeout: 12_000 })

/* ── Claims ──────────────────────────────────────────── */
export const claimsApi = {
  list:   (params = {}) => http.get('/claims/', { params }),
  get:    (id)          => http.get(`/claims/${id}`),
  create: (body)        => http.post('/claims/', body),
  updateStatus: (id, status) =>
    http.patch(`/claims/${id}/status`, { status }),
  remove: (id)          => http.delete(`/claims/${id}`),
}

/* ── Refunds ─────────────────────────────────────────── */
export const refundsApi = {
  evaluate: (body) => http.post('/refunds/evaluate', body),
}

/* ── Analytics ───────────────────────────────────────── */
export const analyticsApi = {
  status: () => http.get('/api/analytics/status'),
}

/* ── Delivery ────────────────────────────────────────── */
export const deliveryApi = {
  verifyLocation: (body) => http.post('/api/delivery/verify-location', body),
}

/* ── Health check ────────────────────────────────────── */
export const healthApi = {
  ping: () => http.get('/'),
}
