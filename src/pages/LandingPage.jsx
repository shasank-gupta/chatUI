import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { goUser } from '../api'
import { saveUserSession } from '../cookies'
import './LandingPage.css'

function LandingPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!name.trim() || !email.trim()) {
      setError('Please enter both your name and email.')
      return
    }

    setLoading(true)

    try {
      const data = await goUser(name.trim(), email.trim())
      saveUserSession(data.email, data.name)
      navigate('/groups')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing">
      <div className="landing-card">
        <p className="eyebrow">Welcome to Chat</p>
        <h1>Let&apos;s get started</h1>
        <p className="subtitle">
          Enter your details to join your groups and start chatting.
        </p>

        <form className="landing-form" onSubmit={handleSubmit}>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : 'Go'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LandingPage
