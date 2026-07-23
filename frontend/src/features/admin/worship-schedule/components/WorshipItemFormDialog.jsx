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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { WorshipScheduleService } from '../services/worship-schedule.service';

const INPUT_TYPES = ['BOOLEAN', 'COUNT', 'DURATION', 'TEXT'];
const DAYS = [0, 1, 2, 3, 4, 5, 6];

function isInDailySchedule(item) {
  return (item?.levelRequirements ?? []).some((requirement) => requirement.worshipLevel?.isActive);
}

function toFormState(item, categories) {
  return {
    title: item?.title ?? '',
    categoryId: item?.categoryId ?? item?.category?.id ?? categories[0]?.id ?? '',
    inputType: item?.inputType ?? 'BOOLEAN',
    score: String(item?.score ?? 0),
    xp: String(item?.xp ?? item?.score ?? 0),
    targetValue: item?.targetValue ? String(item.targetValue) : '',
    order: String(item?.order ?? 0),
    daysOfWeek: item?.daysOfWeek ?? [],
    isActive: item?.isActive ?? true,
    includeInDailySchedule: isInDailySchedule(item),
  };
}

export function WorshipItemFormDialog({ categories = [], item, open, onOpenChange }) {
  const { t } = useTranslation(['admin']);
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => toFormState(item, categories));

  useEffect(() => {
    setForm(toFormState(item, categories));
  }, [categories, item, open]);

  const isEditing = Boolean(item?.id);
  const canSubmit = form.title.trim() && form.categoryId;

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title.trim(),
        categoryId: form.categoryId,
        inputType: form.inputType,
        score: Number(form.score || 0),
        xp: Number(form.xp || form.score || 0),
        order: Number(form.order || 0),
        isActive: form.isActive,
        daysOfWeek: form.daysOfWeek,
      };

      if (form.targetValue) {
        payload.targetValue = Number(form.targetValue);
      } else if (isEditing) {
        payload.targetValue = null;
      }

      const saved = isEditing
        ? await WorshipScheduleService.updateItem(item.id, payload)
        : await WorshipScheduleService.createItem(payload);

      return WorshipScheduleService.setDailySchedule(saved.id, form.includeInDailySchedule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'worship-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['trackingDay'] });
      onOpenChange(false);
    },
  });

  const selectedDaysLabel = useMemo(() => {
    if (!form.daysOfWeek.length) return t('worshipSchedule.form.everyDay');
    return form.daysOfWeek.map((day) => t(`worshipSchedule.days.${day}`)).join(', ');
  }, [form.daysOfWeek, t]);

  const update = (key, value) => setForm((state) => ({ ...state, [key]: value }));
  const toggleDay = (day) => {
    setForm((state) => ({
      ...state,
      daysOfWeek: state.daysOfWeek.includes(day)
        ? state.daysOfWeek.filter((value) => value !== day)
        : [...state.daysOfWeek, day].sort(),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('worshipSchedule.dialog.editTitle') : t('worshipSchedule.dialog.createTitle')}
          </DialogTitle>
          <DialogDescription>{t('worshipSchedule.dialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">{t('worshipSchedule.form.title')}</span>
            <Input
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
              placeholder={t('worshipSchedule.form.titlePlaceholder')}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">{t('worshipSchedule.form.category')}</span>
            <Select value={form.categoryId} onValueChange={(value) => update('categoryId', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('worshipSchedule.form.categoryPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">{t('worshipSchedule.form.inputType')}</span>
            <Select value={form.inputType} onValueChange={(value) => update('inputType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INPUT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`worshipSchedule.inputTypes.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">{t('worshipSchedule.form.score')}</span>
            <Input type="number" min="0" value={form.score} onChange={(event) => update('score', event.target.value)} />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">{t('worshipSchedule.form.xp')}</span>
            <Input type="number" min="0" value={form.xp} onChange={(event) => update('xp', event.target.value)} />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">{t('worshipSchedule.form.targetValue')}</span>
            <Input
              type="number"
              min="1"
              value={form.targetValue}
              onChange={(event) => update('targetValue', event.target.value)}
              placeholder={t('worshipSchedule.form.targetPlaceholder')}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">{t('worshipSchedule.form.order')}</span>
            <Input type="number" value={form.order} onChange={(event) => update('order', event.target.value)} />
          </label>

          <div className="space-y-2">
            <span className="text-sm font-medium">{t('worshipSchedule.form.days')}</span>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    form.daysOfWeek.includes(day)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-slate-200 text-muted-foreground hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900'
                  }`}
                >
                  {t(`worshipSchedule.days.${day}`)}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{selectedDaysLabel}</p>
          </div>

          <label className="flex items-center gap-2 rounded-xl border p-3 md:col-span-2">
            <input
              type="checkbox"
              checked={form.includeInDailySchedule}
              onChange={(event) => update('includeInDailySchedule', event.target.checked)}
              className="size-4"
            />
            <span className="text-sm font-medium">{t('worshipSchedule.form.includeInDailySchedule')}</span>
          </label>

          <label className="flex items-center gap-2 rounded-xl border p-3 md:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => update('isActive', event.target.checked)}
              className="size-4"
            />
            <span className="text-sm font-medium">{t('worshipSchedule.form.isActive')}</span>
          </label>
        </div>

        {mutation.isError && (
          <p className="text-sm text-destructive">{t('worshipSchedule.errors.saveFailed')}</p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('worshipSchedule.actions.cancel')}
          </Button>
          <Button type="button" onClick={() => mutation.mutate()} disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending ? t('worshipSchedule.actions.saving') : t('worshipSchedule.actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
