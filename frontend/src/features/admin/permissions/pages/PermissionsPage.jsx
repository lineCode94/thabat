import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, KeyRound, RotateCcw, Save, Search, ShieldCheck, Trash2, UserCog } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AdminUserService } from '@/features/admin/users/services/admin-user.service';
import { usePermissionContext } from '@/features/auth/hooks/usePermissionContext';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useLayoutStore } from '@/store/useLayoutStore';

import { AdminPermissionService } from '../services/admin-permission.service';

const ROLE_LABELS = {
  ar: {
    USER: 'مستخدم',
    MENTOR: 'متابع',
    REGION_ADMIN: 'مسؤول منطقة',
    SUPER_ADMIN: 'مسؤول عام',
  },
  en: {
    USER: 'User',
    MENTOR: 'Mentor',
    REGION_ADMIN: 'Region Admin',
    SUPER_ADMIN: 'Super Admin',
  },
};

const PERMISSION_LABELS = {
  'dashboard.view': { ar: 'عرض لوحة التحكم', en: 'View dashboard' },
  'users.manage_all': { ar: 'إدارة كل المستخدمين', en: 'Manage all users' },
  'users.manage_region': { ar: 'إدارة مستخدمي المنطقة', en: 'Manage region users' },
  'users.view_assigned': { ar: 'عرض المستخدمين المعيّنين', en: 'View assigned users' },
  'users.view_self': { ar: 'عرض الملف الشخصي', en: 'View own profile' },
  'users.create': { ar: 'إنشاء مستخدمين', en: 'Create users' },
  'users.delete': { ar: 'حذف/أرشفة حسابات', en: 'Delete/archive users' },
  'users.assign': { ar: 'تعيين المستخدمين للمتابعين', en: 'Assign users to mentors' },
  'users.transfer_region': { ar: 'نقل المستخدم بين المناطق', en: 'Transfer users between regions' },
  'users.transfer_mentor': { ar: 'نقل المستخدم بين المتابعين', en: 'Transfer users between mentors' },
  'regions.manage': { ar: 'إدارة المناطق', en: 'Manage regions' },
  'regions.view_own': { ar: 'عرض المنطقة الخاصة', en: 'View own region' },
  'mentors.manage': { ar: 'إدارة المتابعين', en: 'Manage mentors' },
  'levels.manage': { ar: 'إدارة المستويات', en: 'Manage levels' },
  'levels.promote': { ar: 'اعتماد الترقيات', en: 'Approve promotions' },
  'levels.view': { ar: 'عرض المستويات', en: 'View levels' },
  'worship.categories.manage': { ar: 'إدارة فئات العبادة', en: 'Manage worship categories' },
  'worship.items.manage': { ar: 'إدارة بنود العبادة', en: 'Manage worship items' },
  'worship.view': { ar: 'عرض بنود العبادة', en: 'View worship items' },
  'tracking.manage_all': { ar: 'إدارة كل المتابعة', en: 'Manage all tracking' },
  'tracking.manage_region': { ar: 'إدارة متابعة المنطقة', en: 'Manage region tracking' },
  'tracking.review_assigned': { ar: 'مراجعة متابعة المعيّنين', en: 'Review assigned tracking' },
  'tracking.manage_self': { ar: 'إدارة المتابعة الشخصية', en: 'Manage own tracking' },
  'reviews.manage_all': { ar: 'إدارة كل المراجعات', en: 'Manage all reviews' },
  'reviews.manage_region': { ar: 'إدارة مراجعات المنطقة', en: 'Manage region reviews' },
  'reviews.manage_assigned': { ar: 'إدارة مراجعات المعيّنين', en: 'Manage assigned reviews' },
  'reviews.view_own': { ar: 'عرض مراجعاتي', en: 'View own reviews' },
  'missions.manage_all': { ar: 'إدارة كل المهام', en: 'Manage all missions' },
  'missions.manage_region': { ar: 'إدارة مهام المنطقة', en: 'Manage region missions' },
  'missions.assign': { ar: 'تعيين المهام', en: 'Assign missions' },
  'missions.view_own': { ar: 'عرض مهامي', en: 'View own missions' },
  'reports.view_all': { ar: 'عرض كل التقارير', en: 'View all reports' },
  'reports.view_region': { ar: 'عرض تقارير المنطقة', en: 'View region reports' },
  'reports.view_assigned': { ar: 'عرض تقارير المعيّنين', en: 'View assigned reports' },
  'reports.view_own': { ar: 'عرض تقاريري', en: 'View own reports' },
  'notifications.manage_all': { ar: 'إدارة كل الإشعارات', en: 'Manage all notifications' },
  'notifications.manage_region': { ar: 'إدارة إشعارات المنطقة', en: 'Manage region notifications' },
  'notifications.view_assigned': { ar: 'عرض إشعارات المعيّنين', en: 'View assigned notifications' },
  'notifications.view_own': { ar: 'عرض إشعاراتي', en: 'View own notifications' },
  'audit_logs.view': { ar: 'عرض سجل التدقيق', en: 'View audit logs' },
  'settings.manage_system': { ar: 'إدارة إعدادات النظام', en: 'Manage system settings' },
  'settings.manage_region': { ar: 'إدارة إعدادات المنطقة', en: 'Manage region settings' },
  'settings.manage_profile': { ar: 'إدارة إعدادات الحساب', en: 'Manage profile settings' },
  'profile.update_own': { ar: 'تعديل الملف الشخصي', en: 'Update own profile' },
  'badges.manage': { ar: 'إدارة الأوسمة', en: 'Manage badges' },
  'badges.view': { ar: 'عرض الأوسمة', en: 'View badges' },
  'achievements.manage': { ar: 'إدارة الإنجازات', en: 'Manage achievements' },
  'achievements.view': { ar: 'عرض الإنجازات', en: 'View achievements' },
  'encouragement.send': { ar: 'إرسال التشجيع', en: 'Send encouragement' },
  'mentor_notes.manage': { ar: 'إدارة ملاحظات المتابع', en: 'Manage mentor notes' },
  'weeks.reopen': { ar: 'إعادة فتح الأسابيع', en: 'Reopen weeks' },
  'region_admins.assign': { ar: 'تعيين مسؤولي المناطق', en: 'Assign region admins' },
};

