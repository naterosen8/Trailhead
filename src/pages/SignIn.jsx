import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { supabase, supabaseConfigured } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'
import ThemeToggle from '../components/ThemeToggle'

const TITLES = {
  signin: { tag: 'Sign in', heading: 'Welcome back' },
  signup: { tag: 'Create your account', heading: 'Start your trail' },
  reset: { tag: 'Reset password', heading: "We'll email you a link" },
}

export default function SignIn() {
  const { session, loading } = useAuth()
  const location = useLocation()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) {
    const dest = location.state?.from?.pathname || '/app/profile'
    return <Navigate to={dest} replace />
  }

  function switchMode(next) {
    setMode(next)
    setError('')
    setNotice('')
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
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (!data.session) {
          setNotice('Check your email to confirm your account, then sign in.')
          setMode('signin')
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setNotice('If that email has an account, a reset link is on its way.')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  const { tag, heading } = TITLES[mode]

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
              <div className="tag">{tag}</div>
              <h1>{heading}</h1>
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
            {mode !== 'reset' && (
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
            )}
            {mode === 'signin' && (
              <button type="button" className="auth-forgot" onClick={() => switchMode('reset')}>
                Forgot password?
              </button>
            )}
            {notice && <p className="form-notice" role="status">{notice}</p>}
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={submitting || !supabaseConfigured}>
                {submitting
                  ? 'Please wait…'
                  : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
              </button>
            </div>
          </form>

          <p className="auth-switch">
            {mode === 'signin' && (
              <>Don't have an account? <button type="button" onClick={() => switchMode('signup')}>Create one</button></>
            )}
            {mode === 'signup' && (
              <>Already have an account? <button type="button" onClick={() => switchMode('signin')}>Sign in</button></>
            )}
            {mode === 'reset' && (
              <>Remembered it? <button type="button" onClick={() => switchMode('signin')}>Back to sign in</button></>
            )}
          </p>
        </section>
      </main>
    </>
  )
}
