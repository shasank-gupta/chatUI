import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import GroupsPage from './pages/GroupsPage'
import ChatPage from './pages/ChatPage'
import { getUserEmail } from './cookies'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            getUserEmail() ? <Navigate to="/groups" replace /> : <LandingPage />
          }
        />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/groups/:groupId/chat" element={<ChatPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
