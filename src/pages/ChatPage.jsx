import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  fetchLatestMessages,
  fetchMessageHistory,
  sendMessage,
} from '../api'
import { getUserEmail, getUserName } from '../cookies'
import './ChatPage.css'

const POLL_INTERVAL_MS = 3000

function mergeMessages(existing, incoming) {
  const byId = new Map(existing.map((message) => [message.id, message]))
  for (const message of incoming) {
    byId.set(message.id, message)
  }
  return [...byId.values()].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at),
  )
}

function formatTime(timestamp) {
  if (!timestamp) {
    return ''
  }
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ChatPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { groupId } = useParams()
  const email = getUserEmail()
  const userName = getUserName()
  const groupName = location.state?.groupName || 'Group chat'

  const [messages, setMessages] = useState([])
  const [latestTimestamp, setLatestTimestamp] = useState(null)
  const [oldestTimestamp, setOldestTimestamp] = useState(null)
  const [hasMoreHistory, setHasMoreHistory] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [sending, setSending] = useState(false)

  const messagesRef = useRef(null)
  const latestTimestampRef = useRef(null)

  useEffect(() => {
    latestTimestampRef.current = latestTimestamp
  }, [latestTimestamp])

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    const container = messagesRef.current
    if (!container) {
      return
    }
    container.scrollTo({ top: container.scrollHeight, behavior })
  }, [])

  useEffect(() => {
    if (!email) {
      navigate('/', { replace: true })
    }
  }, [email, navigate])

  useEffect(() => {
    if (!email || !groupId) {
      return
    }

    let cancelled = false

    async function loadInitialMessages() {
      setLoading(true)
      setError('')

      try {
        const data = await fetchLatestMessages(groupId, email)
        if (cancelled) {
          return
        }

        setMessages(data.messages)
        setLatestTimestamp(data.latest_timestamp)
        setOldestTimestamp(data.oldest_timestamp)
        setHasMoreHistory(data.has_more)
        requestAnimationFrame(() => scrollToBottom('auto'))
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadInitialMessages()

    return () => {
      cancelled = true
    }
  }, [email, groupId, scrollToBottom])

  useEffect(() => {
    if (!email || !groupId || loading) {
      return
    }

    let cancelled = false

    async function poll() {
      const after = latestTimestampRef.current
      if (!after) {
        return
      }

      try {
        const data = await fetchLatestMessages(groupId, email, after)
        if (cancelled || data.messages.length === 0) {
          if (!cancelled && data.latest_timestamp) {
            setLatestTimestamp(data.latest_timestamp)
          }
          return
        }

        setMessages((current) => mergeMessages(current, data.messages))
        setLatestTimestamp(data.latest_timestamp)
        if (!oldestTimestamp && data.oldest_timestamp) {
          setOldestTimestamp(data.oldest_timestamp)
        }
        scrollToBottom()
      } catch {
        // Keep polling on transient failures.
      }
    }

    const intervalId = window.setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [email, groupId, loading, oldestTimestamp, scrollToBottom])

  async function handleLoadOlder() {
    if (!oldestTimestamp || loadingHistory) {
      return
    }

    const container = messagesRef.current
    const previousHeight = container?.scrollHeight ?? 0

    setLoadingHistory(true)
    setError('')

    try {
      const data = await fetchMessageHistory(groupId, email, oldestTimestamp)
      setMessages((current) => mergeMessages(data.messages, current))
      setOldestTimestamp(data.oldest_timestamp || oldestTimestamp)
      setHasMoreHistory(data.has_more)

      requestAnimationFrame(() => {
        if (!container) {
          return
        }
        const nextHeight = container.scrollHeight
        container.scrollTop = nextHeight - previousHeight
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingHistory(false)
    }
  }

  async function handleSend(event) {
    event.preventDefault()
    const body = draft.trim()
    if (!body || sending) {
      return
    }

    setSending(true)
    setError('')

    try {
      const message = await sendMessage(groupId, email, body)
      setMessages((current) => mergeMessages(current, [message]))
      setLatestTimestamp(message.created_at)
      if (!oldestTimestamp) {
        setOldestTimestamp(message.created_at)
      }
      setDraft('')
      scrollToBottom()
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  if (!email) {
    return null
  }

  return (
    <div className="chat-page">
      <header className="chat-header">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate('/groups')}
        >
          Back
        </button>
        <div>
          <p className="eyebrow">Group chat</p>
          <h1>{groupName}</h1>
          <p className="subtitle">
            Signed in as <strong>{userName || email}</strong>
          </p>
        </div>
      </header>

      <section className="chat-panel">
        <div className="chat-messages-wrap">
          {hasMoreHistory && (
            <button
              type="button"
              className="see-older-button"
              onClick={handleLoadOlder}
              disabled={loadingHistory}
            >
              {loadingHistory ? 'Loading...' : 'See older'}
            </button>
          )}

          <div className="chat-messages" ref={messagesRef}>
            {loading ? (
              <p className="muted">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="muted">No messages yet. Say hello.</p>
            ) : (
              messages.map((message) => {
                const isMine = message.sender_email === email
                return (
                  <article
                    key={message.id}
                    className={`message ${isMine ? 'mine' : 'theirs'}`}
                  >
                    <div className="message-meta">
                      <span>{isMine ? 'You' : message.sender_email}</span>
                      <time>{formatTime(message.created_at)}</time>
                    </div>
                    <p>{message.body}</p>
                  </article>
                )
              })
            )}
          </div>
        </div>

        {error && <p className="error chat-error">{error}</p>}

        <form className="chat-composer" onSubmit={handleSend}>
          <input
            type="text"
            placeholder="Type a message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={sending}
          />
          <button type="submit" disabled={sending || !draft.trim()}>
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </section>
    </div>
  )
}

export default ChatPage