const MODULE_LABELS = {
  ar: {
    dashboard: 'لوحة التحكم',
    users: 'المستخدمون',
    regions: 'المناطق',
    mentors: 'المتابعون',
    levels: 'المستويات',
    worship: 'العبادات',
    tracking: 'المتابعة',
    reviews: 'المراجعات',
    missions: 'المهام',
    reports: 'التقارير',
    notifications: 'الإشعارات',
    audit_logs: 'سجل التدقيق',
    settings: 'الإعدادات',
    profile: 'الملف الشخصي',
    badges: 'الأوسمة',
    achievements: 'الإنجازات',
    encouragement: 'التشجيع',
    mentor_notes: 'ملاحظات المتابع',
    weeks: 'الأسابيع',
    region_admins: 'مسؤولو المناطق',
  },
  en: {},
};

const copy = {
  ar: {
    eyebrow: 'إدارة النظام',
    title: 'الصلاحيات',
    description: 'غيّر صلاحيات الأدوار أو دور مستخدم معيّن من نفس الصفحة.',
    roleTab: 'صلاحيات الأدوار',
    userTab: 'المستخدمون',
    roles: 'الأدوار',
    rolesDescription: 'اختر الدور الذي تريد تعديل صلاحياته.',
    permissions: 'صلاحيات الدور',
    permissionsDescription: 'أضف أو احذف الصلاحيات من الدور المختار.',
    searchPermissions: 'ابحث في الصلاحيات',
    searchUsers: 'ابحث باسم المستخدم أو البريد',
    users: 'مستخدم',
    selected: 'مفعلة',
    save: 'حفظ الصلاحيات',
    saving: 'جار الحفظ',
    reset: 'إلغاء التغييرات',
    saved: 'تم حفظ الصلاحيات',
    failed: 'تعذر حفظ الصلاحيات',
    loadFailed: 'تعذر تحميل الصلاحيات',
    emptyTitle: 'لا توجد نتائج',
    emptyDescription: 'لم يتم العثور على نتائج مطابقة.',
    userDirectory: 'تغيير أدوار المستخدمين',
    userDirectoryDescription: 'غيّر المستخدم إلى متابع أو مسؤول منطقة أو مستخدم عادي.',
    name: 'الاسم',
    email: 'البريد',
    role: 'الدور',
    region: 'المنطقة',
    status: 'الحالة',
    actions: 'الإجراءات',
    active: 'نشط',
    inactive: 'غير نشط',
    roleSaved: 'تم تغيير دور المستخدم',
    roleSaveFailed: 'تعذر تغيير دور المستخدم',
    delete: 'حذف',
    deleting: 'جار الحذف',
    deleted: 'تم حذف الحساب',
    deleteFailed: 'تعذر حذف الحساب',
    confirmDelete: 'هل تريد حذف/أرشفة هذا الحساب؟',
  },
  en: {
    eyebrow: 'System Administration',
    title: 'Permissions',
    description: 'Change role permissions or change an individual user role from one page.',
    roleTab: 'Role permissions',
    userTab: 'Users',
    roles: 'Roles',
    rolesDescription: 'Choose the role you want to edit.',
    permissions: 'Role Permissions',
    permissionsDescription: 'Add or remove permissions from the selected role.',
    searchPermissions: 'Search permissions',
    searchUsers: 'Search users by name or email',
    users: 'users',
    selected: 'selected',
    save: 'Save permissions',
    saving: 'Saving',
    reset: 'Discard changes',
    saved: 'Permissions saved',
    failed: 'Could not save permissions',
    loadFailed: 'Could not load permissions',
    emptyTitle: 'No results',
    emptyDescription: 'No matching results were found.',
    userDirectory: 'Change user roles',
    userDirectoryDescription: 'Change a user to Mentor, Region Admin, Super Admin, or regular User.',
    name: 'Name',
    email: 'Email',
    role: 'Role',
    region: 'Region',
    status: 'Status',
    actions: 'Actions',
    active: 'Active',
    inactive: 'Inactive',
    roleSaved: 'User role updated',
    roleSaveFailed: 'Could not update user role',
    delete: 'Delete',
    deleting: 'Deleting',
    deleted: 'Account deleted',
    deleteFailed: 'Could not delete account',
    confirmDelete: 'Delete/archive this account?',
  },
};

