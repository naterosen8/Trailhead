import { useState } from 'react'
import Nav from './components/Nav'
import Profile from './pages/Profile'
import BuildLog from './pages/BuildLog'

export default function App() {
  const [view, setView] = useState('profile')

  return (
    <>
      <Nav view={view} setView={setView} />
      <main>{view === 'profile' ? <Profile /> : <BuildLog />}</main>
    </>
  )
}
