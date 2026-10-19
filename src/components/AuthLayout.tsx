import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';

// Firebase Auth solo viaja con las rutas de cuenta (/login, /auth/action, /admin/*)
export default function AuthLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
