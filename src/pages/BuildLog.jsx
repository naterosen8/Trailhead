import { useState } from 'react'
import { usePersistentState, uid } from '../lib/storage'
import { computeStreak, daysSinceLastEntry } from '../lib/streak'

const EMPTY_FORM = { title: '', did: '', learned: '', struggled: '', next: '' }

export default function BuildLog() {
  const [entries, setEntries] = usePersistentState('trailhead:logs', [])
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(entries.length === 0)
  const [editingId, setEditingId] = useState(null)
  const [formError, setFormError] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) {
      setFormError('Give the entry a title.')
      return
    }
    if (!form.did.trim()) {
      setFormError("Fill in at least what you did — that's the entry.")
      return
    }
    setFormError('')
    if (editingId) {
      setEntries(entries.map((entry) => (entry.id === editingId ? { ...entry, ...form } : entry)))
    } else {
      const entry = {
        id: uid(),
        week: entries.length + 1,
        date: new Date().toISOString().slice(0, 10),
        ...form,
      }
      setEntries([entry, ...entries])
    }
    closeForm()
  }

  function startEdit(entry) {
    setForm({ title: entry.title, did: entry.did, learned: entry.learned, struggled: entry.struggled, next: entry.next })
    setEditingId(entry.id)
    setShowForm(true)
  }

  function closeForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(false)
    setFormError('')
  }

  function removeEntry(id) {
    if (!window.confirm('Delete this entry? This can\'t be undone.')) return
    setEntries(entries.filter((e) => e.id !== id))
    if (editingId === id) closeForm()
  }

  const streak = computeStreak(entries)
  const daysSince = daysSinceLastEntry(entries)
  const streakAtRisk = daysSince !== null && daysSince >= 7

  return (
    <section className="wrap page">
      <div className="sec-head">
        <div>
          <div className="tag">Build log</div>
          <h1>What you did, not what you performed</h1>
        </div>
        <div className="sec-head-actions">
          {streak > 0 && (
            <div className={`streak-pill${streakAtRisk ? ' at-risk' : ''}`}>
              <span className="num">{streak}</span>
              <span className="cap">{streak === 1 ? 'entry streak' : 'entries in a row'}</span>
            </div>
          )}
          {!showForm && (
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              + New entry
            </button>
          )}
        </div>
      </div>
      {streakAtRisk && (
        <p className="streak-warning">
          It's been {daysSince} days since your last entry — log one soon to keep the streak alive.
        </p>
      )}

      {showForm && (
        <form className="log-form" onSubmit={submit}>
          <label>
            Title
            <input
              placeholder="e.g. Applied to 5 internships"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              autoFocus
            />
          </label>
          <div className="wp-row">
            <span className="k">Did</span>
            <textarea rows={2} value={form.did} onChange={(e) => setForm({ ...form, did: e.target.value })} />
          </div>
          <div className="wp-row">
            <span className="k">Learned</span>
            <textarea rows={2} value={form.learned} onChange={(e) => setForm({ ...form, learned: e.target.value })} />
          </div>
          <div className="wp-row">
            <span className="k">Struggled</span>
            <textarea rows={2} value={form.struggled} onChange={(e) => setForm({ ...form, struggled: e.target.value })} />
          </div>
          <div className="wp-row">
            <span className="k">Next</span>
            <textarea rows={2} value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} />
          </div>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <div className="form-actions">
            {(entries.length > 0 || editingId) && (
              <button type="button" className="btn-ghost" onClick={closeForm}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn-primary">{editingId ? 'Save changes' : 'Post entry'}</button>
          </div>
        </form>
      )}

      {entries.length === 0 && !showForm && (
        <p className="empty-note">No entries yet. Your first one starts the trail.</p>
      )}

      <ul className="waypoints">
        {entries.map((entry, i) => (
          <li className={`waypoint${i === 0 ? ' current' : ''}`} key={entry.id}>
            <span className="pin" />
            <div className="wp-head">
              <span className="wk">Week {String(entry.week).padStart(2, '0')} · {entry.date}</span>
              <h2>{entry.title}</h2>
              <button className="btn-ghost btn-small" onClick={() => startEdit(entry)}>Edit</button>
              <button className="btn-remove" onClick={() => removeEntry(entry.id)} aria-label="Delete entry">×</button>
            </div>
            {(entry.did || entry.learned || entry.struggled || entry.next) && (
              <div className="wp-body">
                {entry.did && <div className="wp-row"><span className="k">Did</span><span className="v">{entry.did}</span></div>}
                {entry.learned && <div className="wp-row"><span className="k">Learned</span><span className="v">{entry.learned}</span></div>}
                {entry.struggled && <div className="wp-row"><span className="k">Struggled</span><span className="v">{entry.struggled}</span></div>}
                {entry.next && <div className="wp-row"><span className="k">Next</span><span className="v">{entry.next}</span></div>}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
