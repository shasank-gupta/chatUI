# chatUI

React frontend for the Chat application. Users sign in with name and email, manage groups, add members, and chat in real-time-ish group conversations via short polling.

## Tech stack

- **React 19** — UI framework
- **Vite** — dev server and build tool
- **React Router** — client-side routing

## Project structure

```
chatUI/
├── index.html              # HTML entry point
├── vite.config.js          # Vite configuration
├── package.json
├── public/                 # Static assets (favicon, icons)
└── src/
    ├── main.jsx            # React root mount
    ├── App.jsx             # Router and route definitions
    ├── api.js              # Backend API client
    ├── cookies.js          # Browser cookie helpers for session
    ├── index.css           # Global styles
    ├── App.css
    └── pages/
        ├── LandingPage.jsx # Sign-in (name + email)
        ├── LandingPage.css
        ├── GroupsPage.jsx  # Group list, create group, add member
        ├── GroupsPage.css
        ├── ChatPage.jsx    # Group chat with polling
        └── ChatPage.css
```

## Setup

### Prerequisites

- Node.js 18+
- Backend running at `http://localhost:8000` (see `chatBackend/README.md`)

### Install and run

```bash
cd chatUI
npm install
npm run dev
```

App URL: [http://localhost:5173](http://localhost:5173)

### Build for production

```bash
npm run build
npm run preview
```

## Routes

| Path | Page | Description |
|---|---|---|
| `/` | Landing | Name + email sign-in. Redirects to `/groups` if cookie exists. |
| `/groups` | Groups | List groups, create groups, add members |
| `/groups/:groupId/chat` | Chat | Group messaging |

## Features

### 1. Landing page (`/`)

- User enters **name** and **email**
- Clicking **Go** calls `POST /api/go`
- On success:
  - Saves `userEmail` and `userName` cookies (30-day expiry)
  - Navigates to `/groups`

### 2. Groups page (`/groups`)

- **Always fetches fresh groups** from `GET /api/groups` on load/refresh (memberships added by others are reflected)
- **Create group** — form calls `POST /api/groups`
- **Group list** — click a group name to open chat
- **Add member** — visible only if `group.created_by` matches the signed-in user's email
  - Opens a modal to enter a member's email
  - Calls `POST /api/groups/{id}/members`
  - Shows success or `User not found` from backend

### 3. Chat page (`/groups/:groupId/chat`)

- **Messages panel** (top):
  - Loads latest 20 messages on open
  - **See older** button at top loads previous 20 via history API
  - Polls every 3 seconds for new messages
- **Composer** (bottom):
  - Text input + **Send** button
  - Calls `POST /api/messages`

Messages are styled differently for the current user ("You") vs others.

## Session management

Session is stored in browser cookies (`src/cookies.js`):

| Cookie | Purpose |
|---|---|
| `userEmail` | Sent to backend as `X-User-Email` header |
| `userName` | Displayed in UI |

No localStorage or JWT is used. If `userEmail` is missing, protected routes redirect to `/`.

## API client (`src/api.js`)

All backend calls go through `api.js`. Base URL: `http://localhost:8000`.

| Function | Backend endpoint |
|---|---|
| `goUser(name, email)` | `POST /api/go` |
| `fetchGroups(email)` | `GET /api/groups` |
| `createGroup(name, email)` | `POST /api/groups` |
| `addGroupMember(groupId, email, memberEmail)` | `POST /api/groups/{id}/members` |
| `fetchLatestMessages(groupId, email, after?)` | `GET /api/groups/{id}/messages/latest` |
| `fetchMessageHistory(groupId, email, before)` | `GET /api/groups/{id}/messages/history` |
| `sendMessage(groupId, email, body)` | `POST /api/messages` |

Authenticated requests include the header:
```
X-User-Email: user@example.com
```

## How chat polling works

```
┌─────────────────────────────────────────┐
│  Initial load                           │
│  GET /messages/latest (no after param)  │
│  → latest 20 messages                   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Poll every 3s                          │
│  GET /messages/latest?after=<latest_ts> │
│  → new messages only                    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  User clicks "See older"                │
│  GET /messages/history?before=<oldest>  │
│  → previous 20 messages prepended       │
└─────────────────────────────────────────┘
```

- Messages are merged by `id` to avoid duplicates
- Scroll position is preserved when loading older messages
- New messages from polling auto-scroll to bottom

## User flows

### New user
1. Land on `/` → enter name + email → **Go**
2. Redirected to `/groups` (empty list)
3. Create a group → appears in list with **Add member** button

### Add someone to a group
1. Other person must sign in first (creates their `users` row)
2. Group creator clicks **Add member** → enters their email
3. Member refreshes `/groups` → sees the new group

### Chat
1. Click group name → chat page opens
2. Type message → **Send**
3. Other members see it within ~3 seconds via polling

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | Run oxlint |

## Configuration

To point at a different backend, update `API_BASE` in `src/api.js`:

```js
const API_BASE = 'http://localhost:8000'
```

For production, use your deployed backend URL and ensure CORS is configured on the backend.
