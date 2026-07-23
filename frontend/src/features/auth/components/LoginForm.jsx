import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/useAuthStore';

import { AuthService } from '../services/auth.service';

import { PasswordField } from './PasswordField';

export function LoginForm() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { t } = useTranslation(['auth', 'common', 'validation']);

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('validation:invalidEmail')),
        password: z.string().min(1, t('validation:passwordRequired')),
      }),
    [t],
  );

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: (data) => AuthService.login(data),
    onSuccess: (response) => {
      setAuth(response.user, response.token);
      navigate('/dashboard');
    },
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  const navigateToRegister = () => {
    navigate('/register');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {mutation.isError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-600 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300">
          {mutation.error.response?.data?.message || t('auth:login.failed')}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">{t('auth:login.email')}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
          {...register('email')}
        />
        {errors.email && <p className="text-xs font-medium text-red-500">{errors.email.message}</p>}
      </div>

      <PasswordField
        id="password"
        label={t('auth:login.password')}
        registration={register('password')}
        error={errors.password}
        autoComplete="current-password"
        showLabel={t('auth:login.showPassword')}
        hideLabel={t('auth:login.hidePassword')}
      />

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? t('common:states.loading') : t('auth:login.submit')}
      </Button>

      <div className="text-center text-sm text-slate-500 dark:text-slate-400">
        {t('auth:login.noAccount')}{' '}
        <button
          type="button"
          onClick={navigateToRegister}
          className="rounded px-1 font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {t('auth:login.register')}
        </button>
      </div>
    </form>
  );
}
