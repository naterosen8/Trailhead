const KEYS = ['trailhead:profile', 'trailhead:logs']

export function exportData() {
  const payload = {
    format: 'trailhead-export',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: Object.fromEntries(
      KEYS.map((key) => [key, JSON.parse(window.localStorage.getItem(key) || 'null')])
    ),
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

export function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        if (parsed.format !== 'trailhead-export' || !parsed.data) {
          throw new Error('Not a Trailhead backup file.')
        }
        for (const key of KEYS) {
          if (key in parsed.data && parsed.data[key] != null) {
            window.localStorage.setItem(key, JSON.stringify(parsed.data[key]))
          }
        }
        resolve()
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Could not parse that file.'))
      }
    }
    reader.readAsText(file)
  })
}
