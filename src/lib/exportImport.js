import { getProfile, insertEntry, listEntries, profileFromRow, saveProfile } from './db'

export async function exportData(userId) {
  const [profileRow, logs] = await Promise.all([getProfile(userId), listEntries(userId)])
  const payload = {
    format: 'trailhead-export',
    version: 2,
    exportedAt: new Date().toISOString(),
    data: { profile: profileFromRow(profileRow), logs },
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `trailhead-backup-${payload.exportedAt.slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Restoring a backup upserts the profile and appends the backup's log entries
// as new rows — it never deletes existing data, so it's safe to run more than once.
export async function importData(file, userId) {
  const text = await file.text()
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  if (parsed.format !== 'trailhead-export' || !parsed.data) {
    throw new Error('Not a Trailhead backup file.')
  }

  if (parsed.data.profile) {
    await saveProfile(userId, parsed.data.profile)
  }

  const logs = Array.isArray(parsed.data.logs) ? parsed.data.logs : []
  const existing = await listEntries(userId)
  let week = existing.length
  for (const entry of logs) {
    week += 1
    await insertEntry(userId, { ...entry, week, date: entry.date || new Date().toISOString().slice(0, 10) })
  }
  return { restoredEntries: logs.length }
}
