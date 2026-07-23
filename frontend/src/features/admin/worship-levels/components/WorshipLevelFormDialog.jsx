import { useMutation, useQueryClient } from '@tanstack/react-query';
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

import { WorshipLevelService } from '../services/worship-level.service';

function getErrorKey(error) {
  const code = error?.response?.data?.error?.code;

  if (code === 'WORSHIP_LEVEL_NAME_EXISTS') return 'worshipLevels.errors.nameExists';
  if (code === 'WORSHIP_LEVEL_ORDER_EXISTS') return 'worshipLevels.errors.orderExists';
  if (code === 'VALIDATION_ERROR') return 'worshipLevels.errors.validation';

  return 'worshipLevels.errors.saveFailed';
}

export function WorshipLevelFormDialog({ level = null, open, onOpenChange }) {
  const { t } = useTranslation(['admin']);
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [order, setOrder] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const isEditing = Boolean(level?.id);

  useEffect(() => {
    setName(level?.name ?? '');
    setOrder(level?.order ? String(level.order) : '');
    setDescription(level?.description ?? '');
    setIsActive(level?.isActive ?? true);
  }, [level, open]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        order: Number(order),
        description: description.trim() || null,
        isActive,
      };

      return isEditing
        ? WorshipLevelService.update(level.id, payload)
        : WorshipLevelService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'worship-levels'] });
      queryClient.invalidateQueries({ queryKey: ['worshipLevels'] });
      onOpenChange(false);
    },
  });

  const canSubmit = useMemo(
    () => name.trim().length > 0 && Number(order) > 0 && !mutation.isPending,
    [mutation.isPending, name, order],
  );

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
          <DialogTitle>
            {isEditing ? t('worshipLevels.dialog.editTitle') : t('worshipLevels.dialog.createTitle')}
          </DialogTitle>
          <DialogDescription>{t('worshipLevels.dialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="worship-level-name">{t('worshipLevels.form.name')}</Label>
            <Input
              id="worship-level-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('worshipLevels.form.namePlaceholder')}
              disabled={mutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="worship-level-order">{t('worshipLevels.form.order')}</Label>
            <Input
              id="worship-level-order"
              type="number"
              min="1"
              value={order}
              onChange={(event) => setOrder(event.target.value)}
              disabled={mutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="worship-level-description">{t('worshipLevels.form.description')}</Label>
            <textarea
              id="worship-level-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t('worshipLevels.form.descriptionPlaceholder')}
              disabled={mutation.isPending}
              rows={4}
              className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <label className="flex items-center gap-2 rounded-xl border p-3">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              disabled={mutation.isPending}
              className="size-4"
            />
            <span className="text-sm font-medium">{t('worshipLevels.form.isActive')}</span>
          </label>

          {mutation.isError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {t(getErrorKey(mutation.error))}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => closeDialog(false)} disabled={mutation.isPending}>
            {t('worshipLevels.actions.cancel')}
          </Button>
          <Button type="button" onClick={() => mutation.mutate()} disabled={!canSubmit}>
            {mutation.isPending ? t('worshipLevels.actions.saving') : t('worshipLevels.actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
