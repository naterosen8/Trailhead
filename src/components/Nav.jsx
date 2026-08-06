export default function Nav({ view, setView }) {
  return (
    <header className="kiosk">
      <div className="wrap kiosk-inner">
        <div className="wordmark">
          <span className="mark">/</span>Trailhead
        </div>
        <nav className="kiosk-nav">
          <button
            className={view === 'profile' ? 'active' : ''}
            onClick={() => setView('profile')}
          >
            Profile
          </button>
          <button
            className={view === 'log' ? 'active' : ''}
            onClick={() => setView('log')}
          >
            Build Log
          </button>
        </nav>
      </div>
    </header>
  )
}
