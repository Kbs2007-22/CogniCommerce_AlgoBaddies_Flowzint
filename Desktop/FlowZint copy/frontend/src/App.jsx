import React, { useState, useEffect, useCallback } from 'react'
import './App.css'

import TopBar        from './components/TopBar.jsx'
import Sidebar       from './components/Sidebar.jsx'
import { useToast, ToastContainer } from './components/Toast.jsx'
import Dashboard     from './components/Dashboard.jsx'
import ClaimsPanel   from './components/ClaimsPanel.jsx'
import RefundPanel   from './components/RefundPanel.jsx'
import AnalyticsPanel from './components/AnalyticsPanel.jsx'
import DeliveryPanel  from './components/DeliveryPanel.jsx'
import { healthApi } from './api/client.js'

const TABS = ['dashboard', 'claims', 'refunds', 'analytics', 'delivery']

function App() {
  const [active, setActive] = useState('dashboard')
  const [backendOnline, setBackendOnline] = useState(false)
  const { toasts, toast } = useToast()

  /* Poll backend health every 15s */
  useEffect(() => {
    let alive = true
    const check = async () => {
      try {
        await healthApi.ping()
        if (alive) setBackendOnline(true)
      } catch {
        if (alive) setBackendOnline(false)
      }
    }
    check()
    const id = setInterval(check, 15_000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  /* Sync active tab when sidebar fires */
  const navigate = useCallback((id) => {
    if (TABS.includes(id)) setActive(id)
  }, [])

  const renderPanel = () => {
    switch (active) {
      case 'dashboard': return <Dashboard   toast={toast} />
      case 'claims':    return <ClaimsPanel toast={toast} />
      case 'refunds':   return <RefundPanel toast={toast} />
      case 'analytics': return <AnalyticsPanel toast={toast} />
      case 'delivery':  return <DeliveryPanel toast={toast} />
      default:          return null
    }
  }

  return (
    <div className="shell">
      <TopBar
        active={active}
        setActive={(id) => { setActive(id); navigate(id) }}
        backendOnline={backendOnline}
      />
      <Sidebar active={active} setActive={navigate} />

      <main className="main" id="main-content" tabIndex={-1}>
        {renderPanel()}
      </main>

      <ToastContainer toasts={toasts} />
    </div>
  )
}

export default App