const selectedSurfaceClass = 'border-cyan-500/45 bg-cyan-50 text-slate-950 shadow-[0_0_0_1px_rgba(8,145,178,0.12)] dark:border-cyan-400/45 dark:bg-cyan-950/35 dark:text-cyan-50 dark:shadow-[0_0_0_1px_rgba(103,232,249,0.12)]';
const idleSurfaceClass = 'border-border bg-background text-foreground hover:bg-muted dark:border-slate-700/80 dark:bg-slate-950/35 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-900/70';
const selectedPermissionClass = 'border-cyan-500/40 bg-cyan-50 shadow-[inset_3px_0_0_rgba(8,145,178,0.75)] dark:border-cyan-400/40 dark:bg-slate-900/80 dark:shadow-[inset_3px_0_0_rgba(34,211,238,0.75)]';
const idlePermissionClass = 'border-border bg-background hover:bg-muted dark:border-slate-700/80 dark:bg-slate-950/35 dark:hover:border-slate-500 dark:hover:bg-slate-900/70';

function groupPermissions(permissions = []) {
  return permissions.reduce((groups, permission) => {
    const moduleName = permission.module || 'other';
    if (!groups[moduleName]) groups[moduleName] = [];
    groups[moduleName].push(permission);
    return groups;
  }, {});
}

function PermissionsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Skeleton className="h-80 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

function getPermissionLabel(permission, language) {
  return PERMISSION_LABELS[permission.code]?.[language] ?? permission.name;
}

function getModuleLabel(moduleName, language) {
  return MODULE_LABELS[language]?.[moduleName] ?? moduleName;
}

function getRoleLabel(role, language) {
  return ROLE_LABELS[language]?.[role?.code] ?? role?.name ?? role?.code;
}

