const KEY = 'trailhead:theme' // 'light' | 'dark' — absent means "follow system"

export function getStoredTheme() {
  try {
    return window.localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function applyTheme(theme) {
  const root = document.documentElement
  if (theme) root.setAttribute('data-theme', theme)
  else root.removeAttribute('data-theme')
}

export function setStoredTheme(theme) {
  try {
    if (theme) window.localStorage.setItem(KEY, theme)
    else window.localStorage.removeItem(KEY)
  } catch {
    // ignore — theme just won't persist this session
  }
  applyTheme(theme)
}

export function systemPrefersDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}
