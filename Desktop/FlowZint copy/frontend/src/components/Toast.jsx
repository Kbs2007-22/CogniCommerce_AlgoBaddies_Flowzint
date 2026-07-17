import React, { useCallback, useRef } from 'react'

let _id = 0

/**
 * useToast() — returns { toasts, toast }
 * toast(msg, variant) — shows a self-dismissing notification
 * variant: 'accent' | 'green' | 'red' | 'violet'
 */
export function useToast() {
  const [toasts, setToasts] = React.useState([])

  const dismiss = useCallback((id) => {
    setToasts((p) => p.map((t) => (t.id === id ? { ...t, out: true } : t)))
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 320)
  }, [])

  const toast = useCallback((msg, variant = 'accent') => {
    const id = ++_id
    setToasts((p) => [...p, { id, msg, variant }])
    setTimeout(() => dismiss(id), 2800)
  }, [dismiss])

  return { toasts, toast }
}

export function ToastContainer({ toasts }) {
  return (
    <div
      className="toast-wrap"
      role="status"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <div key={t.id} className={`toast${t.out ? ' out' : ''}`} role="alert">
          <span className={`toast-pip ${t.variant}`} aria-hidden="true" />
          {t.msg}
        </div>
      ))}
    </div>
  )
}
