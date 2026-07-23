import { usePermissions } from '@/features/auth/hooks/usePermissions';

export function PermissionGuard({
  children,
  fallback = null,
  mode = 'all',
  permissions = [],
}) {
  const { allowed, isLoading } = usePermissions(permissions, mode);

  if (isLoading) return fallback;

  return allowed ? children : fallback;
}
