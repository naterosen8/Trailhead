import { supabase } from './supabaseClient'

export async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function saveProfile(userId, profile) {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    name: profile.name,
    location: profile.location,
    streak_num: profile.streakNum,
    streak_label: profile.streakLabel,
    goal: profile.goal,
    markers: profile.markers,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

// The DB uses snake_case columns; the UI uses camelCase. This is the one
// place that translates between them so components never see raw DB shape.
export function profileFromRow(row) {
  if (!row) return null
  return {
    name: row.name,
    location: row.location,
    streakNum: row.streak_num,
    streakLabel: row.streak_label,
    goal: row.goal,
    markers: row.markers || [],
  }
}

export async function listEntries(userId) {
  const { data, error } = await supabase
    .from('build_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(entryFromRow)
}

export function entryFromRow(row) {
  return {
    id: row.id,
    week: row.week,
    date: row.date,
    title: row.title,
    did: row.did,
    learned: row.learned,
    struggled: row.struggled,
    next: row.next,
  }
}

export async function createEntry(userId, entry, week) {
  return insertEntry(userId, { ...entry, week, date: new Date().toISOString().slice(0, 10) })
}

// Used directly by backup restore, which needs to preserve each entry's
// original date and week rather than stamping them with today's.
export async function insertEntry(userId, entry) {
  const { data, error } = await supabase
    .from('build_logs')
    .insert({
      user_id: userId,
      week: entry.week,
      date: entry.date,
      title: entry.title,
      did: entry.did,
      learned: entry.learned,
      struggled: entry.struggled,
      next: entry.next,
    })
    .select()
    .single()
  if (error) throw error
  return entryFromRow(data)
}

export async function updateEntry(id, entry) {
  const { error } = await supabase
    .from('build_logs')
    .update({
      title: entry.title,
      did: entry.did,
      learned: entry.learned,
      struggled: entry.struggled,
      next: entry.next,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteEntry(id) {
  const { error } = await supabase.from('build_logs').delete().eq('id', id)
  if (error) throw error
}
