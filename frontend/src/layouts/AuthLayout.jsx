import { Navigate } from 'react-router-dom';

import { AuthContainer } from '@/features/auth/components/AuthContainer';
import { AuthHeader } from '@/features/auth/components/AuthHeader';
import { useAuthStore } from '@/store/useAuthStore';

export function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-neo flex min-h-screen flex-col items-center justify-start gap-4 overflow-x-hidden overflow-y-auto [background:var(--gradient-background)] p-4 py-6 text-foreground lg:justify-center">
      <AuthHeader />
      <AuthContainer />
    </div>
  );
}
