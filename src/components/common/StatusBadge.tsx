import React from 'react';
import { AttendanceStatus } from '../../types/attendance';

export const STATUS_META: Record<
  AttendanceStatus,
  {
    label: string;
    badgeClass: string;
    barClass: string;
    dotClass: string;
  }
> = {
  target_achieved: {
    label: 'Target Achieved',
    badgeClass:
      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70',
    barClass: 'bg-emerald-500',
    dotClass: 'bg-emerald-500',
  },
  safe: {
    label: 'Safe',
    badgeClass:
      'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/70',
    barClass: 'bg-indigo-500',
    dotClass: 'bg-indigo-500',
  },
  near_target: {
    label: 'Near Target',
    badgeClass:
      'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70',
    barClass: 'bg-amber-500',
    dotClass: 'bg-amber-500',
  },
  below_target: {
    label: 'Below Target',
    badgeClass:
      'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/70',
    barClass: 'bg-rose-500',
    dotClass: 'bg-rose-500',
  },
};

export const StatusBadge: React.FC<{
  status: AttendanceStatus;
  size?: 'sm' | 'md';
}> = ({ status, size = 'sm' }) => {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${
        meta.badgeClass
      } ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs'}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
      {meta.label}
    </span>
  );
};
