import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (u) => {
    setUser(u)
    setProfile(u ? await api.getProfile(u.id) : null)
    setLoading(false)
  }, [])

  useEffect(() => {
    api.auth.getUser().then(loadProfile)
    return api.auth.onChange(loadProfile)
  }, [loadProfile])

  const refreshProfile = useCallback(async () => {
    if (user) setProfile(await api.getProfile(user.id))
  }, [user])

  // ヘッダーのベルに出す未読数
  const [unread, setUnread] = useState(0)
  const refreshUnread = useCallback(async () => {
    try {
      setUnread(user ? await api.unreadCount() : 0)
    } catch {
      // 通信できないときは前の数字のまま
    }
  }, [user])

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, unread, refreshUnread }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
