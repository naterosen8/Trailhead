import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  defaultProfile,
  getCirclePartners,
  getConversations,
  getMessageThread,
  getProfile,
  profileFromRow,
  saveProfile,
  sendMessage,
} from '../lib/db'
import { useAuth } from '../lib/AuthContext'
import { circleLabel } from '../lib/circles'

function timeAgo(iso) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export default function Partners() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [partners, setPartners] = useState(null)
  const [conversations, setConversations] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [thread, setThread] = useState(null) // { partnerId, partnerName, messages }
  const [threadLoading, setThreadLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const threadEndRef = useRef(null)

  const loadLists = useCallback((circle) => {
    if (!circle) {
      setPartners([])
      setConversations([])
      return
    }
    Promise.all([getCirclePartners(circle), getConversations()])
      .then(([p, c]) => {
        setPartners(p)
        setConversations(c)
      })
      .catch((err) => setError(err.message || 'Could not load partners.'))
  }, [])

  useEffect(() => {
    let cancelled = false
    getProfile(user.id)
      .then((row) => {
        if (cancelled) return
        const p = profileFromRow(row) || defaultProfile()
        setProfile(p)
        loadLists(p.circle)
      })
      .catch((err) => !cancelled && setError(err.message || 'Could not load your profile.'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [user.id, loadLists])

  useEffect(() => {
    if (thread) threadEndRef.current?.scrollIntoView({ block: 'nearest' })
  }, [thread?.messages?.length])

  async function toggleLookingForPartner() {
    setSaving(true)
    setError('')
    try {
      const next = { ...profile, lookingForPartner: !profile.lookingForPartner }
      await saveProfile(user.id, next)
      setProfile(next)
      loadLists(next.circle)
    } catch (err) {
      setError(err.message || 'Could not update that setting — try again.')
    } finally {
      setSaving(false)
    }
  }

  async function enablePublic() {
    setSaving(true)
    setError('')
    try {
      const next = { ...profile, isPublic: true }
      await saveProfile(user.id, next)
      setProfile(next)
    } catch (err) {
      setError(err.message || 'Could not update that setting — try again.')
    } finally {
      setSaving(false)
    }
  }

  async function openThread(partnerId, partnerName) {
    setError('')
    setThread({ partnerId, partnerName, messages: [] })
    setThreadLoading(true)
    try {
      const messages = await getMessageThread(user.id, partnerId)
      setThread({ partnerId, partnerName, messages })
    } catch (err) {
      setError(err.message || 'Could not open that conversation.')
      setThread(null)
    } finally {
      setThreadLoading(false)
    }
  }

  async function submitMessage(e) {
    e.preventDefault()
    const body = draft.trim()
    if (!body || !thread) return
    setSending(true)
    setError('')
    try {
      const message = await sendMessage(user.id, thread.partnerId, body)
      setThread((t) => ({ ...t, messages: [...t.messages, message] }))
      setDraft('')
      loadLists(profile.circle)
    } catch {
      setError('Could not send that message. You both need to be opted in and in the same circle to message each other.')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <section className="wrap page">
        <p className="empty-note">Loading Partners…</p>
      </section>
    )
  }

  if (thread) {
    return (
      <section className="wrap page">
        <div className="sec-head">
          <div>
            <div className="tag">Conversation</div>
            <h1>{thread.partnerName}</h1>
          </div>
          <button className="btn-ghost" onClick={() => { setThread(null); setDraft('') }}>Back to Partners</button>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="thread">
          {threadLoading && <p className="empty-note">Loading messages…</p>}
          {!threadLoading && thread.messages.length === 0 && (
            <p className="empty-note">No messages yet — say hello and set up your first check-in.</p>
          )}
          {!threadLoading && thread.messages.length > 0 && (
            <ul className="thread-list">
              {thread.messages.map((m) => (
                <li key={m.id} className={`bubble${m.senderId === user.id ? ' mine' : ''}`}>
                  <div className="bubble-body">{m.body}</div>
                  <div className="bubble-time">{timeAgo(m.createdAt)}</div>
                </li>
              ))}
              <li ref={threadEndRef} aria-hidden="true" />
            </ul>
          )}
        </div>
        <form className="thread-compose" onSubmit={submitMessage}>
          <label className="sr-only" htmlFor="message-draft">Message</label>
          <input
            id="message-draft"
            placeholder="Write a message…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={sending}
            maxLength={2000}
          />
          <button type="submit" className="btn-primary" disabled={sending || !draft.trim()}>
            {sending ? 'Sending…' : 'Send'}
          </button>
        </form>
      </section>
    )
  }

  return (
    <section className="wrap page">
      <div className="sec-head">
        <div>
          <div className="tag">Partners</div>
          <h1>Accountability partners</h1>
        </div>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      {!profile.circle ? (
        <p className="empty-note">
          Join a <Link to="/app/circles">Circle</Link> first — partners are matched within a circle,
          not across the whole site.
        </p>
      ) : (
        <>
          <p className="sec-note circle-intro">
            Opt in and you'll be matched with people in {circleLabel(profile.circle)} who also want a partner
            to check in with. Messaging only works when both people have opted in — never one-sided.
          </p>

          <label className="checkbox-row partner-toggle">
            <input
              type="checkbox"
              checked={profile.lookingForPartner}
              onChange={toggleLookingForPartner}
              disabled={saving}
            />
            <span>
              I'm looking for an accountability partner
              <span className="field-note">
                Shows you to, and lets you message, other opted-in people in your circle.
              </span>
            </span>
          </label>

          {profile.lookingForPartner && !profile.isPublic && (
            <div className="demo-banner circle-privacy-prompt">
              Your profile is still private, so no one can see or message you yet.{' '}
              <button type="button" className="link-button" onClick={enablePublic} disabled={saving}>
                Make my profile visible in this circle
              </button>
            </div>
          )}

          {conversations && conversations.length > 0 && (
            <>
              <div className="sec-head circle-feed-head">
                <div>
                  <div className="tag">Conversations</div>
                  <h2>Your check-ins</h2>
                </div>
              </div>
              <ul className="conversation-list">
                {conversations.map((c) => (
                  <li key={c.partnerId}>
                    <button className="conversation-row" onClick={() => openThread(c.partnerId, c.partnerName)}>
                      <span className="conversation-name">{c.partnerName}</span>
                      <span className="conversation-preview">
                        {c.lastSenderId === user.id ? 'You: ' : ''}{c.lastBody}
                      </span>
                      <span className="conversation-time">{timeAgo(c.lastCreatedAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="sec-head circle-feed-head">
            <div>
              <div className="tag">Find a partner</div>
              <h2>Opted in, in {circleLabel(profile.circle)}</h2>
            </div>
          </div>
          {partners && partners.length === 0 && (
            <p className="empty-note">No one else in your circle has opted in yet — check back soon.</p>
          )}
          {partners && partners.length > 0 && (
            <ul className="partner-list">
              {partners.map((p) => (
                <li key={p.userId} className="partner-card">
                  <div>
                    <div className="partner-name">{p.name}</div>
                    {p.goal && <div className="partner-goal">{p.goal}</div>}
                  </div>
                  {profile.lookingForPartner ? (
                    <button className="btn-ghost" onClick={() => openThread(p.userId, p.name)}>Message</button>
                  ) : (
                    <span className="partner-locked">Opt in above to message</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
