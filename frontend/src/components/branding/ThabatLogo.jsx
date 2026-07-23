import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

const sizes = {
  sm: {
    mark: 'h-9 w-9',
    wordmark: 'text-sm',
    tagline: 'text-[0.68rem]',
    gap: 'gap-2.5',
  },
  md: {
    mark: 'h-11 w-11',
    wordmark: 'text-base',
    tagline: 'text-xs',
    gap: 'gap-3',
  },
  lg: {
    mark: 'h-14 w-14',
    wordmark: 'text-xl',
    tagline: 'text-sm',
    gap: 'gap-3.5',
  },
};

function LogoMark({ className, reduceMotion, inverse }) {
  return (
    <motion.span
      className={cn(
        'group/logo relative inline-flex shrink-0 items-center justify-center rounded-[1.05rem]',
        'border-2 border-foreground/80 bg-[linear-gradient(135deg,hsl(var(--neo-mint)),hsl(var(--neo-lime))_52%,hsl(150_58%_42%))]',
        'shadow-[5px_5px_0_hsl(150_58%_30%/0.72)] ring-1 ring-white/35',
        inverse && 'shadow-[5px_5px_0_rgba(0,0,0,0.34)]',
        className,
      )}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.92, filter: 'drop-shadow(0 0 0 hsl(var(--primary) / 0))' }}
      animate={reduceMotion ? undefined : { opacity: 1, scale: 1, filter: 'drop-shadow(0 0 14px hsl(var(--primary) / 0.22))' }}
      whileHover={reduceMotion ? undefined : { scale: 1.03, filter: 'drop-shadow(0 0 18px hsl(var(--primary) / 0.34))' }}
      transition={{ duration: reduceMotion ? 0 : 0.48, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="absolute inset-0 rounded-[inherit] bg-white/10 opacity-0 transition-opacity duration-300 group-hover/logo:opacity-100" />
      <svg
        aria-hidden="true"
        viewBox="0 0 48 48"
        className="relative h-[68%] w-[68%]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M13 15.5C13 13.57 14.57 12 16.5 12H31.5C33.43 12 35 13.57 35 15.5V16.25C35 18.18 33.43 19.75 31.5 19.75H16.5C14.57 19.75 13 18.18 13 16.25V15.5Z"
          fill="hsl(var(--neo-yellow))"
          fillOpacity="0.98"
          stroke="hsl(var(--neo-ink))"
          strokeWidth="1.4"
        />
        <path
          d="M20.15 19.75H27.85V35.25C27.85 37.38 26.13 39.1 24 39.1C21.87 39.1 20.15 37.38 20.15 35.25V19.75Z"
          fill="hsl(var(--neo-yellow))"
          fillOpacity="0.98"
          stroke="hsl(var(--neo-ink))"
          strokeWidth="1.4"
        />
        <path
          d="M29.2 24.1C33.1 23.4 36.05 20.35 36.6 16.35"
          stroke="hsl(42 100% 94%)"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeOpacity="0.95"
        />
        <path
          d="M18.8 24.1C14.9 23.4 11.95 20.35 11.4 16.35"
          stroke="hsl(42 100% 94%)"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />
        <path
          d="M36.7 10.7L37.58 12.45L39.5 12.78L38.12 14.16L38.42 16.08L36.7 15.2L34.98 16.08L35.28 14.16L33.9 12.78L35.82 12.45L36.7 10.7Z"
          fill="hsl(42 100% 94%)"
          stroke="hsl(var(--neo-ink))"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
      </svg>
    </motion.span>
  );
}

export function ThabatLogo({
  size = 'md',
  showWordmark = false,
  showTagline = false,
  inverse = false,
  className,
}) {
  const { t } = useTranslation(['common', 'layout']);
  const reduceMotion = useReducedMotion();
  const config = sizes[size] || sizes.md;

  return (
    <div className={cn('flex min-w-0 items-center', config.gap, className)}>
      <LogoMark className={config.mark} reduceMotion={reduceMotion} inverse={inverse} />
      {showWordmark && (
        <div className="min-w-0">
          <p
            className={cn(
              'truncate font-extrabold leading-tight tracking-tight',
              config.wordmark,
              inverse ? 'text-white' : 'text-slate-950 dark:text-white',
            )}
          >
            {t('common:appName')}
          </p>
          {showTagline && (
            <p
              className={cn(
                'truncate font-medium leading-tight',
                config.tagline,
                inverse ? 'text-white/72' : 'text-slate-500 dark:text-slate-400',
              )}
            >
              {t('layout:tagline')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
