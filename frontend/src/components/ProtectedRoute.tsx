import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { type UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: UserRole | UserRole[];
}

export const ProtectedRoute = ({ children, requireRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar se requer role específico
  if (requireRole) {
    const hasAccess = Array.isArray(requireRole)
      ? requireRole.includes(user?.role as UserRole)
      : user?.role === requireRole;
    
    if (!hasAccess) {
      // Se o usuário não tem o role necessário, redirecionar para home
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};



