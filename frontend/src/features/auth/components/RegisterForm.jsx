import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/useAuthStore';

import { AuthService } from '../services/auth.service';

import { PasswordField } from './PasswordField';
import { PasswordRequirements } from './PasswordRequirements';

export function RegisterForm() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { t } = useTranslation(['auth', 'validation']);

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const registerSchema = useMemo(
    () =>
      z.object({
        fullName: z.string().min(2, t('validation:fullNameMin')),
        email: z.string().email(t('validation:invalidEmail')),
        password: z.string()
          .min(8, t('validation:passwordMin'))
          .regex(/[A-Z]/, t('validation:passwordUppercase'))
          .regex(/[0-9]/, t('validation:passwordNumber')),
        confirmPassword: z.string(),
      }).refine((data) => data.password === data.confirmPassword, {
        message: t('validation:passwordMatch'),
        path: ['confirmPassword'],
      }),
    [t],
  );

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch('password') || '';
  const confirmPasswordValue = watch('confirmPassword') || '';
  const passwordsMatch = Boolean(confirmPasswordValue) && passwordValue === confirmPasswordValue;

  const mutation = useMutation({
    mutationFn: (data) => {
      const submitData = {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      };
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo';
      return AuthService.register({ ...submitData, timezone });
    },
    onSuccess: (response) => {
      setAuth(response.user, response.token);
      toast.success(t('auth:register.success'));
      navigate('/dashboard');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('auth:register.failed'));
    },
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  const navigateToLogin = () => {
    navigate('/login');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {mutation.isError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-600 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300">
          {mutation.error.response?.data?.message || t('auth:register.failedRetry')}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName">{t('auth:register.fullName')}</Label>
        <Input
          id="fullName"
          autoComplete="name"
          {...register('fullName')}
          className={errors.fullName ? 'border-red-500 focus-visible:ring-red-500' : ''}
        />
        {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t('auth:register.email')}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
        />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <PasswordField
        id="password"
        label={t('auth:register.password')}
        registration={register('password')}
        error={errors.password}
        autoComplete="new-password"
        describedBy="password-requirements"
        showLabel={t('auth:register.showPassword')}
        hideLabel={t('auth:register.hidePassword')}
        onFocus={() => setIsPasswordFocused(true)}
        onBlur={() => setIsPasswordFocused(false)}
      />
      <PasswordRequirements value={passwordValue} visible={isPasswordFocused} />

      <PasswordField
        id="confirmPassword"
        label={t('auth:register.confirmPassword')}
        registration={register('confirmPassword')}
        error={errors.confirmPassword}
        autoComplete="new-password"
        showLabel={t('auth:register.showConfirmPassword')}
        hideLabel={t('auth:register.hideConfirmPassword')}
      />
      {confirmPasswordValue && !errors.confirmPassword && (
        <p className={passwordsMatch ? 'text-xs font-medium text-primary' : 'text-xs font-medium text-amber-600'}>
          {passwordsMatch ? t('auth:register.passwordsMatch') : t('auth:register.passwordsPending')}
        </p>
      )}

      <Button type="submit" className="w-full font-semibold" disabled={mutation.isPending}>
        {mutation.isPending ? t('auth:register.submitting') : t('auth:register.submit')}
      </Button>

      <div className="pt-2 text-center text-sm">
        <span className="text-slate-500">{t('auth:register.hasAccount')}</span>{' '}
        <button
          type="button"
          onClick={navigateToLogin}
          className="rounded px-1 font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {t('auth:register.login')}
        </button>
      </div>
    </form>
  );
}
