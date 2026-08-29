import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabaseClient'

export default function StatsStrip() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (!supabaseConfigured) return
    let cancelled = false
    supabase
      .rpc('trailhead_stats')
      .then(({ data, error }) => {
        if (cancelled || error || !data?.[0]) return
        setStats(data[0])
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  if (!stats) return null

  const people = Number(stats.total_people)
  const entries = Number(stats.total_entries)

  return (
    <p className="stats-strip">
      <span className="num">{people}</span> {people === 1 ? 'person' : 'people'} building in the open
      <span className="sep">·</span>
      <span className="num">{entries}</span> {entries === 1 ? 'entry' : 'entries'} logged
    </p>
  )
}
