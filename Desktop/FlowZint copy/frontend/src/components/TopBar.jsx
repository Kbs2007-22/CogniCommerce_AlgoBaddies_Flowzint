import React from 'react'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'claims',    label: 'Claims' },
  { id: 'refunds',   label: 'Refunds' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'delivery',  label: 'Delivery' },
]

function TopBar({ active, setActive, backendOnline }) {
  return (
    <header className="topbar" role="banner">
      <div className="topbar-brand">
        <span className="topbar-brand-text">FZ</span>
      </div>

      <nav className="topbar-nav" role="navigation" aria-label="Main navigation">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`tnav-${t.id}`}
            className={`tnav-btn${active === t.id ? ' active' : ''}`}
            onClick={() => setActive(t.id)}
            aria-current={active === t.id ? 'page' : undefined}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="topbar-right">
        <span
          className={`status-dot${backendOnline ? '' : ' offline'}`}
          title={backendOnline ? 'Backend online' : 'Backend offline'}
          aria-label={`Backend ${backendOnline ? 'online' : 'offline'}`}
        >
          {backendOnline ? 'API ONLINE' : 'API OFFLINE'}
        </span>
      </div>
    </header>
  )
}

export default TopBar
