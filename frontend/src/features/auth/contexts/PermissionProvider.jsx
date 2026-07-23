import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { PermissionContext } from '@/features/auth/contexts/permissionContext';
import { PermissionService } from '@/features/auth/services/permission.service';
import { useAuthStore } from '@/store/useAuthStore';

export function PermissionProvider({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['me', 'permissions'],
    queryFn: () => PermissionService.getMyPermissions(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const value = useMemo(() => {
    const permissions = isAuthenticated ? data?.permissions ?? [] : [];
    const permissionSet = new Set(permissions);

    return {
      permissions,
      isLoading,
      isError,
      hasPermission: (permission) => permissionSet.has(permission),
      hasAnyPermission: (requiredPermissions = []) => (
        requiredPermissions.some((permission) => permissionSet.has(permission))
      ),
      hasAllPermissions: (requiredPermissions = []) => (
        requiredPermissions.every((permission) => permissionSet.has(permission))
      ),
    };
  }, [data?.permissions, isAuthenticated, isError, isLoading]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}
