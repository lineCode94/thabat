import { useContext } from 'react';

import { PermissionContext } from '@/features/auth/contexts/permissionContext';

export function usePermissionContext() {
  return useContext(PermissionContext);
}
