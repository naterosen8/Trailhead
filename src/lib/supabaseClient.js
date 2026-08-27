import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(url && anonKey)

if (!supabaseConfigured) {
  console.warn(
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see .env.example) — accounts and data storage will not work until this is set.'
  )
}

// A stub client so the app can still render (and explain the problem) instead
// of crashing when the env vars are missing, e.g. on first-time local setup.
export const supabase = supabaseConfigured
  ? createClient(url, anonKey)
  : null
