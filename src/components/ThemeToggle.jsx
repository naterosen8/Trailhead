import { useState } from 'react'
import { getStoredTheme, setStoredTheme, systemPrefersDark } from '../lib/theme'

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => getStoredTheme() || (systemPrefersDark() ? 'dark' : 'light'))

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setStoredTheme(next)
  }

  const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`

  return (
    <button className="theme-toggle" onClick={toggle} aria-label={label} title={label}>
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24">
          <path d="M20 14.3A8 8 0 1 1 9.7 4a6.5 6.5 0 0 0 10.3 10.3Z" />
        </svg>
      )}
    </button>
  )
}
