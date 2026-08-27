const API_BASE = 'http://localhost:8000'

async function parseError(response, fallback) {
  const error = await response.json().catch(() => ({}))
  throw new Error(error.detail || fallback)
}

export async function goUser(name, email) {
  const response = await fetch(`${API_BASE}/api/go`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email }),
  })

  if (!response.ok) {
    await parseError(response, 'Failed to sign in')
  }

  return response.json()
}

export async function fetchGroups(email) {
  const response = await fetch(`${API_BASE}/api/groups`, {
    headers: { 'X-User-Email': email },
  })

  if (!response.ok) {
    await parseError(response, 'Failed to load groups')
  }

  return response.json()
}

export async function createGroup(name, email) {
  const response = await fetch(`${API_BASE}/api/groups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Email': email,
    },
    body: JSON.stringify({ name }),
  })

  if (!response.ok) {
    await parseError(response, 'Failed to create group')
  }

  return response.json()
}

export async function addGroupMember(groupId, email, memberEmail) {
  const response = await fetch(`${API_BASE}/api/groups/${groupId}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Email': email,
    },
    body: JSON.stringify({ email: memberEmail }),
  })

  if (!response.ok) {
    await parseError(response, 'Failed to add member')
  }

  return response.json()
}

export async function fetchLatestMessages(groupId, email, after) {
  const params = new URLSearchParams()
  if (after) {
    params.set('after', after)
  }

  const query = params.toString()
  const response = await fetch(
    `${API_BASE}/api/groups/${groupId}/messages/latest${query ? `?${query}` : ''}`,
    {
      headers: { 'X-User-Email': email },
    },
  )

  if (!response.ok) {
    await parseError(response, 'Failed to load messages')
  }

  return response.json()
}

export async function fetchMessageHistory(groupId, email, before) {
  const params = new URLSearchParams({ before })
  const response = await fetch(
    `${API_BASE}/api/groups/${groupId}/messages/history?${params}`,
    {
      headers: { 'X-User-Email': email },
    },
  )

  if (!response.ok) {
    await parseError(response, 'Failed to load older messages')
  }

  return response.json()
}

export async function sendMessage(groupId, email, body) {
  const response = await fetch(`${API_BASE}/api/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Email': email,
    },
    body: JSON.stringify({ group_id: groupId, body }),
  })

  if (!response.ok) {
    await parseError(response, 'Failed to send message')
  }

  return response.json()
}
