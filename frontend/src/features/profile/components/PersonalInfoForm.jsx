import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export function PersonalInfoForm({ initialData, onSubmit, isLoading }) {
  const { t } = useTranslation(['profile', 'validation']);
  const formSchema = useMemo(
    () =>
      z.object({
        fullName: z.string().min(2, t('validation:nameMin')),
        phone: z.string().optional(),
        avatarUrl: z.string().url(t('validation:invalidUrl')).or(z.literal('')).optional(),
        timezone: z.string().optional(),
        notificationPreferences: z.object({
          email: z.boolean(),
          push: z.boolean(),
          inApp: z.boolean(),
        }),
      }),
    [t],
  );

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: initialData?.fullName || '',
      phone: initialData?.phone || '',
      avatarUrl: initialData?.avatarUrl || '',
      timezone: initialData?.timezone || 'Africa/Cairo',
      notificationPreferences: {
        email: initialData?.notificationPreference?.email ?? true,
        push: initialData?.notificationPreference?.push ?? true,
        inApp: initialData?.notificationPreference?.inApp ?? true,
      },
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('personalInformation')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('avatarUrl')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>{t('avatarDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fullName')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('phoneNumber')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('timezoneLabel')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold">{t('notificationPreferences')}</h3>
              <div className="flex items-center gap-4">
                <FormField
                  control={form.control}
                  name="notificationPreferences.email"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <input type="checkbox" checked={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormLabel>{t('email')}</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notificationPreferences.push"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <input type="checkbox" checked={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormLabel>{t('push')}</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notificationPreferences.inApp"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <input type="checkbox" checked={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormLabel>{t('inApp')}</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('saving') : t('saveChanges')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
