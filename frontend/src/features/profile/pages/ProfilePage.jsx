import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UserCircle, MapPin, Mail, Phone, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { ProfileService } from '../services/profile.service';



export function ProfilePage() {
  const { t } = useTranslation(['profile']);
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['profile'],
    queryFn: () => ProfileService.getProfile(),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-xl font-semibold text-red-500">{t('failed')}</h2>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <Button variant="outline" asChild className="gap-2">
          <Link to="/settings">
            <Settings size={16} /> {t('editSettings')}
          </Link>
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="overflow-hidden border-none shadow-md">
          <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          <CardContent className="relative pt-0 px-6 pb-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 mb-6">
              <div className="h-32 w-32 rounded-full border-4 border-white dark:border-slate-900 bg-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={t('avatar')} className="h-full w-full object-cover" />
                ) : (
                  <UserCircle className="h-20 w-20 text-slate-400" />
                )}
              </div>
              <div className="mb-2 text-center md:text-start">
                <h2 className="text-2xl font-bold">{profile.fullName}</h2>
                <p className="text-slate-500 dark:text-slate-400">{profile.role?.name || t('defaultRole')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">{t('contactInfo')}</h3>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Mail size={18} className="text-slate-400" />
                  <span>{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <Phone size={18} className="text-slate-400" />
                    <span>{profile.phone}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">{t('locationPreferences')}</h3>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <MapPin size={18} className="text-slate-400" />
                  <span>{t('timezone', { timezone: profile.timezone })}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
