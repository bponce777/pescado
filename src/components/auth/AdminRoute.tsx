import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AuthSkeleton } from '@/components/PageSkeleton'

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, isAdmin } = useAuth()

  if (loading) {
    return <AuthSkeleton />
  }

  if (!user || !profile?.is_active) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
