import { useRef, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { exportData, importData } from '../lib/exportImport'

export default function AppShell() {
  const fileInput = useRef(null)
  const toastTimer = useRef(null)
  const [toast, setToast] = useState(null)

  function showToast(message, tone = 'ok') {
    setToast({ message, tone })
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 3200)
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    importData(file)
      .then(() => {
        showToast('Backup restored.')
        window.setTimeout(() => window.location.reload(), 600)
      })
      .catch((err) => showToast(err.message, 'error'))
  }

  return (
    <>
      <header className="kiosk">
        <div className="wrap kiosk-inner">
          <Link to="/" className="wordmark">
            <span className="mark">/</span>Trailhead
          </Link>
          <nav className="kiosk-nav">
            <NavLink to="/app/profile" className={({ isActive }) => (isActive ? 'active' : '')}>
              Profile
            </NavLink>
            <NavLink to="/app/log" className={({ isActive }) => (isActive ? 'active' : '')}>
              Build Log
            </NavLink>
            <span className="kiosk-divider" aria-hidden="true" />
            <button
              onClick={() => {
                try {
                  exportData()
                  showToast('Backup downloaded.')
                } catch {
                  showToast('Could not export — try again.', 'error')
                }
              }}
              title="Download your data as a JSON file"
            >
              Export
            </button>
            <button onClick={() => fileInput.current?.click()} title="Restore from a backup file">Import</button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json"
              onChange={handleImportFile}
              style={{ display: 'none' }}
            />
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      {toast && <div className={`toast toast-${toast.tone}`} role="status">{toast.message}</div>}
    </>
  )
}
