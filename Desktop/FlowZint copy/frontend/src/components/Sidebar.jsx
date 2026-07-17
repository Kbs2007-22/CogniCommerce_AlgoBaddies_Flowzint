import React from 'react'

const ITEMS = [
  { id: 'dashboard', icon: '⊞', label: 'Dashboard' },
  { id: 'claims',    icon: '◈', label: 'Claims' },
  { id: 'refunds',   icon: '↩', label: 'Refunds' },
  { id: 'analytics', icon: '◉', label: 'Analytics' },
  { id: 'delivery',  icon: '⬡', label: 'Delivery' },
]

function Sidebar({ active, setActive }) {
  return (
    <aside className="sidebar" role="complementary" aria-label="Panel navigation">
      {ITEMS.map((item, i) => (
        <React.Fragment key={item.id}>
          {i === 4 && <div className="sb-divider" role="separator" />}
          <button
            id={`sb-${item.id}`}
            className={`sb-btn${active === item.id ? ' active' : ''}`}
            onClick={() => setActive(item.id)}
            aria-label={item.label}
            aria-pressed={active === item.id}
            title={item.label}
          >
            <span aria-hidden="true">{item.icon}</span>
          </button>
        </React.Fragment>
      ))}
    </aside>
  )
}

export default Sidebar
