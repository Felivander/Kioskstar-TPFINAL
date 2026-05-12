import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/useAppSelector';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireOnboarded?: boolean;
}

export default function ProtectedRoute({ children, allowedRoles, requireOnboarded }: ProtectedRouteProps) {
  const { user, token } = useAppSelector((state) => state.auth);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requireOnboarded && !user.onboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
