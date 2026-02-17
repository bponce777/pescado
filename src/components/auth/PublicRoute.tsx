import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return null
  }

  if (user && profile?.is_active) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
