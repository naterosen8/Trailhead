import { computeStreak } from './streak'

// Every badge here is derived from real data already in the database —
// nothing is self-asserted. That's the whole point: a badge means the
// thing actually happened.
export function computeBadges({ profile, entries, accountCreatedAt, cheersGiven = 0, cheersReceived = 0 }) {
  const streak = computeStreak(entries)
  const accountDays = accountCreatedAt
    ? Math.floor((Date.now() - new Date(accountCreatedAt).getTime()) / 86400000)
    : 0
  const profileComplete = Boolean(
    profile &&
    profile.name && profile.name !== 'Your name' &&
    profile.goal && profile.goal.trim() &&
    profile.markers?.some((m) => m.label?.trim() && m.detail?.trim())
  )

  return [
    {
      id: 'first-entry',
      name: 'First entry',
      hint: 'Log your first build log entry.',
      earned: entries.length >= 1,
    },
    {
      id: 'profile-complete',
      name: 'Profile complete',
      hint: 'Set your name, a goal, and at least one marker.',
      earned: profileComplete,
    },
    {
      id: 'five-entries',
      name: '5 entries logged',
      hint: `${Math.min(entries.length, 5)} of 5 logged so far.`,
      earned: entries.length >= 5,
    },
    {
      id: 'two-streak',
      name: '2-entry streak',
      hint: 'Log two entries within 9 days of each other.',
      earned: streak >= 2,
    },
    {
      id: 'four-streak',
      name: '4-entry streak',
      hint: `Current streak: ${streak}. Needs 4 in a row.`,
      earned: streak >= 4,
    },
    {
      id: 'twenty-entries',
      name: '20 entries logged',
      hint: `${Math.min(entries.length, 20)} of 20 logged so far.`,
      earned: entries.length >= 20,
    },
    {
      id: 'one-month',
      name: 'One month on the trail',
      hint: `Account is ${accountDays} of 30 days old.`,
      earned: accountDays >= 30,
    },
    {
      id: 'joined-circle',
      name: 'Joined a circle',
      hint: 'Pick a circle from your profile.',
      earned: Boolean(profile?.circle),
    },
    {
      id: 'cheer-given',
      name: 'Gave a cheer',
      hint: 'React to someone else\'s entry in your circle.',
      earned: cheersGiven >= 1,
    },
    {
      id: 'cheer-received',
      name: 'Got cheered',
      hint: 'Someone in your circle reacted to one of your entries.',
      earned: cheersReceived >= 1,
    },
  ]
}
