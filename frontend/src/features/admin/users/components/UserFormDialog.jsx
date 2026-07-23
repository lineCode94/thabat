import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RegionService } from '@/features/admin/regions/services/region.service';
import { usePermissionContext } from '@/features/auth/hooks/usePermissionContext';
import { useAuthStore } from '@/store/useAuthStore';

import { AdminUserService } from '../services/admin-user.service';

const ELEVATED_ROLE_CODES = ['REGION_ADMIN', 'SUPER_ADMIN'];

function getUserSaveErrorKey(error) {
  const code = error?.response?.data?.error?.code;

  if (code === 'EMAIL_ALREADY_IN_USE' || code === 'BAD_REQUEST') {
    return 'users.errors.emailInUse';
  }

  if (code === 'VALIDATION_ERROR') {
    return 'users.errors.validation';
  }

  if (code === 'FORBIDDEN') {
    return 'users.errors.forbidden';
  }

  return 'users.errors.saveFailed';
}

export function UserFormDialog({
  onOpenChange,
  open,
  roles = [],
  user = null,
}) {
  const { t } = useTranslation(['admin']);
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const { hasPermission } = usePermissionContext();
  const canManageAll = hasPermission('users.manage_all');
  const canAssignRegionAdmins = hasPermission('region_admins.assign');
  const isEditing = Boolean(user?.id);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    roleId: '',
    regionId: '',
    phone: '',
  });

  const regionsQuery = useQuery({
    queryKey: ['admin', 'regions', 'user-form'],
    queryFn: () => RegionService.list(),
    enabled: open && canManageAll,
  });

  useEffect(() => {
    setForm({
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
      password: '',
      roleId: user?.roleId ?? user?.role?.id ?? '',
      regionId: user?.regionId ?? authUser?.regionId ?? '',
      phone: user?.phone ?? '',
    });
  }, [authUser?.regionId, open, user]);

  const allowedRoles = useMemo(() => roles.filter((role) => (
    canAssignRegionAdmins || !ELEVATED_ROLE_CODES.includes(role.code)
  )), [canAssignRegionAdmins, roles]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        roleId: form.roleId,
        regionId: canManageAll ? form.regionId : authUser?.regionId,
      };
      const phone = form.phone.trim();

      if (phone) {
        payload.phone = phone;
      } else if (isEditing) {
        payload.phone = null;
      }

      if (!isEditing) {
        payload.password = form.password;
      }

      if (isEditing) {
        delete payload.regionId;
        return AdminUserService.update(user.id, payload);
      }

      return AdminUserService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      onOpenChange(false);
    },
  });

  const canSubmit = (
    form.fullName.trim().length >= 2
    && form.email.trim().length > 0
    && form.roleId
    && (canManageAll ? form.regionId : authUser?.regionId)
    && (isEditing || form.password.length >= 8)
    && !mutation.isPending
  );

  const closeDialog = (nextOpen) => {
    if (!mutation.isPending) {
      mutation.reset();
      onOpenChange(nextOpen);
    }
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const selectedRegionName = user?.region?.name ?? authUser?.region?.name;

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('users.dialog.editTitle') : t('users.dialog.createTitle')}
          </DialogTitle>
          <DialogDescription>{t('users.dialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="admin-user-name">{t('users.form.fullName')}</Label>
            <Input
              id="admin-user-name"
              value={form.fullName}
              onChange={(event) => updateField('fullName', event.target.value)}
              disabled={mutation.isPending}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="admin-user-email">{t('users.form.email')}</Label>
            <Input
              id="admin-user-email"
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              disabled={mutation.isPending}
            />
          </div>

          {!isEditing && (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="admin-user-password">{t('users.form.password')}</Label>
              <Input
                id="admin-user-password"
                type="password"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                disabled={mutation.isPending}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('users.form.role')}</Label>
            <Select
              value={form.roleId}
              onValueChange={(value) => updateField('roleId', value)}
              disabled={mutation.isPending || allowedRoles.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('users.form.rolePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {allowedRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {t(`users.roles.${role.code}`, { defaultValue: role.name })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('users.form.region')}</Label>
            {canManageAll && !isEditing ? (
              <Select
                value={form.regionId}
                onValueChange={(value) => updateField('regionId', value)}
                disabled={mutation.isPending || regionsQuery.isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('users.form.regionPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {(regionsQuery.data ?? []).map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="rounded-md border border-input bg-muted/40 px-3 py-2 text-sm">
                {selectedRegionName ?? t('users.form.ownRegionLocked')}
              </div>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="admin-user-phone">{t('users.form.phone')}</Label>
            <Input
              id="admin-user-phone"
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              disabled={mutation.isPending}
            />
          </div>

          {mutation.isError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2">
              {t(getUserSaveErrorKey(mutation.error))}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => closeDialog(false)}
            disabled={mutation.isPending}
          >
            {t('users.actions.cancel')}
          </Button>
          <Button type="button" onClick={() => mutation.mutate()} disabled={!canSubmit}>
            {mutation.isPending ? t('users.actions.saving') : t('users.actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