export function PermissionsPage() {
  const queryClient = useQueryClient();
  const { language } = useLayoutStore();
  const { hasPermission } = usePermissionContext();
  const authUser = useAuthStore((state) => state.user);
  const t = copy[language] ?? copy.en;
  const canDeleteUsers = hasPermission('users.delete')
    || hasPermission('settings.manage_system')
    || authUser?.role?.code === 'SUPER_ADMIN';
  const [activeTab, setActiveTab] = useState('roles');
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [draftPermissions, setDraftPermissions] = useState([]);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const permissionsQuery = useQuery({
    queryKey: ['admin', 'permissions'],
    queryFn: AdminPermissionService.list,
  });

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', 'permissions-page', userSearch],
    queryFn: () => AdminUserService.list({
      limit: 100,
      ...(userSearch.trim() ? { search: userSearch.trim() } : {}),
    }),
    enabled: activeTab === 'users',
  });

  const roles = useMemo(() => permissionsQuery.data?.roles ?? [], [permissionsQuery.data?.roles]);
  const permissions = useMemo(() => permissionsQuery.data?.permissions ?? [], [permissionsQuery.data?.permissions]);
  const users = useMemo(() => usersQuery.data?.users ?? [], [usersQuery.data?.users]);
  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0] ?? null;

  useEffect(() => {
    if (!selectedRoleId && roles[0]?.id) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  useEffect(() => {
    setDraftPermissions(selectedRole?.permissions ?? []);
  }, [selectedRole?.id, selectedRole?.permissions]);

  const filteredPermissions = useMemo(() => {
    const term = permissionSearch.trim().toLowerCase();
    if (!term) return permissions;

    return permissions.filter((permission) => (
      permission.code.toLowerCase().includes(term)
      || getPermissionLabel(permission, language).toLowerCase().includes(term)
      || getModuleLabel(permission.module, language).toLowerCase().includes(term)
    ));
  }, [language, permissionSearch, permissions]);

  const groupedPermissions = useMemo(
    () => groupPermissions(filteredPermissions),
    [filteredPermissions],
  );

  const draftSet = useMemo(() => new Set(draftPermissions), [draftPermissions]);
  const selectedSet = useMemo(() => new Set(selectedRole?.permissions ?? []), [selectedRole?.permissions]);
  const isDirty = draftPermissions.length !== selectedSet.size
    || draftPermissions.some((permission) => !selectedSet.has(permission));

  const rolePermissionsMutation = useMutation({
    mutationFn: () => AdminPermissionService.updateRolePermissions(selectedRole.id, draftPermissions),
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'permissions'], data);
      queryClient.invalidateQueries({ queryKey: ['me', 'permissions'] });
      toast.success(t.saved);
    },
    onError: () => toast.error(t.failed),
  });

  const userRoleMutation = useMutation({
    mutationFn: ({ user, roleId }) => AdminUserService.update(user.id, { roleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'permissions'] });
      queryClient.invalidateQueries({ queryKey: ['me', 'permissions'] });
      toast.success(t.roleSaved);
    },
    onError: () => toast.error(t.roleSaveFailed),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (user) => AdminUserService.delete(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'permissions'] });
      toast.success(t.deleted);
    },
    onError: () => toast.error(t.deleteFailed),
  });

  const togglePermission = (permissionCode) => {
    setDraftPermissions((current) => (
      current.includes(permissionCode)
        ? current.filter((code) => code !== permissionCode)
        : [...current, permissionCode]
    ));
  };

  const resetDraft = () => setDraftPermissions(selectedRole?.permissions ?? []);

  const confirmDeleteUser = (user) => {
    if (window.confirm(`${t.confirmDelete}\n${user.fullName} - ${user.email}`)) {
      deleteUserMutation.mutate(user);
    }
  };

  if (permissionsQuery.isLoading) return <PermissionsSkeleton />;

  if (permissionsQuery.isError) {
    return (
      <EmptyState
        icon={KeyRound}
        title={t.loadFailed}
        description={t.emptyDescription}
        action={(
          <Button type="button" variant="outline" onClick={() => permissionsQuery.refetch()}>
            <RotateCcw className="h-4 w-4" />
            {t.reset}
          </Button>
        )}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary rtl:normal-case rtl:tracking-normal">
            {t.eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{t.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{t.description}</p>
        </div>
        {activeTab === 'roles' && (
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={resetDraft} disabled={!isDirty || rolePermissionsMutation.isPending}>
              <RotateCcw className="h-4 w-4" />
              {t.reset}
            </Button>
            <Button type="button" onClick={() => rolePermissionsMutation.mutate()} disabled={!selectedRole || !isDirty || rolePermissionsMutation.isPending}>
              <Save className="h-4 w-4" />
              {rolePermissionsMutation.isPending ? t.saving : t.save}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border">
        <Button
          type="button"
          variant={activeTab === 'roles' ? 'default' : 'ghost'}
          className="rounded-b-none"
          onClick={() => setActiveTab('roles')}
        >
          <ShieldCheck className="h-4 w-4" />
          {t.roleTab}
        </Button>
        <Button
          type="button"
          variant={activeTab === 'users' ? 'default' : 'ghost'}
          className="rounded-b-none"
          onClick={() => setActiveTab('users')}
        >
          <UserCog className="h-4 w-4" />
          {t.userTab}
        </Button>
      </div>

      {activeTab === 'roles' && (
        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>{t.roles}</CardTitle>
              <CardDescription>{t.rolesDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRoleId(role.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md border px-3 py-3 text-start transition-colors',
                    selectedRole?.id === role.id
                      ? selectedSurfaceClass
                      : idleSurfaceClass,
                  )}
                >
                  <span>
                    <span className="block text-sm font-semibold">{getRoleLabel(role, language)}</span>
                    <span className="block text-xs text-muted-foreground">{role.code}</span>
                  </span>
                  <Badge variant="secondary">{role.userCount ?? 0} {t.users}</Badge>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{t.permissions}</CardTitle>
                  <CardDescription>{t.permissionsDescription}</CardDescription>
                </div>
                <Badge variant="success">
                  <Check className="me-1 h-3 w-3" />
                  {draftPermissions.length} {t.selected}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={permissionSearch}
                  onChange={(event) => setPermissionSearch(event.target.value)}
                  placeholder={t.searchPermissions}
                  className="ps-9"
                />
              </div>

              {filteredPermissions.length === 0 && (
                <EmptyState icon={ShieldCheck} title={t.emptyTitle} description={t.emptyDescription} />
              )}

              {Object.entries(groupedPermissions).map(([moduleName, modulePermissions]) => (
                <section key={moduleName} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold uppercase text-muted-foreground">
                      {getModuleLabel(moduleName, language)}
                    </h2>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {modulePermissions.map((permission) => {
                      const checked = draftSet.has(permission.code);

                      return (
                        <label
                          key={permission.id}
                          className={cn(
                            'flex min-h-20 cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors',
                            checked ? selectedPermissionClass : idlePermissionClass,
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePermission(permission.code)}
                            className="mt-1 h-4 w-4 accent-primary"
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold">{getPermissionLabel(permission, language)}</span>
                            <span className="mt-1 block break-all text-xs text-muted-foreground">{permission.code}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </section>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle>{t.userDirectory}</CardTitle>
            <CardDescription>{t.userDirectoryDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative max-w-xl">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder={t.searchUsers}
                className="ps-9"
              />
            </div>

            {usersQuery.isLoading && <Skeleton className="h-72 w-full" />}

            {usersQuery.isError && (
              <EmptyState icon={UserCog} title={t.emptyTitle} description={t.emptyDescription} />
            )}

            {!usersQuery.isLoading && !usersQuery.isError && users.length === 0 && (
              <EmptyState icon={UserCog} title={t.emptyTitle} description={t.emptyDescription} />
            )}

            {!usersQuery.isLoading && !usersQuery.isError && users.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.name}</TableHead>
                    <TableHead>{t.email}</TableHead>
                    <TableHead>{t.role}</TableHead>
                    <TableHead>{t.region}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead className="text-end">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.roleId}
                          onValueChange={(roleId) => userRoleMutation.mutate({ user, roleId })}
                          disabled={userRoleMutation.isPending}
                        >
                          <SelectTrigger className="min-w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {getRoleLabel(role, language)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{user.region?.name}</TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'success' : 'secondary'}>
                          {user.isActive ? t.active : t.inactive}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-end">
                        {canDeleteUsers && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => confirmDeleteUser(user)}
                            disabled={deleteUserMutation.isPending || user.id === authUser?.id}
                          >
                            <Trash2 className="h-4 w-4" />
                            {deleteUserMutation.isPending ? t.deleting : t.delete}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
