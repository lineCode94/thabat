import { AnimatePresence, motion } from 'framer-motion';
import { HeartHandshake, Leaf, Sparkles } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const TIER_META = {
  high: {
    Icon: Sparkles,
    container: 'border-slate-950 bg-cyan-50 text-slate-950 shadow-[0_28px_90px_hsl(190_74%_38%_/_0.26)] dark:border-white dark:bg-slate-950 dark:text-white dark:shadow-[0_28px_90px_hsl(190_74%_48%_/_0.28)]',
    accent: 'bg-cyan-300 dark:bg-cyan-400',
    icon: 'border-slate-950 bg-cyan-200 text-slate-950 dark:border-white dark:bg-cyan-300 dark:text-slate-950',
    progress: 'bg-cyan-500 dark:bg-cyan-300',
  },
  medium: {
    Icon: Leaf,
    container: 'border-slate-950 bg-lime-50 text-slate-950 shadow-[0_28px_90px_hsl(190_74%_38%_/_0.22)] dark:border-white dark:bg-slate-950 dark:text-white dark:shadow-[0_28px_90px_hsl(190_74%_48%_/_0.24)]',
    accent: 'bg-lime-300 dark:bg-lime-300',
    icon: 'border-slate-950 bg-lime-200 text-slate-950 dark:border-white dark:bg-lime-300 dark:text-slate-950',
    progress: 'bg-lime-500 dark:bg-lime-300',
  },
  low: {
    Icon: HeartHandshake,
    container: 'border-slate-950 bg-amber-50 text-slate-950 shadow-[0_28px_90px_hsl(190_74%_38%_/_0.20)] dark:border-white dark:bg-slate-950 dark:text-white dark:shadow-[0_28px_90px_hsl(190_74%_48%_/_0.22)]',
    accent: 'bg-amber-300 dark:bg-amber-300',
    icon: 'border-slate-950 bg-amber-200 text-slate-950 dark:border-white dark:bg-amber-300 dark:text-slate-950',
    progress: 'bg-amber-500 dark:bg-amber-300',
  },
};

function getTier(scorePercentage) {
  if (scorePercentage >= 80) return 'high';
  if (scorePercentage >= 50) return 'medium';
  return 'low';
}

function pickRandomMessage(messages = []) {
  if (!messages.length) return '';
  const index = Math.floor(Math.random() * messages.length);
  return messages[index];
}

export function PageCompletionAnimation({ feedback, onComplete }) {
  const { t } = useTranslation(['tracking']);
  const tier = feedback ? getTier(feedback.scorePercentage) : 'low';
  const meta = TIER_META[tier];
  const { Icon } = meta;
  const messages = t(`encouragement.${tier}.messages`, { returnObjects: true });
  const message = useMemo(() => pickRandomMessage(Array.isArray(messages) ? messages : []), [messages]);

  useEffect(() => {
    if (!feedback) return undefined;

    const timeout = window.setTimeout(() => {
      onComplete?.();
    }, 3800);

    return () => window.clearTimeout(timeout);
  }, [feedback, onComplete]);

  return (
    <AnimatePresence>
      {feedback && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/64 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onComplete}
        >
          <motion.div
            className={`relative w-full max-w-md overflow-hidden rounded-[2rem] border-2 p-6 text-center ${meta.container}`}
            initial={{ scale: 0.88, opacity: 0, y: 18 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 18 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`absolute inset-x-0 top-0 h-3 ${meta.accent}`} />
            <div className="flex flex-col items-center gap-4">
              <motion.div
                className={`rounded-2xl border-2 p-4 shadow-[4px_4px_0_hsl(190_74%_38%_/_0.55)] ${meta.icon}`}
                initial={{ scale: 0.72 }}
                animate={{ scale: [0.72, 1.08, 1] }}
                transition={{ duration: 0.85, ease: 'easeOut' }}
              >
                <Icon size={38} />
              </motion.div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70 rtl:normal-case rtl:tracking-normal">
                  {t(`encouragement.${tier}.label`)}
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  {feedback.categoryName}
                </h2>
              </div>
              <p className="text-sm leading-7 opacity-85">
                {message}
              </p>
              <div className="w-full space-y-2">
                <div className="h-3 overflow-hidden rounded-full border border-slate-950/20 bg-slate-950/10 dark:border-white/20 dark:bg-white/10">
                  <motion.div
                    className={`h-full rounded-full ${meta.progress}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${feedback.scorePercentage}%` }}
                    transition={{ duration: 1.35, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-semibold opacity-75">
                  <span>{feedback.completedScore} / {feedback.totalScore}</span>
                  <span>{feedback.scorePercentage}%</span>
                </div>
              </div>
              <button
                type="button"
                className="text-xs font-semibold opacity-70 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
                onClick={onComplete}
              >
                {t('encouragement.tapToContinue')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
