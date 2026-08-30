const WEEKS = 16

function buildCells(entries) {
  const counts = {}
  for (const e of entries) counts[e.date] = (counts[e.date] || 0) + 1

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const totalDays = WEEKS * 7
  const start = new Date(today)
  start.setDate(start.getDate() - (totalDays - 1))
  const startDow = start.getDay()
  start.setDate(start.getDate() - startDow)

  const cells = []
  const dayCount = totalDays + startDow
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    cells.push({ date: key, count: counts[key] || 0, future: d > today })
  }
  return cells
}

function levelFor(count) {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  return 3
}

export default function ContributionGrid({ entries }) {
  const cells = buildCells(entries)
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  return (
    <div className="contribution-grid" role="img" aria-label={`Activity over the last ${WEEKS} weeks`}>
      {weeks.map((week, wi) => (
        <div className="contribution-col" key={wi}>
          {week.map((cell) => (
            <div
              key={cell.date}
              className={`contribution-cell level-${levelFor(cell.count)}${cell.future ? ' future' : ''}`}
              title={cell.future ? undefined : `${cell.date}: ${cell.count} ${cell.count === 1 ? 'entry' : 'entries'}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
