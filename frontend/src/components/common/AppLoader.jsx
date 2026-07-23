import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

export function AppLoader({ className, size = 'default', label = 'Loading...' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)} role="status">
      <Loader2 className={cn('animate-spin text-muted-foreground', sizeClasses[size])} />
      <span className="sr-only">{label}</span>
    </div>
  );
}
