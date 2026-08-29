import { useEffect, useState } from 'react'
import { getProfile, listEntries, profileFromRow } from '../lib/db'
import { computeBadges } from '../lib/badges'
import { useAuth } from '../lib/AuthContext'

const ICONS = {
  'first-entry': <path d="M6 21V4M6 4h12l-3 4 3 4H6" />,
  'profile-complete': <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></>,
  'five-entries': <path d="M4 7h16M4 12h16M4 17h10" />,
  'two-streak': <path d="M12 3c1 3-3 4-3 8a3 3 0 0 0 6 0c0-1-1-2-1-3 2 1 3 3 3 5a5 5 0 0 1-10 0c0-4 3-6 5-10Z" />,
  'four-streak': <path d="M6 9l6-6 6 6M6 16l6-6 6 6" />,
  'twenty-entries': <path d="M8 4h8v4a4 4 0 0 1-8 0V4ZM12 12v4M8 20h8M4 5h4v2a3 3 0 0 1-3 3M20 5h-4v2a3 3 0 0 0 3 3" />,
  'one-month': <path d="M3 5h18v16H3V5ZM3 9h18M8 3v4M16 3v4" />,
}

export default function Badges() {
  const { user } = useAuth()
  const [badges, setBadges] = useState(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([getProfile(user.id), listEntries(user.id)])
      .then(([profileRow, entries]) => {
        if (cancelled) return
        setBadges(computeBadges({ profile: profileFromRow(profileRow), entries, accountCreatedAt: user.created_at }))
      })
      .catch((err) => !cancelled && setLoadError(err.message || 'Could not load your badges.'))
    return () => { cancelled = true }
  }, [user.id, user.created_at])

  if (loadError) {
    return (
      <section className="wrap page">
        <p className="form-error" role="alert">{loadError}</p>
      </section>
    )
  }

  if (!badges) {
    return (
      <section className="wrap page">
        <p className="empty-note">Loading your badges…</p>
      </section>
    )
  }

  const earnedCount = badges.filter((b) => b.earned).length

  return (
    <section className="wrap page">
      <div className="sec-head">
        <div>
          <div className="tag">Badges</div>
          <h1>Earned, not issued</h1>
        </div>
        <p className="sec-note">{earnedCount} of {badges.length} earned</p>
      </div>
      <div className="patches">
        {badges.map((b) => (
          <div className={`patch${b.earned ? '' : ' locked'}`} key={b.id}>
            <div className="patch-shape">
              <svg viewBox="0 0 24 24">{ICONS[b.id]}</svg>
            </div>
            <div className="patch-name">{b.name}</div>
            <div className="patch-sub">{b.earned ? 'Earned' : b.hint}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
