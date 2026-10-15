import { Navigate, useLocation } from '@/lib/router';
import { useAuth } from '../../hooks/useAuth';
import PawLoader from '../decorative/PawLoader';

// Guards /admin/* — only role === 'admin' gets in. There's no self-serve
// way to become admin (see supabase/admin_panel.sql for how to promote an
// account manually), so anyone else lands on the homepage.
export default function AdminRoute({ children }) {
  const { user, isLoggedIn, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PawLoader label="Memuat..." />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
