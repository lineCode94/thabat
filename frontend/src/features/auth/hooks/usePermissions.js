import { usePermissionContext } from '@/features/auth/hooks/usePermissionContext';

export function usePermissions(permissions = [], mode = 'all') {
  const context = usePermissionContext();
  const allowed = mode === 'any'
    ? context.hasAnyPermission(permissions)
    : context.hasAllPermissions(permissions);

  return {
    ...context,
    allowed,
  };
}
