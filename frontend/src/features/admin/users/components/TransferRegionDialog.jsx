import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RegionService } from '@/features/admin/regions/services/region.service';

import { AdminUserService } from '../services/admin-user.service';

function getTransferErrorKey(error) {
  const code = error?.response?.data?.error?.code;

  if (code === 'FORBIDDEN') {
    return 'users.errors.forbidden';
  }

  if (code === 'BAD_REQUEST') {
    return 'users.errors.regionInvalid';
  }

  return 'users.errors.transferFailed';
}

export function TransferRegionDialog({ onOpenChange, open, user = null }) {
  const { t } = useTranslation(['admin']);
  const queryClient = useQueryClient();
  const [regionId, setRegionId] = useState('');

  useEffect(() => {
    setRegionId(user?.regionId ?? '');
  }, [open, user]);

  const regionsQuery = useQuery({
    queryKey: ['admin', 'regions', 'transfer-user'],
    queryFn: () => RegionService.list(),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: () => AdminUserService.transferRegion(user.id, { regionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      onOpenChange(false);
    },
  });

  const closeDialog = (nextOpen) => {
    if (!mutation.isPending) {
      mutation.reset();
      onOpenChange(nextOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('users.transfer.title')}</DialogTitle>
          <DialogDescription>
            {t('users.transfer.description', { name: user?.fullName ?? '' })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>{t('users.form.region')}</Label>
          <Select
            value={regionId}
            onValueChange={setRegionId}
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
        </div>

        {mutation.isError && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {t(getTransferErrorKey(mutation.error))}
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => closeDialog(false)}
            disabled={mutation.isPending}
          >
            {t('users.actions.cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={!regionId || regionId === user?.regionId || mutation.isPending}
          >
            {mutation.isPending ? t('users.actions.saving') : t('users.transfer.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
