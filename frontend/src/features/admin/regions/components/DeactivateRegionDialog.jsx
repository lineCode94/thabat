import { AlertTriangle } from 'lucide-react';
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

function getDeactivateErrorKey(error) {
  const code = error?.response?.data?.error?.code;

  if (code === 'REGION_HAS_USERS') {
    return 'regions.errors.hasUsers';
  }

  if (code === 'NOT_FOUND') {
    return 'regions.errors.notFound';
  }

  return 'regions.errors.deactivateFailed';
}

export function DeactivateRegionDialog({
  error,
  isPending = false,
  onConfirm,
  onOpenChange,
  open,
  region = null,
}) {
  const { t } = useTranslation(['admin']);

  const closeDialog = (nextOpen) => {
    if (!isPending) {
      onOpenChange(nextOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle>{t('regions.deactivate.title')}</DialogTitle>
          <DialogDescription>
            {t('regions.deactivate.description', { name: region?.name ?? '' })}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {t(getDeactivateErrorKey(error), {
              count: error?.response?.data?.error?.details?.usersCount,
            })}
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => closeDialog(false)}
            disabled={isPending}
          >
            {t('regions.actions.cancel')}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? t('regions.actions.deactivating') : t('regions.deactivate.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
