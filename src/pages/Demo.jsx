import { Link } from 'react-router-dom'

const MARKERS = [
  { label: 'UCSB', detail: 'Communication student' },
  { label: 'Regenerative farm', detail: 'weekend volunteer' },
  { label: 'Investing', detail: "teaching himself, six months in" },
  { label: 'Gym', detail: '180 days consistent, tracked openly' },
]

const ENTRIES = [
  {
    week: '01', date: '2026-06-08', title: 'Started applying',
    did: 'Rebuilt my resume, applied to 2 internships.',
    learned: 'Most of my bullet points said tasks, not results.',
    struggled: "Didn't know who to ask for a referral.",
    next: 'Rewrite resume around outcomes.',
  },
  {
    week: '06', date: '2026-07-13', title: 'Found the actual bottleneck',
    did: 'Sent 14 applications, 0 replies.',
    learned: "Cold applying alone doesn't work — need to reach a person first.",
    struggled: 'Cold emailing feels like bothering people.',
    next: 'Send 5 cold emails, not 15 applications.',
  },
  {
    week: '12', date: '2026-08-24', title: 'Applied to 5 internships',
    did: 'Applied to 5, cold-emailed 3 alumni first.',
    learned: 'A warm line at the top gets replies.',
    struggled: 'Still procrastinating the first email of each batch.',
    next: '3 applications a week, sent Monday morning.',
    current: true,
  },
]

export default function Demo() {
  return (
    <>
      <header className="kiosk">
        <div className="wrap kiosk-inner">
          <Link to="/" className="wordmark">
            <span className="mark">/</span>Trailhead
          </Link>
          <nav className="kiosk-nav">
            <Link to="/app/profile" className="btn-primary btn-nav">Start your trail</Link>
          </nav>
        </div>
      </header>
      <main>
        <div className="wrap">
          <div className="demo-banner">
            This is an example dashboard, not live data. <Link to="/app/profile">Start your own →</Link>
          </div>
        </div>

        <section className="wrap page">
          <div className="sec-head">
            <div>
              <div className="tag">Example profile</div>
              <h1>A life dashboard, not a highlight reel</h1>
            </div>
          </div>
          <div className="profile">
            <div className="profile-id">
              <div className="avatar">N</div>
              <h2>Nathaniel</h2>
              <div className="role">Santa Barbara, CA</div>
              <div className="streak">
                <div className="num">180</div>
                <div className="cap">day gym streak</div>
              </div>
            </div>
            <div>
              <ul className="markers">
                {MARKERS.map((m) => (
                  <li key={m.label}>
                    <span className="dot" />
                    <span><span className="t">{m.label}</span> <span className="d">— {m.detail}</span></span>
                  </li>
                ))}
              </ul>
              <div className="goal-line">
                <b>Where he's headed</b>
                Build a career in communications — and be honest in public about how uneven the road there actually is.
              </div>
            </div>
          </div>
        </section>

        <section className="wrap page">
          <div className="sec-head">
            <div>
              <div className="tag">Example build log</div>
              <h2>A public journal, not a feed of finished things</h2>
            </div>
          </div>
          <ul className="waypoints">
            {ENTRIES.map((entry) => (
              <li className={`waypoint${entry.current ? ' current' : ''}`} key={entry.week}>
                <span className="pin" />
                <div className="wp-head">
                  <span className="wk">Week {entry.week} · {entry.date}</span>
                  <h3>{entry.title}</h3>
                </div>
                <div className="wp-body">
                  <div className="wp-row"><span className="k">Did</span><span className="v">{entry.did}</span></div>
                  <div className="wp-row"><span className="k">Learned</span><span className="v">{entry.learned}</span></div>
                  <div className="wp-row"><span className="k">Struggled</span><span className="v">{entry.struggled}</span></div>
                  <div className="wp-row"><span className="k">Next</span><span className="v">{entry.next}</span></div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <footer>
        <div className="wrap">
          <p className="close">People follow journeys, not just finished products.</p>
          <p className="fine"><Link to="/">Back to Trailhead</Link> · <Link to="/app/profile">Start your own trail</Link></p>
        </div>
      </footer>
    </>
  )
}
