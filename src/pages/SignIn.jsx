import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { supabase, supabaseConfigured } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'

export default function SignIn() {
  const { session, loading } = useAuth()
  const location = useLocation()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) {
    const dest = location.state?.from?.pathname || '/app/profile'
    return <Navigate to={dest} replace />
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    setSubmitting(true)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (!data.session) {
          setNotice('Check your email to confirm your account, then sign in.')
          setMode('signin')
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
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
        </div>
      </header>
      <main>
        <section className="wrap page auth-page">
          <div className="sec-head">
            <div>
              <div className="tag">{mode === 'signin' ? 'Sign in' : 'Create your account'}</div>
              <h1>{mode === 'signin' ? 'Welcome back' : 'Start your trail'}</h1>
            </div>
          </div>

          {!supabaseConfigured && (
            <p className="form-error" role="alert">
              Accounts aren't configured yet — this deployment is missing its Supabase connection.
            </p>
          )}

          <form className="profile-form auth-form" onSubmit={submit}>
            <label>
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!supabaseConfigured}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!supabaseConfigured}
              />
            </label>
            {notice && <p className="form-notice" role="status">{notice}</p>}
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={submitting || !supabaseConfigured}>
                {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </div>
          </form>

          <p className="auth-switch">
            {mode === 'signin' ? (
              <>Don't have an account? <button type="button" onClick={() => { setMode('signup'); setError(''); setNotice('') }}>Create one</button></>
            ) : (
              <>Already have an account? <button type="button" onClick={() => { setMode('signin'); setError(''); setNotice('') }}>Sign in</button></>
            )}
          </p>
        </section>
      </main>
    </>
  )
}
