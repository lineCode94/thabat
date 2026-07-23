import { createContext } from 'react';

export const PermissionContext = createContext({
  permissions: [],
  isLoading: false,
  isError: false,
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
});
