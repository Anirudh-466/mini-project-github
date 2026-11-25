import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Coffee,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Subject } from '../../types/attendance';
import { analyzeSubject } from '../../utils/calculator';

interface MotivationalCardProps {
  subjects: Subject[];
}

export const MotivationalCard: React.FC<MotivationalCardProps> = ({ subjects }) => {
  const [selectedId, setSelectedId] = useState<string>(subjects[0]?.id || '');

  useEffect(() => {
    if (subjects.length > 0 && !subjects.some((s) => s.id === selectedId)) {
      setSelectedId(subjects[0].id);
    }
  }, [subjects, selectedId]);

  const subject = subjects.find((s) => s.id === selectedId) || subjects[0];
  if (!subject) return null;

  const analysis = analyzeSubject(subject);

  let verdictTitle = 'On the Border';
  let verdictTone =
    'border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200';
  let badgeIcon = <AlertCircle className="h-5 w-5 text-amber-500" />;
  let explanation = '';

  if (subject.conducted === 0) {
    verdictTitle = 'No Classes Logged Yet';
    verdictTone =
      'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200';
    badgeIcon = <Sparkles className="h-5 w-5 text-brand-500" />;
    explanation = `Attend your upcoming ${subject.name} class to start building your attendance buffer.`;
  } else if (analysis.maxSkippableMin > 0) {
    verdictTitle = 'Break Allowed! You Can Skip';
    verdictTone =
      'border-emerald-200 bg-emerald-50/70 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100';
    badgeIcon = <Coffee className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
    explanation = `You have ${analysis.maxSkippableMin} safe bunk${
      analysis.maxSkippableMin === 1 ? '' : 's'
    } while staying at or above ${subject.min_required_percentage}%.`;
  } else if (analysis.currentPercentage >= subject.min_required_percentage) {
    verdictTitle = 'On the Border';
    verdictTone =
      'border-amber-200 bg-amber-50/70 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100';
    badgeIcon = <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
    explanation = `You are right at ${analysis.currentPercentage}% (${subject.min_required_percentage}% min). Skipping the next class will drop you to ${analysis.ifMissNext}%.`;
  } else {
    verdictTitle = "Must Attend! Don't Skip";
    verdictTone =
      'border-rose-200 bg-rose-50/70 text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-100';
    badgeIcon = <CheckCircle2 className="h-5 w-5 text-rose-600 dark:text-rose-400" />;
    explanation = analysis.requiredForMin.isImpossible
      ? analysis.requiredForMin.explanation ||
        'Target cannot be reached mathematically.'
      : `Attend the next ${analysis.requiredForMin.required} consecutive class${
          analysis.requiredForMin.required === 1 ? '' : 'es'
        } to reach ${subject.min_required_percentage}%.`;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            The Big Question
          </span>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Aau ya Nahi?
          </h2>
        </div>

        <select
          aria-label="Select subject for Aau ya Nahi verdict"
          value={subject.id}
          onChange={(e) => setSelectedId(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.attended}/{s.conducted})
            </option>
          ))}
        </select>
      </div>

      <div className={`mt-4 rounded-xl border p-4 ${verdictTone}`}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">{badgeIcon}</div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-extrabold">{verdictTitle}</h3>
            <p className="mt-1 text-sm opacity-90">{explanation}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            If you attend next class
          </div>
          <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {analysis.ifAttendNext}%
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <TrendingDown className="h-4 w-4 text-rose-500" />
            If you miss next class
          </div>
          <span className="font-mono text-sm font-bold text-rose-600 dark:text-rose-400">
            {analysis.ifMissNext}%
          </span>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Link
          to={`/calculator?subject=${encodeURIComponent(subject.id)}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          Simulate scenarios in Bunk Calculator
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
};
