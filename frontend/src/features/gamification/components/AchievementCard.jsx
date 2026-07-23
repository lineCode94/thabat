import { motion } from 'framer-motion';
import { Lock, CheckCircle2, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getAchievementDisplay } from '../utils/achievementTranslations';

const STATE_STYLES = {
  UNLOCKED:    { ring: 'ring-2 ring-yellow-400/60',  bg: 'bg-white dark:bg-slate-800',  icon: CheckCircle2, iconColor: 'text-yellow-500' },
  IN_PROGRESS: { ring: 'ring-2 ring-blue-400/50',    bg: 'bg-white dark:bg-slate-800',  icon: Clock,         iconColor: 'text-blue-400' },
  LOCKED:      { ring: '',                            bg: 'bg-slate-100 dark:bg-slate-900', icon: Lock,       iconColor: 'text-slate-400' },
};

export function AchievementCard({ achievement, onClick }) {
  const { t } = useTranslation(['achievements']);
  const { state, progress, currentValue, targetValue } = achievement;
  const styles = STATE_STYLES[state] ?? STATE_STYLES.LOCKED;
  const StatusIcon = styles.icon;
  const display = getAchievementDisplay(achievement, t);

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onClick?.(achievement)}
      className={`w-full rounded-xl border border-slate-200 p-4 text-start shadow-sm transition-all cursor-pointer dark:border-slate-700 ${styles.bg} ${styles.ring}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            {display.category}
          </span>
          <h3 className={`mt-0.5 text-sm font-bold ${state === 'LOCKED' ? 'text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
            {display.name}
          </h3>
        </div>
        <StatusIcon size={18} className={`mt-0.5 flex-shrink-0 ${styles.iconColor}`} />
      </div>

      <p className={`mb-3 text-xs leading-relaxed ${state === 'LOCKED' ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
        {display.description}
      </p>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${state === 'UNLOCKED' ? 'bg-yellow-400' : 'bg-blue-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-medium text-slate-400">
          <span>{currentValue} / {targetValue}</span>
          <span>{progress}%</span>
        </div>
      </div>
    </motion.button>
  );
}
