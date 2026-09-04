import { useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { exportData, importData } from '../lib/exportImport'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'
import ThemeToggle from './ThemeToggle'

export default function AppShell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInput = useRef(null)
  const toastTimer = useRef(null)
  const [toast, setToast] = useState(null)
  const [busy, setBusy] = useState(false)

  function showToast(message, tone = 'ok') {
    setToast({ message, tone })
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 3200)
  }

  async function handleExport() {
    setBusy(true)
    try {
      await exportData(user.id)
      showToast('Backup downloaded.')
    } catch (err) {
      showToast(err.message || 'Could not export — try again.', 'error')
    } finally {
      setBusy(false)
    }
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    importData(file, user.id)
      .then(({ restoredEntries }) => {
        showToast(`Backup restored — added ${restoredEntries} entr${restoredEntries === 1 ? 'y' : 'ies'}.`)
        window.setTimeout(() => window.location.reload(), 900)
      })
      .catch((err) => showToast(err.message || 'Could not import that file.', 'error'))
      .finally(() => setBusy(false))
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
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
            <NavLink to="/app/badges" className={({ isActive }) => (isActive ? 'active' : '')}>
              Badges
            </NavLink>
            <NavLink to="/app/circles" className={({ isActive }) => (isActive ? 'active' : '')}>
              Circles
            </NavLink>
            <NavLink to="/app/partners" className={({ isActive }) => (isActive ? 'active' : '')}>
              Partners
            </NavLink>
            <span className="kiosk-divider" aria-hidden="true" />
            <button onClick={handleExport} disabled={busy} title="Download your data as a JSON file">Export</button>
            <button onClick={() => fileInput.current?.click()} disabled={busy} title="Restore from a backup file">Import</button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json"
              onChange={handleImportFile}
              style={{ display: 'none' }}
            />
            <span className="kiosk-divider" aria-hidden="true" />
            <ThemeToggle />
            <span className="kiosk-email" title={user.email}>{user.email}</span>
            <button onClick={handleSignOut}>Sign out</button>
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
