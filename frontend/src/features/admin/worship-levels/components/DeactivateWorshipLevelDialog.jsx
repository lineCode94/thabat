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

function getErrorKey(error) {
  const code = error?.response?.data?.error?.code;

  if (code === 'WORSHIP_LEVEL_HAS_ACTIVE_USERS') return 'worshipLevels.errors.hasActiveUsers';
  if (code === 'NOT_FOUND') return 'worshipLevels.errors.notFound';

  return 'worshipLevels.errors.deactivateFailed';
}

export function DeactivateWorshipLevelDialog({
  error,
  isPending = false,
  level = null,
  onConfirm,
  onOpenChange,
  open,
}) {
  const { t } = useTranslation(['admin']);

  const closeDialog = (nextOpen) => {
    if (!isPending) onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle>{t('worshipLevels.deactivate.title')}</DialogTitle>
          <DialogDescription>
            {t('worshipLevels.deactivate.description', { name: level?.name ?? '' })}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {t(getErrorKey(error), {
              count: error?.response?.data?.error?.details?.activeUsers,
            })}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => closeDialog(false)} disabled={isPending}>
            {t('worshipLevels.actions.cancel')}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? t('worshipLevels.actions.deactivating') : t('worshipLevels.deactivate.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
