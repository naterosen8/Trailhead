import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { uid } from '../lib/storage'
import { defaultProfile, getProfile, profileFromRow, saveProfile } from '../lib/db'
import { useAuth } from '../lib/AuthContext'
import { CIRCLES, circleLabel } from '../lib/circles'

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    let cancelled = false
    getProfile(user.id)
      .then((row) => {
        if (cancelled) return
        setProfile(profileFromRow(row) || defaultProfile())
      })
      .catch((err) => !cancelled && setLoadError(err.message || 'Could not load your profile.'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [user.id])

  function startEdit() {
    setDraft(profile)
    setSaveError('')
    setEditing(true)
  }

  async function save() {
    setSaving(true)
    setSaveError('')
    try {
      await saveProfile(user.id, draft)
      setProfile(draft)
      setEditing(false)
    } catch (err) {
      setSaveError(err.message || 'Could not save — try again.')
    } finally {
      setSaving(false)
    }
  }

  function updateMarker(id, field, value) {
    setDraft((d) => ({
      ...d,
      markers: d.markers.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    }))
  }

  function addMarker() {
    setDraft((d) => ({
      ...d,
      markers: [...d.markers, { id: uid(), label: '', detail: '' }],
    }))
  }

  function removeMarker(id) {
    setDraft((d) => ({ ...d, markers: d.markers.filter((m) => m.id !== id) }))
  }

  if (loading) {
    return (
      <section className="wrap page">
        <p className="empty-note">Loading your profile…</p>
      </section>
    )
  }

  if (loadError) {
    return (
      <section className="wrap page">
        <p className="form-error" role="alert">{loadError}</p>
      </section>
    )
  }

  const initial = profile.name?.trim()?.[0]?.toUpperCase() || '?'

  if (editing) {
    return (
      <section className="wrap page">
        <div className="sec-head">
          <div>
            <div className="tag">Editing profile</div>
            <h1>Your life dashboard</h1>
          </div>
        </div>
        <form
          className="profile-form"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <label>
            Name
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </label>
          <label>
            Location
            <input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
          </label>
          <div className="two-col">
            <label>
              Streak number
              <input
                type="number"
                value={draft.streakNum}
                onChange={(e) => setDraft({ ...draft, streakNum: Number(e.target.value) })}
              />
            </label>
            <label>
              Streak label
              <input
                value={draft.streakLabel}
                onChange={(e) => setDraft({ ...draft, streakLabel: e.target.value })}
              />
            </label>
          </div>
          <label>
            Where you're headed
            <textarea
              rows={2}
              value={draft.goal}
              onChange={(e) => setDraft({ ...draft, goal: e.target.value })}
            />
          </label>

          <div className="marker-editor">
            <div className="marker-editor-head">
              <span>Markers</span>
              <button type="button" className="btn-ghost" onClick={addMarker}>+ Add marker</button>
            </div>
            {draft.markers.map((m) => (
              <div className="marker-row" key={m.id}>
                <input
                  placeholder="Label"
                  value={m.label}
                  onChange={(e) => updateMarker(m.id, 'label', e.target.value)}
                />
                <input
                  placeholder="Detail"
                  value={m.detail}
                  onChange={(e) => updateMarker(m.id, 'detail', e.target.value)}
                />
                <button type="button" className="btn-remove" onClick={() => removeMarker(m.id)} aria-label="Remove marker">×</button>
              </div>
            ))}
          </div>

          <div className="circle-settings">
            <label>
              Circle
              <select
                value={draft.circle || ''}
                onChange={(e) => setDraft({ ...draft, circle: e.target.value || null })}
              >
                <option value="">No circle</option>
                {CIRCLES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={draft.isPublic}
                onChange={(e) => setDraft({ ...draft, isPublic: e.target.checked })}
              />
              <span>
                Make my profile and build log visible in my circle
                <span className="field-note">
                  Other people in the same circle will see your entries and display name.
                  Everything else about your account stays private. Off by default.
                </span>
              </span>
            </label>
          </div>

          {saveError && <p className="form-error" role="alert">{saveError}</p>}
          <div className="form-actions">
            <button type="button" className="btn-ghost" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </section>
    )
  }

  const steps = [
    { done: profile.name !== 'Your name' && Boolean(profile.name.trim()), label: 'Set your name and where you are' },
    { done: profile.markers.some((m) => m.label?.trim() && m.label !== 'What you do'), label: 'Add a real marker — what you actually do' },
    { done: profile.goal !== 'What you\'re building toward' && Boolean(profile.goal.trim()), label: 'Say where you\'re headed' },
    { done: Boolean(profile.circle), label: 'Join a circle', to: '/app/circles' },
  ]
  const allDone = steps.every((s) => s.done)

  return (
    <section className="wrap page">
      <div className="sec-head">
        <div>
          <div className="tag">Profile</div>
          <h1>Your life dashboard</h1>
        </div>
        <button className="btn-ghost" onClick={startEdit}>Edit</button>
      </div>

      {!allDone && (
        <div className="getting-started">
          <div className="tag">Getting started</div>
          <ul>
            {steps.map((s) => (
              <li key={s.label} className={s.done ? 'done' : ''}>
                <span className="check" aria-hidden="true">{s.done ? '✓' : ''}</span>
                {s.to && !s.done ? <Link to={s.to}>{s.label}</Link> : <span>{s.label}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="profile">
        <div className="profile-id">
          <div className="avatar">{initial}</div>
          <h2>{profile.name}</h2>
          <div className="role">{profile.location}</div>
          <div className="streak">
            <div className="num">{profile.streakNum}</div>
            <div className="cap">{profile.streakLabel}</div>
          </div>
          {profile.circle && (
            <Link to="/app/circles" className="circle-badge">
              {circleLabel(profile.circle)}
              {profile.isPublic ? ' · public' : ' · private'}
            </Link>
          )}
        </div>
        <div>
          <ul className="markers">
            {profile.markers.map((m) => (
              <li key={m.id}>
                <span className="dot" />
                <span>
                  <span className="t">{m.label}</span>{' '}
                  <span className="d">{m.detail ? `— ${m.detail}` : ''}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="goal-line">
            <b>Where you're headed</b>
            {profile.goal}
          </div>
        </div>
      </div>
    </section>
  )
}
