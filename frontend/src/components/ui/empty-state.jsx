import * as React from 'react';

import { cn } from '@/lib/utils';

const EmptyState = React.forwardRef(({
  action,
  className,
  description,
  icon: Icon,
  title,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/60 px-6 py-12 text-center',
      className,
    )}
    {...props}
  >
    {Icon && (
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
    )}
    {title && <h3 className="text-base font-semibold text-card-foreground">{title}</h3>}
    {description && (
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
));
EmptyState.displayName = 'EmptyState';

export { EmptyState };
