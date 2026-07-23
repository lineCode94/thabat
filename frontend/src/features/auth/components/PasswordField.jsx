import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PasswordField({
  id,
  label,
  registration,
  error,
  autoComplete,
  describedBy,
  showLabel,
  hideLabel,
  onFocus,
  onBlur,
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={isVisible ? 'text' : 'password'}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={error ? 'border-red-500 pe-11 focus-visible:ring-red-500' : 'pe-11'}
          onFocus={onFocus}
          {...registration}
          onBlur={(event) => {
            registration.onBlur(event);
            onBlur?.(event);
          }}
        />
        <button
          type="button"
          className="absolute end-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:hover:bg-slate-800 dark:hover:text-slate-200"
          onClick={() => setIsVisible((value) => !value)}
          aria-label={isVisible ? hideLabel : showLabel}
        >
          {isVisible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {error && <p className="text-xs font-medium text-red-500">{error.message}</p>}
    </div>
  );
}
