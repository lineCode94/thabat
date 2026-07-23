import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ThemeToggle } from '@/components/ThemeToggle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { NotificationPreferencesSection } from '@/features/notifications/components/NotificationPreferencesSection';
import { isSoundEnabled, playStepSound, setSoundEnabled } from '@/lib/soundEffects';

import { PasswordForm } from '../components/PasswordForm';
import { PersonalInfoForm } from '../components/PersonalInfoForm';
import { SettingsSkeleton } from '../components/SettingsSkeleton';
import { ProfileService } from '../services/profile.service';



export function SettingsPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(['settings']);
  const [soundEnabled, setSoundEnabledState] = useState(() => isSoundEnabled());

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => ProfileService.getProfile(),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => ProfileService.updateProfile(data),
    onSuccess: (res) => {
      toast.success(res.message || t('profileUpdated'));
      queryClient.invalidateQueries(['profile']);
      queryClient.invalidateQueries(['auth']); // Incase user info is cached in auth
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t('profileUpdateFailed'));
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data) => ProfileService.changePassword(data),
    onSuccess: (res, _variables, context) => {
      toast.success(res.message || t('passwordChanged'));
      if (context?.resetForm) context.resetForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t('passwordChangeFailed'));
    }
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <SettingsSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-slate-500 mt-1">{t('description')}</p>
      </div>

      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ staggerChildren: 0.1 }}
      >
        <PersonalInfoForm 
          initialData={profile} 
          onSubmit={(data) => updateProfileMutation.mutate(data)} 
          isLoading={updateProfileMutation.isPending}
        />

        <Card>
          <CardHeader>
            <CardTitle>{t('themeTitle')}</CardTitle>
            <CardDescription>{t('themeDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('toggleDarkMode')}</span>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('soundTitle')}</CardTitle>
            <CardDescription>{t('soundDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border bg-background/60 px-4 py-3 transition hover:bg-muted/40">
              <span className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200">
                  <Volume2 className="size-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{t('soundEffects')}</span>
                  <span className="block text-xs text-muted-foreground">{t('soundEffectsHint')}</span>
                </span>
              </span>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(event) => {
                  const nextValue = event.target.checked;
                  setSoundEnabled(nextValue);
                  setSoundEnabledState(nextValue);
                  if (nextValue) {
                    playStepSound();
                  }
                }}
                className="size-5 accent-violet-500"
              />
            </label>
          </CardContent>
        </Card>

        <PasswordForm 
          onSubmit={(data, resetForm) => changePasswordMutation.mutate(data, { context: { resetForm } })} 
          isLoading={changePasswordMutation.isPending}
        />

        <NotificationPreferencesSection />
      </motion.div>
    </div>
  );
}
