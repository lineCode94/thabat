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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export function PasswordForm({ onSubmit, isLoading }) {
  const { t } = useTranslation(['profile', 'validation']);
  const passwordSchema = useMemo(
    () =>
      z.object({
        currentPassword: z.string().min(1, t('validation:currentPasswordRequired')),
        newPassword: z.string()
          .min(8, t('validation:passwordMin'))
          .regex(/[A-Z]/, t('validation:passwordUppercase'))
          .regex(/[0-9]/, t('validation:passwordNumber')),
        confirmPassword: z.string(),
      }).refine((data) => data.newPassword === data.confirmPassword, {
        message: t('validation:passwordMatch'),
        path: ['confirmPassword'],
      }),
    [t],
  );

  const form = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleSubmit = (data) => {
    onSubmit(data, () => form.reset());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('changePassword')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('currentPassword')}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('newPassword')}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('confirmNewPassword')}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('updating') : t('updatePassword')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
