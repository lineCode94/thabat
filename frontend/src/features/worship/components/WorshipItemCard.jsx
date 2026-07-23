import { BookOpen, CheckSquare, Hash, Clock, FileText } from 'lucide-react';

const INPUT_TYPE_META = {
  BOOLEAN:  { label: 'Completion', icon: CheckSquare, color: 'text-success bg-success/10 dark:bg-success/15' },
  COUNT:    { label: 'Count',      icon: Hash,         color: 'text-blue-500   bg-blue-50   dark:bg-blue-950'   },
  DURATION: { label: 'Duration',   icon: Clock,        color: 'text-purple-500 bg-purple-50 dark:bg-purple-950' },
  TEXT:     { label: 'Notes',      icon: FileText,     color: 'text-amber-500  bg-amber-50  dark:bg-amber-950'  },
};

export function WorshipItemCard({ item }) {
  const meta = INPUT_TYPE_META[item.inputType] || INPUT_TYPE_META.BOOLEAN;
  const TypeIcon = meta.icon;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex items-start gap-4 hover:shadow-md transition-shadow">
      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl" aria-hidden="true">
        {item.icon || <BookOpen size={20} className="text-slate-400" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{item.title}</h3>
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
            <TypeIcon size={11} />
            {meta.label}
          </span>
        </div>
        {item.description && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{item.description}</p>
        )}
      </div>
    </div>
  );
}
