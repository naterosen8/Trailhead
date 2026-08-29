import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'
import ThemeToggle from '../components/ThemeToggle'

export default function ResetPassword() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      setTimeout(() => navigate('/app/profile'), 1200)
    } catch (err) {
      setError(err.message || 'Could not update your password — try the reset link again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <header className="kiosk">
        <div className="wrap kiosk-inner">
          <Link to="/" className="wordmark">
            <span className="mark">/</span>Trailhead
          </Link>
          <nav className="kiosk-nav">
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main>
        <section className="wrap page auth-page">
          <div className="sec-head">
            <div>
              <div className="tag">Reset password</div>
              <h1>Set a new password</h1>
            </div>
          </div>

          {loading ? (
            <p className="empty-note">Checking your link…</p>
          ) : !session ? (
            <p className="form-error" role="alert">
              This link is invalid or has expired. <Link to="/signin">Request a new one</Link>.
            </p>
          ) : done ? (
            <p className="form-notice" role="status">Password updated. Taking you to your dashboard…</p>
          ) : (
            <form className="profile-form auth-form" onSubmit={submit}>
              <label>
                New password
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : 'Save new password'}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
    </>
  )
}
