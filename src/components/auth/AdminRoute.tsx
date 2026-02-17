import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { FishLoader } from '@/components/FishLoader'

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, isAdmin } = useAuth()

  if (loading) {
    return <FishLoader text="Verificando permisos..." />
  }

  if (!user || !profile?.is_active) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
