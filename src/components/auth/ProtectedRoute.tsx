import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { FishLoader } from '@/components/FishLoader'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <FishLoader text="Verificando sesión..." />
  }

  if (!user || !profile?.is_active) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
