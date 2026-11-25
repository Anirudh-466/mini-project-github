import React from 'react';
import {
  Activity,
  Award,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { OverallStats } from '../../utils/calculator';

interface OverallStatsCardsProps {
  stats: OverallStats;
  minAttendanceGoal: number;
  subjectCount: number;
}

export const OverallStatsCards: React.FC<OverallStatsCardsProps> = ({
  stats,
  minAttendanceGoal,
  subjectCount,
}) => {
  const onTrackCount = stats.achievedCount + stats.safeCount;
  const isMeetingGoal =
    stats.totalConducted > 0 && stats.overallPercentage >= minAttendanceGoal;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Card 1: Overall Attendance % */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Overall Attendance
          </span>
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              isMeetingGoal
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
            }`}
          >
            <Activity className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats.overallPercentage}%
          </span>
          <span
            className={`text-xs font-semibold ${
              isMeetingGoal
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isMeetingGoal
              ? `Above ${minAttendanceGoal}% goal`
              : `Below ${minAttendanceGoal}% goal`}
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isMeetingGoal ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
            style={{ width: `${Math.min(100, stats.overallPercentage)}%` }}
          />
        </div>
      </div>

      {/* Card 2: Classes Record */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Classes Record
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-mono text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats.totalAttended}
          </span>
          <span className="font-mono text-lg font-semibold text-slate-400">
            / {stats.totalConducted}
          </span>
        </div>
        <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {stats.totalMissed}
          </span>{' '}
          missed classes across{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {subjectCount}
          </span>{' '}
          subjects
        </p>
      </div>

      {/* Card 3: Subject Health */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Subject Health
          </span>
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              stats.belowTargetCount > 0
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
            }`}
          >
            {stats.belowTargetCount > 0 ? (
              <ShieldAlert className="h-5 w-5" />
            ) : (
              <Award className="h-5 w-5" />
            )}
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-3xl font-extrabold text-slate-900 dark:text-white">
            {onTrackCount}
          </span>
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            / {subjectCount} on track
          </span>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
          {stats.belowTargetCount > 0 ? (
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              {stats.belowTargetCount} below min
            </span>
          ) : (
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              All clear
            </span>
          )}
          {stats.nearTargetCount > 0 && (
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              • {stats.nearTargetCount} near border
            </span>
          )}
        </div>
      </div>

      {/* Card 4: Safe Bunks in Bank */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Safe Bunks in Bank
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-100 text-accent-600 dark:bg-accent-950/60 dark:text-accent-400">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats.totalSafeBunks}
          </span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            skippable classes
          </span>
        </div>
        <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
          Combined buffer above each subject&apos;s minimum requirement
        </p>
      </div>
    </div>
  );
};
