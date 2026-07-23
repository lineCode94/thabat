import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';

import { usePermissionContext } from '@/features/auth/hooks/usePermissionContext';
import { cn } from '@/lib/utils';

function isGroupActive(group, pathname) {
  return group.items?.some((item) => item.to && pathname.startsWith(item.to));
}

export function AppSidebarNav({ items, collapsed = false, onNavigate }) {
  const location = useLocation();
  const { t } = useTranslation(['layout']);
  const { hasAllPermissions, hasAnyPermission } = usePermissionContext();
  const visibleItems = useMemo(() => filterVisibleItems(items, hasAllPermissions, hasAnyPermission), [
    items,
    hasAllPermissions,
    hasAnyPermission,
  ]);
  const initialOpen = useMemo(() => {
    const open = {};
    for (const item of visibleItems) {
      if (item.items) open[item.id] = isGroupActive(item, location.pathname);
    }
    return open;
  }, [visibleItems, location.pathname]);
  const [openGroups, setOpenGroups] = useState(initialOpen);

  const toggleGroup = (id) => {
    setOpenGroups((state) => ({ ...state, [id]: !state[id] }));
  };

  return (
    <nav className="flex flex-col gap-1" aria-label={t('navigation.main')}>
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const label = t(item.labelKey);

        if (item.items) {
          const isOpen = collapsed ? false : openGroups[item.id];
          const active = isGroupActive(item, location.pathname);

          return (
            <div key={item.id} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(item.id)}
                className={cn(
                  'flex h-11 w-full items-center gap-3 rounded-xl border-2 border-transparent px-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  active
                    ? 'border-slate-950 bg-[hsl(var(--neo-cyan))] text-slate-950 shadow-[4px_4px_0_hsl(var(--neo-shadow)/0.72)] dark:border-white dark:text-slate-950'
                    : 'text-slate-600 hover:border-slate-950 hover:bg-[hsl(var(--neo-lime)/0.65)] hover:text-slate-950 dark:text-slate-300 dark:hover:border-white dark:hover:text-slate-950',
                  collapsed && 'justify-center px-2',
                )}
                title={collapsed ? label : undefined}
                aria-expanded={isOpen}
              >
                <Icon size={19} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-start">{label}</span>
                    <ChevronDown
                      size={16}
                      className={cn('transition-transform', isOpen && 'rotate-180')}
                    />
                  </>
                )}
              </button>

              {isOpen && (
                <div className="ms-4 flex flex-col gap-1 border-s border-primary/15 ps-3 dark:border-primary/20">
                  {item.items.map((child) => (
                    <SidebarLink key={child.id} item={child} onNavigate={onNavigate} />
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <SidebarLink
            key={item.id}
            item={item}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        );
      })}
    </nav>
  );
}

function canShowItem(item, hasAllPermissions, hasAnyPermission) {
  if (!item.permissions?.length) return true;
  return item.permissionMode === 'any'
    ? hasAnyPermission(item.permissions)
    : hasAllPermissions(item.permissions);
}

function filterVisibleItems(items, hasAllPermissions, hasAnyPermission) {
  return items
    .map((item) => {
      if (item.items) {
        const children = filterVisibleItems(item.items, hasAllPermissions, hasAnyPermission);
        return children.length > 0 ? { ...item, items: children } : null;
      }

      return canShowItem(item, hasAllPermissions, hasAnyPermission) ? item : null;
    })
    .filter(Boolean);
}

function SidebarLink({ item, collapsed = false, onNavigate }) {
  const Icon = item.icon;
  const { t } = useTranslation(['layout']);
  const label = t(item.labelKey);

  if (item.disabled) {
    return (
      <div
        className={cn(
          'flex h-10 cursor-not-allowed items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-400 dark:text-slate-600',
          collapsed && 'justify-center px-2',
        )}
        title={collapsed ? label : t('navigation.comingSoon', { label })}
      >
        <Icon size={18} />
        {!collapsed && <span className="flex-1">{label}</span>}
      </div>
    );
  }

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'flex h-10 items-center gap-3 rounded-xl border-2 border-transparent px-3 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          isActive
            ? 'border-slate-950 bg-[hsl(var(--neo-cyan))] text-slate-950 shadow-[4px_4px_0_hsl(var(--neo-shadow)/0.72)] dark:border-white dark:text-slate-950'
            : 'text-slate-600 hover:border-slate-950 hover:bg-[hsl(var(--neo-lime)/0.65)] hover:text-slate-950 dark:text-slate-300 dark:hover:border-white dark:hover:text-slate-950',
          collapsed && 'justify-center px-2',
        )
      }
    >
      <Icon size={18} />
      {!collapsed && <span className="flex-1">{label}</span>}
    </NavLink>
  );
}
