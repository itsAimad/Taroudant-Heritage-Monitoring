import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface PrivateRouteProps {
  allowedRoles?: ('admin' | 'inspector' | 'viewer')[];
}

const PrivateRoute = ({ allowedRoles }: PrivateRouteProps) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
};

export default PrivateRoute;
