import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PawLoader from './decorative/PawLoader';

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  // Supabase restores the session asynchronously on first load/refresh
  // (unlike the old localStorage-based auth, which was instant). Without
  // this check, isLoggedIn briefly reads false on a page reload — even for
  // an actually-logged-in user — and this redirected to /login before the
  // session had a chance to come back, showing a blank flash then the
  // login page.
  if (isLoading) {
    return <PawLoader label="Memuat..." />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children || <Outlet />;
}
