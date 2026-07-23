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

import { RegionService } from '../services/region.service';

function getRegionErrorKey(error) {
  const code = error?.response?.data?.error?.code;

  if (code === 'REGION_NAME_EXISTS') {
    return 'regions.errors.nameExists';
  }

  if (code === 'VALIDATION_ERROR') {
    return 'regions.errors.validation';
  }

  return 'regions.errors.saveFailed';
}

export function RegionFormDialog({ onOpenChange, open, region = null }) {
  const { t } = useTranslation(['admin']);
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const isEditing = Boolean(region?.id);

  useEffect(() => {
    setName(region?.name ?? '');
    setDescription(region?.description ?? '');
  }, [open, region]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
      };

      if (isEditing) {
        return RegionService.update(region.id, payload);
      }

      return RegionService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'regions'] });
      onOpenChange(false);
    },
  });

  const canSubmit = useMemo(
    () => name.trim().length > 0 && !mutation.isPending,
    [mutation.isPending, name],
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
            {isEditing ? t('regions.dialog.editTitle') : t('regions.dialog.createTitle')}
          </DialogTitle>
          <DialogDescription>{t('regions.dialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="region-name">{t('regions.form.name')}</Label>
            <Input
              id="region-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('regions.form.namePlaceholder')}
              disabled={mutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="region-description">{t('regions.form.description')}</Label>
            <textarea
              id="region-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t('regions.form.descriptionPlaceholder')}
              disabled={mutation.isPending}
              rows={4}
              className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {mutation.isError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {t(getRegionErrorKey(mutation.error))}
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
            {t('regions.actions.cancel')}
          </Button>
          <Button type="button" onClick={() => mutation.mutate()} disabled={!canSubmit}>
            {mutation.isPending ? t('regions.actions.saving') : t('regions.actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
