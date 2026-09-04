import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import RequireAuth from './components/RequireAuth'
import AppShell from './components/AppShell'
import Landing from './pages/Landing'
import Demo from './pages/Demo'
import SignIn from './pages/SignIn'
import ResetPassword from './pages/ResetPassword'
import Profile from './pages/Profile'
import BuildLog from './pages/BuildLog'
import Badges from './pages/Badges'
import Circles from './pages/Circles'
import Partners from './pages/Partners'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<RequireAuth />}>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<Profile />} />
            <Route path="log" element={<BuildLog />} />
            <Route path="badges" element={<Badges />} />
            <Route path="circles" element={<Circles />} />
            <Route path="partners" element={<Partners />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}
