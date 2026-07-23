import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Lock, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getAchievementDisplay } from '../utils/achievementTranslations';

const STATE_META = {
  UNLOCKED:    { Icon: CheckCircle2, color: 'text-yellow-500' },
  IN_PROGRESS: { Icon: Clock,         color: 'text-blue-400'  },
  LOCKED:      { Icon: Lock,          color: 'text-slate-400' },
};

export function AchievementDetailDialog({ achievement, onClose }) {
  const { t, i18n } = useTranslation(['achievements']);
  if (!achievement) return null;
  const meta = STATE_META[achievement.state] ?? STATE_META.LOCKED;
  const { Icon } = meta;
  const display = getAchievementDisplay(achievement, t);
  const unlockedDate = achievement.unlockedAt
    ? new Date(achievement.unlockedAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')
    : null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute end-4 top-4 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
            aria-label={t('closeDialog')}
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center text-center gap-3">
            <div className={`p-4 rounded-full bg-slate-100 dark:bg-slate-700 ${meta.color}`}>
              <Icon size={36} />
            </div>

            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {display.category}
            </span>

            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {display.name}
            </h2>

            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {display.description}
            </p>

            <span className={`text-xs font-semibold uppercase tracking-wide ${meta.color}`}>
              {display.state}
            </span>

            {/* Progress */}
            <div className="w-full mt-2 space-y-2">
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${achievement.state === 'UNLOCKED' ? 'bg-yellow-400' : 'bg-blue-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${achievement.progress}%` }}
                  transition={{ duration: 1.0, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>{achievement.currentValue} / {achievement.targetValue}</span>
                <span>{achievement.progress}%</span>
              </div>
            </div>

            {achievement.unlockedAt && (
              <p className="text-xs text-slate-400 mt-1">
                {t('unlockedOn', { date: unlockedDate })}
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
