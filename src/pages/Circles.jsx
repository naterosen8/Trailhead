import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { addCheer, defaultProfile, getCircleFeed, getCircleMemberCounts, getProfile, profileFromRow, removeCheer, saveProfile } from '../lib/db'
import { useAuth } from '../lib/AuthContext'
import { CIRCLES, circleLabel } from '../lib/circles'

export default function Circles() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [counts, setCounts] = useState({})
  const [feed, setFeed] = useState(null)
  const [loading, setLoading] = useState(true)
  const [feedLoading, setFeedLoading] = useState(false)
  const [error, setError] = useState('')
  const [switching, setSwitching] = useState(false)

  const loadFeed = useCallback((circle) => {
    if (!circle) return
    setFeedLoading(true)
    getCircleFeed(circle)
      .then(setFeed)
      .catch((err) => setError(err.message || 'Could not load the circle feed.'))
      .finally(() => setFeedLoading(false))
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all([getProfile(user.id), getCircleMemberCounts()])
      .then(([row, memberCounts]) => {
        if (cancelled) return
        const p = profileFromRow(row)
        setProfile(p)
        setCounts(memberCounts)
        if (p?.circle) loadFeed(p.circle)
      })
      .catch((err) => !cancelled && setError(err.message || 'Could not load Circles.'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [user.id, loadFeed])

  async function joinCircle(circleId) {
    setSwitching(true)
    setError('')
    try {
      const nextProfile = { ...(profile || defaultProfile()), circle: circleId }
      await saveProfile(user.id, nextProfile)
      setProfile(nextProfile)
      loadFeed(circleId)
    } catch (err) {
      setError(err.message || 'Could not join that circle — try again.')
    } finally {
      setSwitching(false)
    }
  }

  async function enablePublic() {
    setSwitching(true)
    setError('')
    try {
      const nextProfile = { ...profile, isPublic: true }
      await saveProfile(user.id, nextProfile)
      setProfile(nextProfile)
      loadFeed(nextProfile.circle)
    } catch (err) {
      setError(err.message || 'Could not update your setting — try again.')
    } finally {
      setSwitching(false)
    }
  }

  async function toggleCheer(entry) {
    setFeed((current) => current.map((e) => (
      e.id === entry.id
        ? { ...e, cheeredByMe: !e.cheeredByMe, cheerCount: e.cheerCount + (e.cheeredByMe ? -1 : 1) }
        : e
    )))
    try {
      if (entry.cheeredByMe) await removeCheer(entry.id, user.id)
      else await addCheer(entry.id, user.id)
    } catch (err) {
      // roll back on failure
      setFeed((current) => current.map((e) => (
        e.id === entry.id
          ? { ...e, cheeredByMe: entry.cheeredByMe, cheerCount: entry.cheerCount }
          : e
      )))
      setError(err.message || 'Could not update that reaction — try again.')
    }
  }

  if (loading) {
    return (
      <section className="wrap page">
        <p className="empty-note">Loading Circles…</p>
      </section>
    )
  }

  return (
    <section className="wrap page">
      <div className="sec-head">
        <div>
          <div className="tag">Circles</div>
          <h1>Belonging before followers</h1>
        </div>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      {!profile?.circle ? (
        <>
          <p className="sec-note circle-intro">
            Pick one circle. You'll see public entries from people building the same kind of thing —
            and if you turn on visibility for your own profile, they'll see yours too.
          </p>
          <div className="circles-grid">
            {CIRCLES.map((c) => (
              <button
                key={c.id}
                className="circle-card circle-card-pick"
                onClick={() => joinCircle(c.id)}
                disabled={switching}
              >
                <div className="circle-title">{c.label}</div>
                <div className="members">{counts[c.id] || 0} public {counts[c.id] === 1 ? 'member' : 'members'}</div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="circle-status">
            <div>
              <span className="tag">Your circle</span>
              <h2>{circleLabel(profile.circle)}</h2>
            </div>
            <label className="circle-switch">
              Switch circle
              <select value={profile.circle} onChange={(e) => joinCircle(e.target.value)} disabled={switching}>
                {CIRCLES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </label>
          </div>

          {!profile.isPublic && (
            <div className="demo-banner circle-privacy-prompt">
              Your profile is private, so your entries aren't showing up here for anyone else — and you're
              seeing only what others have made public.{' '}
              <button type="button" className="link-button" onClick={enablePublic} disabled={switching}>
                Make my profile visible in this circle
              </button>
              {' '}or <Link to="/app/profile">edit it later from your profile</Link>.
            </div>
          )}

          <div className="sec-head circle-feed-head">
            <div>
              <div className="tag">Feed</div>
              <h2>What people are building</h2>
            </div>
            <button className="btn-ghost" onClick={() => loadFeed(profile.circle)} disabled={feedLoading}>
              {feedLoading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {feedLoading && !feed && <p className="empty-note">Loading the feed…</p>}
          {feed && feed.length === 0 && (
            <p className="empty-note">No public entries in this circle yet — be the first.</p>
          )}
          {feed && feed.length > 0 && (
            <ul className="waypoints circle-feed">
              {feed.map((entry) => (
                <li className="waypoint" key={entry.id}>
                  <span className="pin" />
                  <div className="wp-head">
                    <span className="wk">{entry.authorName} · {entry.date}</span>
                    <h3>{entry.title}</h3>
                  </div>
                  <div className="wp-body">
                    {entry.did && <div className="wp-row"><span className="k">Did</span><span className="v">{entry.did}</span></div>}
                    {entry.learned && <div className="wp-row"><span className="k">Learned</span><span className="v">{entry.learned}</span></div>}
                    {entry.struggled && <div className="wp-row"><span className="k">Struggled</span><span className="v">{entry.struggled}</span></div>}
                    {entry.next && <div className="wp-row"><span className="k">Next</span><span className="v">{entry.next}</span></div>}
                  </div>
                  <button
                    className={`cheer-btn${entry.cheeredByMe ? ' cheered' : ''}`}
                    onClick={() => toggleCheer(entry)}
                  >
                    <svg viewBox="0 0 24 24"><path d="M12 3c1 3-3 4-3 8a3 3 0 0 0 6 0c0-1-1-2-1-3 2 1 3 3 3 5a5 5 0 0 1-10 0c0-4 3-6 5-10Z" /></svg>
                    {entry.cheerCount > 0 ? entry.cheerCount : ''} Cheer{entry.cheerCount === 1 ? '' : 's'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
