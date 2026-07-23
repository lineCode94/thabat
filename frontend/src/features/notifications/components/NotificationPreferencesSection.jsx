import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  Moon,
  Smartphone,
  Target,
  Trophy,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { NotificationPreferenceService } from '../services/notification-preference.service';

function PreferenceToggle({ icon: Icon, iconColor, label, description, checked, onChange, disabled = false }) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg px-1 py-3 transition-colors ${disabled ? 'opacity-50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 ${iconColor}`}>
          <Icon size={16} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</p>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
      </div>

      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          checked ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function TimeInput({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between px-1 py-3">
      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</p>
      <input
        type="time"
        value={value || ''}
        onChange={(event) => onChange(event.target.value || null)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
    </div>
  );
}

function SectionLabel({ label }) {
  return (
    <p className="border-t border-slate-100 px-1 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-slate-400 first:border-0 first:pt-0 dark:border-slate-800 dark:text-slate-500">
      {label}
    </p>
  );
}

export function NotificationPreferencesSection() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(['common', 'notifications']);

  const { data: preferences, isLoading, isError, refetch } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: NotificationPreferenceService.getPreferences,
  });

  const [localPrefs, setLocalPrefs] = useState(null);
  const prefs = localPrefs ?? preferences;

  const updateMutation = useMutation({
    mutationFn: NotificationPreferenceService.updatePreferences,
    onSuccess: (data) => {
      toast.success(t('notifications:preferencesSaved'));
      queryClient.setQueryData(['notificationPreferences'], data);
      setLocalPrefs(null);
    },
    onError: () => {
      toast.error(t('notifications:preferencesSaveFailed'));
    },
  });

  const handleChange = (key, value) => {
    setLocalPrefs((prev) => ({ ...(prev ?? preferences), [key]: value }));
  };

  const handleSave = () => {
    if (!localPrefs) return;
    updateMutation.mutate(localPrefs);
  };

  const handleDiscard = () => setLocalPrefs(null);
  const isDirty = localPrefs !== null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={18} /> {t('notifications:preferences')}
          </CardTitle>
          <CardDescription>{t('notifications:preferencesDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={18} /> {t('notifications:preferences')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 py-8 text-center text-slate-400">
            <AlertCircle size={28} className="text-red-400" />
            <p className="text-sm">{t('notifications:preferencesLoadFailed')}</p>
            <button onClick={() => refetch()} className="text-xs text-primary hover:underline">
              {t('common:actions.retry')}
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell size={18} /> {t('notifications:preferences')}
            </CardTitle>
            <CardDescription className="mt-1">
              {t('notifications:preferencesFullDescription')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-1">
        <SectionLabel label={t('notifications:channels')} />
        <PreferenceToggle
          icon={Mail}
          iconColor="text-blue-500"
          label={t('notifications:emailNotifications')}
          description={t('notifications:emailDescription')}
          checked={prefs?.email ?? true}
          onChange={(value) => handleChange('email', value)}
        />
        <PreferenceToggle
          icon={Smartphone}
          iconColor="text-slate-400"
          label={t('notifications:inAppNotifications')}
          description={t('notifications:inAppDescription')}
          checked={prefs?.inApp ?? true}
          onChange={(value) => handleChange('inApp', value)}
        />

        <SectionLabel label={t('notifications:categories')} />
        <PreferenceToggle
          icon={Calendar}
          iconColor="text-blue-500"
          label={t('notifications:dailyReminders')}
          description={t('notifications:dailyRemindersDescription')}
          checked={prefs?.dailyReminders ?? true}
          onChange={(value) => handleChange('dailyReminders', value)}
        />
        <PreferenceToggle
          icon={CheckCircle2}
          iconColor="text-violet-500"
          label={t('notifications:weeklyReminders')}
          description={t('notifications:weeklyRemindersDescription')}
          checked={prefs?.weeklyReminders ?? true}
          onChange={(value) => handleChange('weeklyReminders', value)}
        />
        <PreferenceToggle
          icon={Trophy}
          iconColor="text-amber-500"
          label={t('notifications:achievementNotifications')}
          description={t('notifications:achievementDescription')}
          checked={prefs?.achievements ?? true}
          onChange={(value) => handleChange('achievements', value)}
        />
        <PreferenceToggle
          icon={Target}
          iconColor="text-violet-500"
          label={t('notifications:missionNotifications')}
          description={t('notifications:missionDescription')}
          checked={prefs?.missions ?? true}
          onChange={(value) => handleChange('missions', value)}
        />

        <SectionLabel label={t('notifications:reminderTiming')} />
        <TimeInput
          label={<span className="flex items-center gap-2"><Clock size={14} /> {t('notifications:dailyReminderTime')}</span>}
          value={prefs?.reminderTime}
          onChange={(value) => handleChange('reminderTime', value)}
        />

        <SectionLabel label={t('notifications:quietHours')} />
        <p className="px-1 pb-1 text-xs text-slate-400 dark:text-slate-500">
          {t('notifications:quietHoursDescription')}
        </p>
        <TimeInput
          label={<span className="flex items-center gap-2"><Moon size={14} /> {t('notifications:start')}</span>}
          value={prefs?.quietHoursStart}
          onChange={(value) => handleChange('quietHoursStart', value)}
        />
        <TimeInput
          label={<span className="flex items-center gap-2"><Moon size={14} className="rotate-180" /> {t('notifications:end')}</span>}
          value={prefs?.quietHoursEnd}
          onChange={(value) => handleChange('quietHoursEnd', value)}
        />

        {isDirty && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800"
          >
            <button
              onClick={handleDiscard}
              disabled={updateMutation.isPending}
              className="text-sm text-slate-500 transition-colors hover:text-slate-700 dark:hover:text-slate-300"
            >
              {t('notifications:discard')}
            </button>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {updateMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : null}
              {t('notifications:savePreferences')}
            </button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
