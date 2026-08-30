import { Link } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import StatsStrip from '../components/StatsStrip'

export default function Landing() {
  return (
    <>
      <header className="kiosk">
        <div className="wrap kiosk-inner">
          <Link to="/" className="wordmark">
            <span className="mark">/</span>Trailhead
          </Link>
          <nav className="kiosk-nav">
            <Link to="/demo" className="kiosk-link-secondary">See an example</Link>
            <Link to="/signin" state={{ mode: 'signup' }} className="btn-primary btn-nav">Start your trail</Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <svg className="topo" aria-hidden="true" viewBox="0 0 1200 520" preserveAspectRatio="none">
            <ContourLines />
          </svg>
          <div className="wrap">
            <div className="eyebrow"><span className="dash" />For people building themselves</div>
            <h1>Not a highlight reel.<br /><em>A trail.</em></h1>
            <p className="hero-sub">
              Everywhere else asks you to perform a finished version of yourself. Trailhead is where
              you post the in-progress one — what you're building, what you're learning, and where
              you're trying to go.
            </p>
            <div className="hero-cta">
              <Link to="/signin" state={{ mode: 'signup' }} className="btn-primary btn-large">Start your trail</Link>
              <Link to="/demo" className="btn-ghost btn-large">See an example dashboard</Link>
            </div>
            <StatsStrip />

            <div className="compare">
              <div><div className="plat">Instagram / TikTok</div><div className="line">Look how good my life is.</div></div>
              <div><div className="plat">LinkedIn</div><div className="line">Look how professional I am.</div></div>
              <div><div className="plat">Dating apps</div><div className="line">Judge me in three seconds.</div></div>
              <div className="us"><div className="plat">Trailhead</div><div className="line">Here's who I am, what I'm building, and where I'm headed.</div></div>
            </div>
          </div>
        </section>

        <section className="wrap page">
          <div className="sec-head">
            <div>
              <div className="tag">How it works</div>
              <h2>Two pieces. Nothing performative.</h2>
            </div>
          </div>
          <div className="steps">
            <div className="step">
              <span className="step-icon">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></svg>
              </span>
              <h3>Your profile is a dashboard, not a bio</h3>
              <p>What you're studying, working on, and training for — plus where you're actually headed. No polish required.</p>
            </div>
            <div className="step">
              <span className="step-icon">
                <svg viewBox="0 0 24 24"><path d="M4 21V10" /><path d="M10 21V4" /><path d="M16 21v-9" /><path d="M20 21v-5" /></svg>
              </span>
              <h3>The build log is the record</h3>
              <p>Short, dated entries: what you did, what you learned, what you struggled with, what's next. The app tracks your posting streak for you.</p>
            </div>
            <div className="step">
              <span className="step-icon">
                <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="14" rx="1" /><path d="M3 9h18" /><path d="M8 21h8" /></svg>
              </span>
              <h3>Your account, your data</h3>
              <p>One free account syncs your dashboard across every device — and it exports to a single file whenever you want a backup. No lock-in.</p>
            </div>
          </div>
        </section>

        <section className="wrap page roadmap">
          <div className="sec-head">
            <div>
              <div className="tag">Built in order, on purpose</div>
              <h2>What's real right now, and what's next</h2>
            </div>
          </div>
          <div className="roadmap-grid">
            <div className="roadmap-col">
              <div className="roadmap-label live">Live today</div>
              <ul>
                <li>Real accounts — your dashboard syncs across devices</li>
                <li>Editable life-dashboard profile</li>
                <li>Build log with create, edit, and delete</li>
                <li>Automatic posting-streak tracking</li>
                <li>Earned badges, computed from real activity — never asserted</li>
                <li>A contribution calendar of your actual posting history</li>
                <li>Circles — opt-in public feeds by shared goal, with cheers</li>
                <li>Full data export / import — your data, portable</li>
              </ul>
            </div>
            <div className="roadmap-col">
              <div className="roadmap-label next">Next</div>
              <ul>
                <li>Accountability partners, matched on a specific goal</li>
              </ul>
            </div>
          </div>
          <p className="roadmap-note">
            Circle visibility is opt-in and off by default — your profile and entries stay private
            until you turn it on, and even then only your display name and what you've posted are
            ever shown, never your email or account details. Accountability matching needs a real,
            active circle to match people from, so it's next once Circles has real usage behind it.
          </p>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <p className="close">People follow journeys, not just finished products.</p>
          <p className="fine">Trailhead — an early, honest build. <Link to="/demo">See an example</Link> or <Link to="/signin" state={{ mode: 'signup' }}>start your own</Link>.</p>
        </div>
      </footer>
    </>
  )
}

function ContourLines() {
  const rings = Array.from({ length: 7 }, (_, r) => {
    const cx = 940, cy = 20
    const rad = 60 + r * 70
    const pts = []
    for (let i = 0; i <= 40; i++) {
      const t = (i / 40) * Math.PI
      const wobble = Math.sin(t * 3 + r) * 10 + Math.cos(t * 5 - r) * 6
      const x = cx + Math.cos(Math.PI - t) * (rad + wobble)
      const y = cy + Math.sin(Math.PI - t) * (rad * 0.8 + wobble)
      pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    }
    return { d: pts.join(' '), opacity: 0.9 - r * 0.1 }
  })
  return (
    <>
      {rings.map((r, i) => (
        <path key={i} d={r.d} fill="none" style={{ stroke: 'var(--contour-strong)' }} strokeWidth="1" opacity={r.opacity} />
      ))}
    </>
  )
}
