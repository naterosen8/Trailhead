// A posting streak is real signal — consecutive entries logged roughly
// weekly, counted backward from the most recent. A gap over 9 days breaks it.
const MAX_GAP_DAYS = 9

export function computeStreak(entries) {
  if (entries.length === 0) return 0
  const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date))
  let streak = 1
  for (let i = 0; i < sorted.length - 1; i++) {
    const gapDays = (new Date(sorted[i].date) - new Date(sorted[i + 1].date)) / 86400000
    if (gapDays <= MAX_GAP_DAYS) streak++
    else break
  }
  return streak
}

export function daysSinceLastEntry(entries) {
  if (entries.length === 0) return null
  const latest = entries.reduce((max, e) => (new Date(e.date) > new Date(max.date) ? e : max), entries[0])
  return Math.floor((Date.now() - new Date(latest.date)) / 86400000)
}
