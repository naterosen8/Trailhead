import { useEffect, useState } from 'react'
import { uid } from '../lib/storage'
import { getProfile, profileFromRow, saveProfile } from '../lib/db'
import { useAuth } from '../lib/AuthContext'

const DEFAULT_PROFILE = {
  name: 'Your name',
  location: 'Where you are',
  streakLabel: 'day streak',
  streakNum: 0,
  goal: 'What you\'re building toward',
  markers: [
    { id: uid(), label: 'What you do', detail: 'Add a short detail' },
  ],
}

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
        setProfile(profileFromRow(row) || DEFAULT_PROFILE)
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

          {saveError && <p className="form-error" role="alert">{saveError}</p>}
          <div className="form-actions">
            <button type="button" className="btn-ghost" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </section>
    )
  }

  return (
    <section className="wrap page">
      <div className="sec-head">
        <div>
          <div className="tag">Profile</div>
          <h1>Your life dashboard</h1>
        </div>
        <button className="btn-ghost" onClick={startEdit}>Edit</button>
      </div>

      <div className="profile">
        <div className="profile-id">
          <div className="avatar">{initial}</div>
          <h2>{profile.name}</h2>
          <div className="role">{profile.location}</div>
          <div className="streak">
            <div className="num">{profile.streakNum}</div>
            <div className="cap">{profile.streakLabel}</div>
          </div>
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
