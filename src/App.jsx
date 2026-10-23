import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { useAuth } from './lib/auth'
import EventDetail from './pages/EventDetail'
import GuideBandMember from './pages/GuideBandMember'
import Events from './pages/Events'
import Login from './pages/Login'
import Notifications from './pages/Notifications'
import People from './pages/People'
import Profile from './pages/Profile'
import RecruitDetail from './pages/RecruitDetail'
import Recruits from './pages/Recruits'
import Settings from './pages/Settings'
import Timeline from './pages/Timeline'
import TrackDetail from './pages/TrackDetail'
import Tracks from './pages/Tracks'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Timeline />} />
        <Route path="tracks" element={<Tracks />} />
        <Route path="tracks/:id" element={<TrackDetail />} />
        <Route path="recruits" element={<Recruits />} />
        <Route path="recruits/area/:areaSlug" element={<Recruits />} />
        <Route path="recruits/part/:partSlug" element={<Recruits />} />
        <Route path="recruits/:id" element={<RecruitDetail />} />
        <Route path="guide/band-member" element={<GuideBandMember />} />
        <Route path="events" element={<Events />} />
        <Route path="events/:id" element={<EventDetail />} />
        <Route path="people" element={<People />} />
        <Route path="u/:id" element={<Profile />} />
        <Route path="settings" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
        <Route path="login" element={<Login />} />
        <Route path="*" element={<p className="empty">ページが見つかりません</p>} />
      </Route>
    </Routes>
  )
}
