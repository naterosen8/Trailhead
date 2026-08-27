import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import Landing from './pages/Landing'
import Demo from './pages/Demo'
import Profile from './pages/Profile'
import BuildLog from './pages/BuildLog'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/app" element={<AppShell />}>
        <Route index element={<Navigate to="profile" replace />} />
        <Route path="profile" element={<Profile />} />
        <Route path="log" element={<BuildLog />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
