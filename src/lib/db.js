import { supabase } from './supabaseClient'
import { uid } from './storage'

// Shared by every place that might need to create a profile from nothing —
// the real edit form, and anywhere else (like joining a Circle) that can
// save a profile before the user has ever visited it. Keeping one shape
// avoids ending up with a partial row missing fields like `markers`, which
// would crash anything that later assumes it's an array.
export function defaultProfile() {
  return {
    name: 'Your name',
    location: 'Where you are',
    streakLabel: 'day streak',
    streakNum: 0,
    goal: 'What you\'re building toward',
    markers: [
      { id: uid(), label: 'What you do', detail: 'Add a short detail' },
    ],
    circle: null,
    isPublic: false,
    lookingForPartner: false,
  }
}

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
    circle: profile.circle || null,
    is_public: Boolean(profile.isPublic),
    looking_for_partner: Boolean(profile.lookingForPartner),
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
    circle: row.circle || null,
    isPublic: Boolean(row.is_public),
    lookingForPartner: Boolean(row.looking_for_partner),
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

// --- Circles ---
// All cross-user reads go through security-definer functions (see
// supabase/schema.sql) rather than direct table access — there is no path
// in this app that lets one account read another's raw row.

export async function getCircleFeed(circle, limit = 60) {
  const { data, error } = await supabase.rpc('circle_feed', { p_circle: circle, p_limit: limit })
  if (error) throw error
  return (data || []).map((row) => ({
    id: row.entry_id,
    title: row.title,
    did: row.did,
    learned: row.learned,
    struggled: row.struggled,
    next: row.next,
    date: row.entry_date,
    createdAt: row.created_at,
    authorId: row.author_id,
    authorName: row.author_name,
    authorLookingForPartner: Boolean(row.author_looking_for_partner),
    cheerCount: Number(row.cheer_count),
    cheeredByMe: Boolean(row.cheered_by_me),
  }))
}

export async function getCircleMemberCounts() {
  const { data, error } = await supabase.rpc('circle_member_counts')
  if (error) throw error
  const counts = {}
  for (const row of data || []) counts[row.circle] = Number(row.member_count)
  return counts
}

export async function addCheer(entryId, userId) {
  const { error } = await supabase.from('cheers').insert({ entry_id: entryId, user_id: userId })
  if (error) throw error
}

export async function removeCheer(entryId, userId) {
  const { error } = await supabase.from('cheers').delete().eq('entry_id', entryId).eq('user_id', userId)
  if (error) throw error
}

// How many cheers your own entries have received in total. Relies on the
// "visible to the entry owner" half of the cheers select policy — no new
// grant needed, since you're only ever asking about your own entries.
export async function getCheersReceivedCount(entryIds) {
  if (!entryIds.length) return 0
  const { count, error } = await supabase
    .from('cheers')
    .select('id', { count: 'exact', head: true })
    .in('entry_id', entryIds)
  if (error) throw error
  return count || 0
}

// How many cheers you've given out — your own rows in the cheers table,
// which the "auth.uid() = user_id" half of the select policy always lets
// you see regardless of whether those entries are still public.
export async function getCheersGivenCount(userId) {
  const { count, error } = await supabase
    .from('cheers')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  if (error) throw error
  return count || 0
}

// --- Accountability Partners ---
// Messaging is opt-in on both ends (see can_message() in schema.sql): you
// only ever reach someone who is in your circle and has also turned on
// "looking for a partner." The RLS policies enforce this independently of
// anything checked here — this layer just shapes the calls and results.

export async function getCirclePartners(circle) {
  const { data, error } = await supabase.rpc('circle_partners', { p_circle: circle })
  if (error) throw error
  return (data || []).map((row) => ({
    userId: row.user_id,
    name: row.name,
    goal: row.goal,
  }))
}

export async function getConversations() {
  const { data, error } = await supabase.rpc('list_conversations')
  if (error) throw error
  return (data || []).map((row) => ({
    partnerId: row.partner_id,
    partnerName: row.partner_name,
    lastBody: row.last_body,
    lastCreatedAt: row.last_created_at,
    lastSenderId: row.last_sender_id,
  }))
}

export async function getMessageThread(myId, partnerId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${myId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${myId})`)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map((row) => ({
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    body: row.body,
    createdAt: row.created_at,
  }))
}

export async function sendMessage(senderId, recipientId, body) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: senderId, recipient_id: recipientId, body })
    .select()
    .single()
  if (error) throw error
  return {
    id: data.id,
    senderId: data.sender_id,
    recipientId: data.recipient_id,
    body: data.body,
    createdAt: data.created_at,
  }
}
