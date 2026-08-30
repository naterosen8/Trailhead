import { Link } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'

const MARKERS = [
  { label: 'UCSB', detail: 'Communication student' },
  { label: 'Regenerative farm', detail: 'weekend volunteer' },
  { label: 'Investing', detail: "teaching himself, six months in" },
  { label: 'Gym', detail: '180 days consistent, tracked openly' },
]

const DEMO_BADGES = [
  { id: 'first-entry', name: 'First entry', earned: true },
  { id: 'profile-complete', name: 'Profile complete', earned: true },
  { id: 'two-streak', name: '2-entry streak', earned: true },
  { id: 'one-month', name: 'One month on the trail', earned: true },
  { id: 'joined-circle', name: 'Joined a circle', earned: true },
  { id: 'cheer-received', name: 'Got cheered', earned: true },
  { id: 'cheer-given', name: 'Gave a cheer', earned: false, hint: "React to someone else's entry in your circle." },
  { id: 'five-entries', name: '5 entries logged', earned: false, hint: '3 of 5 logged so far.' },
  { id: 'four-streak', name: '4-entry streak', earned: false, hint: 'Current streak: 2. Needs 4 in a row.' },
  { id: 'twenty-entries', name: '20 entries logged', earned: false, hint: '3 of 20 logged so far.' },
]

const BADGE_ICONS = {
  'first-entry': <path d="M6 21V4M6 4h12l-3 4 3 4H6" />,
  'profile-complete': <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></>,
  'five-entries': <path d="M4 7h16M4 12h16M4 17h10" />,
  'two-streak': <path d="M12 3c1 3-3 4-3 8a3 3 0 0 0 6 0c0-1-1-2-1-3 2 1 3 3 3 5a5 5 0 0 1-10 0c0-4 3-6 5-10Z" />,
  'four-streak': <path d="M6 9l6-6 6 6M6 16l6-6 6 6" />,
  'twenty-entries': <path d="M8 4h8v4a4 4 0 0 1-8 0V4ZM12 12v4M8 20h8M4 5h4v2a3 3 0 0 1-3 3M20 5h-4v2a3 3 0 0 0 3 3" />,
  'one-month': <path d="M3 5h18v16H3V5ZM3 9h18M8 3v4M16 3v4" />,
  'joined-circle': <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></>,
  'cheer-given': <path d="M12 3c1 3-3 4-3 8a3 3 0 0 0 6 0c0-1-1-2-1-3 2 1 3 3 3 5a5 5 0 0 1-10 0c0-4 3-6 5-10Z" />,
  'cheer-received': <><path d="M12 3c1 3-3 4-3 8a3 3 0 0 0 6 0c0-1-1-2-1-3 2 1 3 3 3 5a5 5 0 0 1-10 0c0-4 3-6 5-10Z" /><path d="M4 4l2 2M20 4l-2 2" /></>,
}

const DEMO_CIRCLE_FEED = [
  {
    author: 'Maya', date: '2026-08-27', title: 'Landed a coffee chat',
    did: 'A cold email from three weeks ago finally got a reply — 20-minute call booked.',
    cheers: 4, cheeredByMe: true,
  },
  {
    author: 'Nathaniel', date: '2026-08-24', title: 'Applied to 5 internships',
    did: 'Applied to 5, cold-emailed 3 alumni first.',
    cheers: 2, cheeredByMe: false,
  },
  {
    author: 'Devon', date: '2026-08-22', title: 'First mock interview',
    did: 'Ran a practice interview with a career center advisor — rougher than expected.',
    cheers: 1, cheeredByMe: false,
  },
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
            <Link to="/signin" state={{ mode: 'signup' }} className="btn-primary btn-nav">Start your trail</Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main>
        <div className="wrap">
          <div className="demo-banner">
            This is an example dashboard, not live data. <Link to="/signin" state={{ mode: 'signup' }}>Start your own →</Link>
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

        <section className="wrap page">
          <div className="sec-head">
            <div>
              <div className="tag">Example badges</div>
              <h2>Earned, not issued</h2>
            </div>
          </div>
          <div className="patches">
            {DEMO_BADGES.map((b) => (
              <div className={`patch${b.earned ? '' : ' locked'}`} key={b.id}>
                <div className="patch-shape">
                  <svg viewBox="0 0 24 24">{BADGE_ICONS[b.id]}</svg>
                </div>
                <div className="patch-name">{b.name}</div>
                <div className="patch-sub">{b.earned ? 'Earned' : b.hint}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="wrap page">
          <div className="sec-head">
            <div>
              <div className="tag">Example circle — College students</div>
              <h2>Belonging before followers</h2>
            </div>
          </div>
          <p className="sec-note circle-intro">
            Nathaniel opted into the College students circle. He sees public entries from other
            people in it — and they see his.
          </p>
          <ul className="waypoints circle-feed">
            {DEMO_CIRCLE_FEED.map((entry) => (
              <li className="waypoint" key={entry.title}>
                <span className="pin" />
                <div className="wp-head">
                  <span className="wk">{entry.author} · {entry.date}</span>
                  <h3>{entry.title}</h3>
                </div>
                <div className="wp-body">
                  <div className="wp-row"><span className="k">Did</span><span className="v">{entry.did}</span></div>
                </div>
                <div className={`cheer-btn${entry.cheeredByMe ? ' cheered' : ''}`}>
                  <svg viewBox="0 0 24 24"><path d="M12 3c1 3-3 4-3 8a3 3 0 0 0 6 0c0-1-1-2-1-3 2 1 3 3 3 5a5 5 0 0 1-10 0c0-4 3-6 5-10Z" /></svg>
                  {entry.cheers} Cheer{entry.cheers === 1 ? '' : 's'}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <footer>
        <div className="wrap">
          <p className="close">People follow journeys, not just finished products.</p>
          <p className="fine"><Link to="/">Back to Trailhead</Link> · <Link to="/signin" state={{ mode: 'signup' }}>Start your own trail</Link></p>
        </div>
      </footer>
    </>
  )
}
