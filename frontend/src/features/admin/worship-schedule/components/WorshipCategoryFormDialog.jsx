import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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

import { WorshipScheduleService } from '../services/worship-schedule.service';

export function WorshipCategoryFormDialog({ open, onOpenChange }) {
  const { t } = useTranslation(['admin']);
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  const mutation = useMutation({
    mutationFn: () => WorshipScheduleService.createCategory({ name: name.trim(), isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'worship-schedule'] });
      setName('');
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('worshipSchedule.categoryDialog.title')}</DialogTitle>
          <DialogDescription>{t('worshipSchedule.categoryDialog.description')}</DialogDescription>
        </DialogHeader>
        <label className="space-y-2">
          <span className="text-sm font-medium">{t('worshipSchedule.categoryDialog.name')}</span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('worshipSchedule.categoryDialog.namePlaceholder')}
          />
        </label>
        {mutation.isError && (
          <p className="text-sm text-destructive">{t('worshipSchedule.errors.categorySaveFailed')}</p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('worshipSchedule.actions.cancel')}
          </Button>
          <Button type="button" onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending}>
            {mutation.isPending ? t('worshipSchedule.actions.saving') : t('worshipSchedule.categoryDialog.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
