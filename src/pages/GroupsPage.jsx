import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addGroupMember, createGroup, fetchGroups } from '../api'
import { getUserEmail, getUserName } from '../cookies'
import './GroupsPage.css'

function GroupsPage() {
  const navigate = useNavigate()
  const email = getUserEmail()
  const userName = getUserName()

  const [groups, setGroups] = useState([])
  const [groupName, setGroupName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [memberEmail, setMemberEmail] = useState('')
  const [addingMember, setAddingMember] = useState(false)
  const [modalError, setModalError] = useState('')

  const loadGroups = useCallback(async () => {
    if (!email) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await fetchGroups(email)
      setGroups(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [email])

  useEffect(() => {
    if (!email) {
      navigate('/', { replace: true })
      return
    }

    loadGroups()
  }, [email, loadGroups, navigate])

  function openAddMemberModal(group) {
    setSelectedGroup(group)
    setMemberEmail('')
    setModalError('')
    setSuccess('')
  }

  function closeAddMemberModal() {
    setSelectedGroup(null)
    setMemberEmail('')
    setModalError('')
  }

  async function handleCreateGroup(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!groupName.trim()) {
      setError('Please enter a group name.')
      return
    }

    setCreating(true)

    try {
      const newGroup = await createGroup(groupName.trim(), email)
      setGroups((current) =>
        [...current, newGroup].sort((a, b) => a.name.localeCompare(b.name)),
      )
      setGroupName('')
      setSuccess(`Group "${newGroup.name}" created.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleAddMember(event) {
    event.preventDefault()
    setModalError('')

    if (!memberEmail.trim()) {
      setModalError('Please enter an email address.')
      return
    }

    setAddingMember(true)

    try {
      const result = await addGroupMember(
        selectedGroup.id,
        email,
        memberEmail.trim(),
      )
      setSuccess(result.message)
      closeAddMemberModal()
    } catch (err) {
      setModalError(err.message)
    } finally {
      setAddingMember(false)
    }
  }

  if (!email) {
    return null
  }

  return (
    <div className="groups-page">
      <header className="groups-header">
        <div>
          <p className="eyebrow">Your workspace</p>
          <h1>Groups</h1>
          <p className="subtitle">
            Signed in as <strong>{userName || email}</strong>
          </p>
        </div>
      </header>

      <section className="create-group-card">
        <h2>Create a group</h2>
        <form className="create-group-form" onSubmit={handleCreateGroup}>
          <input
            type="text"
            placeholder="Group name"
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
          />
          <button type="submit" disabled={creating}>
            {creating ? 'Creating...' : 'Create'}
          </button>
        </form>
      </section>

      <section className="groups-list-card">
        <h2>Your groups</h2>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        {loading ? (
          <p className="muted">Loading groups...</p>
        ) : groups.length === 0 ? (
          <p className="muted">You are not a member of any groups yet.</p>
        ) : (
          <ul className="groups-list">
            {groups.map((group) => {
              const isCreator = group.created_by?.toLowerCase() === email.toLowerCase()

              return (
              <li key={group.id} className="group-row">
                <button
                  type="button"
                  className="group-link"
                  onClick={() =>
                    navigate(`/groups/${group.id}/chat`, {
                      state: { groupName: group.name },
                    })
                  }
                >
                  {group.name}
                </button>
                {isCreator && (
                  <button
                    type="button"
                    className="add-member-button"
                    onClick={() => openAddMemberModal(group)}
                  >
                    Add member
                  </button>
                )}
              </li>
              )
            })}
          </ul>
        )}
      </section>

      {selectedGroup && (
        <div className="modal-backdrop" onClick={closeAddMemberModal}>
          <div
            className="modal-card"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Add member to {selectedGroup.name}</h3>
            <p className="modal-subtitle">
              Enter the email of a user who has already signed in.
            </p>

            <form className="modal-form" onSubmit={handleAddMember}>
              <label htmlFor="member-email">Email</label>
              <input
                id="member-email"
                type="email"
                placeholder="member@example.com"
                value={memberEmail}
                onChange={(event) => setMemberEmail(event.target.value)}
                autoFocus
              />

              {modalError && <p className="error">{modalError}</p>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeAddMemberModal}
                  disabled={addingMember}
                >
                  Cancel
                </button>
                <button type="submit" disabled={addingMember}>
                  {addingMember ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default GroupsPage
