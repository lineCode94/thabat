import { usePermissionContext } from '@/features/auth/hooks/usePermissionContext';

export function usePermission(permission) {
  const context = usePermissionContext();

  return {
    ...context,
    allowed: context.hasPermission(permission),
  };
}
