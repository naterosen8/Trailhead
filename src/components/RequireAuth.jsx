import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabaseConfigured } from '../lib/supabaseClient'

function BareShell({ children }) {
  return (
    <>
      <header className="kiosk">
        <div className="wrap kiosk-inner">
          <Link to="/" className="wordmark">
            <span className="mark">/</span>Trailhead
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </>
  )
}

export default function RequireAuth() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (!supabaseConfigured) {
    return (
      <BareShell>
        <section className="wrap page">
          <div className="tag">Setup needed</div>
          <h1>Accounts aren't connected yet</h1>
          <p className="sec-note">
            This deployment is missing its Supabase connection, so there's nowhere to sign in to yet.
          </p>
        </section>
      </BareShell>
    )
  }

  if (loading) {
    return (
      <BareShell>
        <section className="wrap page">
          <p className="empty-note">Loading…</p>
        </section>
      </BareShell>
    )
  }

  if (!session) {
    return <Navigate to="/signin" state={{ from: location }} replace />
  }

  return <Outlet />
}
