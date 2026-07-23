import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useOutlet } from 'react-router-dom';

import { AuthVisualPanel } from './AuthVisualPanel';

const ease = [0.22, 1, 0.36, 1];

function getMode(pathname) {
  return pathname.includes('/register') ? 'register' : 'login';
}

export function AuthContainer() {
  const location = useLocation();
  const outlet = useOutlet();
  const reduceMotion = useReducedMotion();
  const { i18n } = useTranslation();
  const mode = getMode(location.pathname);
  const currentDirection = i18n.dir();

  const { direction, panelX, showLeftForm, showRightForm } = useMemo(() => {
    const isRtlDocument = currentDirection === 'rtl';
    const nextDirection = mode === 'register'
      ? (isRtlDocument ? -1 : 1)
      : (isRtlDocument ? 1 : -1);

    return {
      direction: nextDirection,
      panelX: mode === 'register'
        ? (isRtlDocument ? '-100%' : '0%')
        : (isRtlDocument ? '0%' : '100%'),
      showLeftForm: (!isRtlDocument && mode === 'login') || (isRtlDocument && mode === 'register'),
      showRightForm: (!isRtlDocument && mode === 'register') || (isRtlDocument && mode === 'login'),
    };
  }, [currentDirection, mode]);

  const formTransition = {
    duration: reduceMotion ? 0 : 0.38,
    delay: reduceMotion ? 0 : 0.18,
    ease,
  };

  const formInitial = reduceMotion ? false : { opacity: 0, x: direction * 34, scale: 0.985 };
  const formExit = reduceMotion ? undefined : { opacity: 0, x: direction * -24, scale: 0.985 };

  return (
    <div className="w-full max-w-6xl">
      <div className="lg:hidden">
        <AuthVisualPanel mode={mode} compact />
        <div className="auth-neo-card mt-4 rounded-[1.75rem] border-2 bg-surface p-5">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={location.pathname}
              custom={direction}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: reduceMotion ? 0 : 0.28, ease }}
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="auth-neo-card relative hidden overflow-hidden rounded-[2.25rem] border-2 bg-surface p-4 lg:block">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-4 start-4 z-20 w-[calc(50%-1rem)]"
          animate={{
            x: panelX,
            scaleX: reduceMotion ? 1 : [1, 1.035, 1],
            borderRadius: mode === 'register' ? '2rem' : '2.25rem',
          }}
          transition={{ duration: reduceMotion ? 0 : 0.68, ease, times: [0, 0.48, 1] }}
        >
          <AuthVisualPanel mode={mode} />
        </motion.div>

        <div className="grid min-h-[720px] grid-cols-2">
          <div className="flex items-center justify-center px-10 py-10">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              {showLeftForm ? (
                <motion.div
                  key={location.pathname}
                  className="w-full max-w-md"
                  custom={direction}
                  initial={formInitial}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={formExit}
                  transition={formTransition}
                >
                  {outlet}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center px-10 py-10">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              {showRightForm ? (
                <motion.div
                  key={location.pathname}
                  className="w-full max-w-md"
                  custom={direction}
                  initial={formInitial}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={formExit}
                  transition={formTransition}
                >
                  {outlet}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
