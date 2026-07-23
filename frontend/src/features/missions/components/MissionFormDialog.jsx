import { useMutation, useQueryClient } from '@tanstack/react-query';
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

import { MissionService } from '../services/mission.service';

function getErrorMessage(error, t) {
  const code = error?.response?.data?.error?.code;
  if (code) return t(`errors.${code}`, { defaultValue: t('errors.default') });
  return t('errors.default');
}

export function MissionFormDialog({ mission, open, onOpenChange }) {
  const { t } = useTranslation(['missions']);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    description: '',
    bonusXP: 0,
    isActive: true,
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      title: mission?.title ?? '',
      description: mission?.description ?? '',
      bonusXP: mission?.bonusXP ?? 0,
      isActive: mission?.isActive ?? true,
    });
  }, [mission, open]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        title: form.title,
        description: form.description || null,
        bonusXP: Number(form.bonusXP) || 0,
        isActive: form.isActive,
      };

      return mission?.id
        ? MissionService.update(mission.id, payload)
        : MissionService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      onOpenChange(false);
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mission ? t('form.editTitle') : t('form.createTitle')}
          </DialogTitle>
          <DialogDescription>{t('form.description')}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium">{t('form.title')}</span>
            <input
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">{t('form.details')}</span>
            <textarea
              className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">{t('form.bonusXP')}</span>
            <input
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
              type="number"
              min="0"
              value={form.bonusXP}
              onChange={(event) => setForm((current) => ({ ...current, bonusXP: event.target.value }))}
            />
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-3 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
            />
            {t('form.active')}
          </label>

          {mutation.isError && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {getErrorMessage(mutation.error, t)}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('actions.saving') : t('actions.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
