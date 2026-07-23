import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, MoonStar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AuthBrand } from './AuthBrand';

const contentVariants = {
  initial: { opacity: 0, y: 18, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -12, scale: 0.98 },
};

export function AuthVisualPanel({ mode, compact = false }) {
  const { t } = useTranslation(['auth']);
  const reduceMotion = useReducedMotion();
  const contentKey = mode === 'register' ? 'registerPanel' : 'loginPanel';

  return (
    <div className="auth-neo-visual relative h-full overflow-hidden rounded-[2rem] border-2 p-7 text-slate-950 dark:text-slate-950">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            'linear-gradient(30deg, rgba(255,255,255,.3) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,.3) 87.5%, rgba(255,255,255,.3)), linear-gradient(150deg, rgba(255,255,255,.3) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,.3) 87.5%, rgba(255,255,255,.3))',
          backgroundSize: '38px 66px',
        }}
      />
      <div aria-hidden="true" className="absolute -end-16 -top-16 h-52 w-52 rounded-full bg-orange-300/25 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-24 -start-10 h-72 w-72 rounded-full bg-cyan-200/20 blur-3xl" />
      <div aria-hidden="true" className="absolute end-8 top-8 hidden h-32 w-32 rounded-full border border-white/10 md:block" />

      <div className="relative z-10 flex h-full flex-col">
        <AuthBrand inverse />

        <div className={compact ? 'mt-8' : 'mt-14 max-w-md pb-4 xl:mt-20'}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={contentKey}
              variants={contentVariants}
              initial={reduceMotion ? false : 'initial'}
              animate="animate"
              exit={reduceMotion ? undefined : 'exit'}
              transition={{ duration: reduceMotion ? 0 : 0.34, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 text-amber-200 ring-1 ring-white/15">
                <MoonStar size={24} />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-950/80 rtl:normal-case rtl:tracking-normal">
                  {t(`visual.${contentKey}.eyebrow`)}
                </p>
                <h2 className="max-w-sm text-3xl font-bold leading-tight tracking-tight md:text-4xl">
                  {t(`visual.${contentKey}.title`)}
                </h2>
                <p className="max-w-sm text-sm leading-6 text-cyan-950/75">
                  {t(`visual.${contentKey}.description`)}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                <span>{t(`visual.${contentKey}.hint`)}</span>
                <ArrowRight size={16} className="rtl:rotate-180" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
