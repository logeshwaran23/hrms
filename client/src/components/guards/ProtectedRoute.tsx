import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  requiredPermission?: string;
  requiredPermissions?: string[];
}

export default function ProtectedRoute({ requiredPermission, requiredPermissions }: ProtectedRouteProps) {
  const { isAuthenticated, hasPermission, hasAnyPermission } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/403" replace />;
  }

  if (requiredPermissions && !hasAnyPermission(...requiredPermissions)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
