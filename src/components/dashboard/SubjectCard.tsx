import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calculator,
  Check,
  Edit3,
  Eye,
  MoreVertical,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { Subject } from '../../types/attendance';
import { analyzeSubject } from '../../utils/calculator';
import { STATUS_META, StatusBadge } from '../common/StatusBadge';

interface SubjectCardProps {
  subject: Subject;
  onQuickMark: (subjectId: string, status: 'present' | 'absent') => void;
  onViewDetails: (subject: Subject) => void;
  onEdit: (subject: Subject) => void;
  onDelete: (subject: Subject) => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  onQuickMark,
  onViewDetails,
  onEdit,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const analysis = analyzeSubject(subject);
  const meta = STATUS_META[analysis.status];

  const verdictText =
    subject.conducted === 0
      ? 'No classes conducted yet'
      : analysis.maxSkippableMin > 0
      ? `Safe to skip ${analysis.maxSkippableMin} class${
          analysis.maxSkippableMin === 1 ? '' : 'es'
        } (min ${subject.min_required_percentage}%)`
      : analysis.currentPercentage >= subject.min_required_percentage
      ? 'On exact border — do not skip next class'
      : analysis.requiredForMin.isImpossible
      ? '100% target unreachable'
      : `Attend next ${analysis.requiredForMin.required} class${
          analysis.requiredForMin.required === 1 ? '' : 'es'
        } for ${subject.min_required_percentage}%`;

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300/70 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700/60">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-extrabold text-slate-900 dark:text-white">
                {subject.name}
              </h3>
              {subject.code && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {subject.code}
                </span>
              )}
            </div>
            {subject.faculty && (
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <UserCheck className="h-3.5 w-3.5" />
                {subject.faculty}
              </p>
            )}
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Subject actions"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-fade-in dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onViewDetails(subject);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Details & Log
                </button>
                <Link
                  to={`/calculator?subject=${encodeURIComponent(subject.id)}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Calculator className="h-3.5 w-3.5" />
                  Open Bunk Calc
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(subject);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit Subject
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(subject);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Subject
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Metrics & Badge */}
        <div className="mt-4 flex items-end justify-between">
          <div>
            <span className="font-mono text-2xl font-extrabold text-slate-900 dark:text-white">
              {analysis.currentPercentage}%
            </span>
            <span className="ml-2 font-mono text-xs font-medium text-slate-500 dark:text-slate-400">
              {subject.attended}/{subject.conducted} classes
            </span>
          </div>
          <StatusBadge status={analysis.status} />
        </div>

        {/* Progress Bar */}
        <div className="relative mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${meta.barClass}`}
            style={{ width: `${Math.min(100, analysis.currentPercentage)}%` }}
          />
          <div
            title={`Min required: ${subject.min_required_percentage}%`}
            className="absolute top-0 bottom-0 w-0.5 bg-slate-900/40 dark:bg-white/60"
            style={{ left: `${Math.min(99, subject.min_required_percentage)}%` }}
          />
        </div>

        {/* Verdict */}
        <p className="mt-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
          {verdictText}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3.5 dark:border-slate-800">
        <button
          type="button"
          onClick={() => onQuickMark(subject.id, 'present')}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70"
        >
          <Check className="h-3.5 w-3.5" />
          +1 Present
        </button>
        <button
          type="button"
          onClick={() => onQuickMark(subject.id, 'absent')}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70"
        >
          <X className="h-3.5 w-3.5" />
          +1 Absent
        </button>
      </div>
    </div>
  );
};
