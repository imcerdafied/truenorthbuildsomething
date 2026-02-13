import { cn } from '@/lib/utils';
import { ROOT_CAUSE_LABELS, type RootCauseCategory } from '@/types';

interface RootCauseBadgeProps {
  rootCause: RootCauseCategory;
  size?: 'sm' | 'md';
  className?: string;
}

const CATEGORY_STYLES: Record<RootCauseCategory, string> = {
  capacity: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700',
  dependency: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
  vendor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
  compliance: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800',
  strategy_shift: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800',
  technical_debt: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
  data_quality: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/50 dark:text-pink-300 dark:border-pink-800',
  scope_change: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
};

export function RootCauseBadge({ rootCause, size = 'sm', className }: RootCauseBadgeProps) {
  const label = ROOT_CAUSE_LABELS[rootCause];
  const style = CATEGORY_STYLES[rootCause];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1',
        style,
        className
      )}
    >
      {label}
    </span>
  );
}
