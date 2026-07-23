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

function getUserActionErrorKey(error) {
  const code = error?.response?.data?.error?.code;

  if (code === 'FORBIDDEN') {
    return 'users.errors.forbidden';
  }

  if (code === 'NOT_FOUND') {
    return 'users.errors.notFound';
  }

  return 'users.errors.statusChangeFailed';
}

export function DeactivateUserDialog({
  error,
  isPending = false,
  mode = 'deactivate',
  onConfirm,
  onOpenChange,
  open,
  user = null,
}) {
  const { t } = useTranslation(['admin']);
  const isReactivate = mode === 'reactivate';

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
          <DialogTitle>
            {isReactivate ? t('users.reactivate.title') : t('users.deactivate.title')}
          </DialogTitle>
          <DialogDescription>
            {isReactivate
              ? t('users.reactivate.description', { name: user?.fullName ?? '' })
              : t('users.deactivate.description', { name: user?.fullName ?? '' })}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {t(getUserActionErrorKey(error))}
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => closeDialog(false)}
            disabled={isPending}
          >
            {t('users.actions.cancel')}
          </Button>
          <Button
            type="button"
            variant={isReactivate ? 'default' : 'destructive'}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending
              ? t('users.actions.saving')
              : isReactivate
                ? t('users.reactivate.confirm')
                : t('users.deactivate.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
