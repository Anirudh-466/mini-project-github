import React from 'react';
import { Calendar, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { Subject } from '../../types/attendance';
import { analyzeSubject } from '../../utils/calculator';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';

interface SubjectDetailModalProps {
  subject: Subject | null;
  onClose: () => void;
}

const RECORD_BADGE_MAP = {
  present:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  absent: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  medical: 'bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300',
  cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export const SubjectDetailModal: React.FC<SubjectDetailModalProps> = ({
  subject,
  onClose,
}) => {
  const { records, deleteRecord } = useAttendance();

  if (!subject) return null;
  const analysis = analyzeSubject(subject);
  const subjectRecords = records
    .filter((r) => r.subject_id === subject.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Modal
      isOpen={Boolean(subject)}
      onClose={onClose}
      title={subject.name}
      subtitle={[subject.code, subject.faculty].filter(Boolean).join(' • ') || 'Subject Analytics & Log'}
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Top KPI Strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
            <p className="text-[11px] font-bold uppercase text-slate-500">Current</p>
            <p className="mt-1 font-mono text-xl font-extrabold text-slate-900 dark:text-white">
              {analysis.currentPercentage}%
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
            <p className="text-[11px] font-bold uppercase text-slate-500">Attended</p>
            <p className="mt-1 font-mono text-xl font-extrabold text-slate-900 dark:text-white">
              {subject.attended}/{subject.conducted}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
            <p className="text-[11px] font-bold uppercase text-slate-500">Min / Goal</p>
            <p className="mt-1 font-mono text-xl font-extrabold text-slate-900 dark:text-white">
              {subject.min_required_percentage}% / {subject.target_percentage}%
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
            <p className="text-[11px] font-bold uppercase text-slate-500">Status</p>
            <div className="mt-1.5">
              <StatusBadge status={analysis.status} />
            </div>
          </div>
        </div>

        {/* Bunk Verdict & Next Class Delta */}
        <div className="rounded-2xl border border-brand-200/70 bg-brand-50/50 p-4 dark:border-brand-900/50 dark:bg-brand-950/30">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
            Bunk Verdict
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
            {analysis.maxSkippableMin > 0
              ? `You can safely bunk ${analysis.maxSkippableMin} class${
                  analysis.maxSkippableMin === 1 ? '' : 'es'
                } and still stay above ${subject.min_required_percentage}%.`
              : analysis.requiredForMin.isImpossible
              ? analysis.requiredForMin.explanation
              : analysis.requiredForMin.required === 0
              ? `You are right on the ${subject.min_required_percentage}% threshold. Attend the next class to build a buffer.`
              : `Attend the next ${analysis.requiredForMin.required} consecutive class${
                  analysis.requiredForMin.required === 1 ? '' : 'es'
                } to reach ${subject.min_required_percentage}%.`}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 dark:bg-slate-900">
              <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                Attend Next
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {analysis.ifAttendNext}%
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 dark:bg-slate-900">
              <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                Miss Next
              </span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                {analysis.ifMissNext}%
              </span>
            </div>
          </div>
        </div>

        {/* Per-Subject Attendance Log */}
        <div>
          <h3 className="mb-2.5 text-sm font-bold text-slate-900 dark:text-white">
            Attendance Log ({subjectRecords.length})
          </h3>
          {subjectRecords.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              No individual class records logged for this subject yet.
            </p>
          ) : (
            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
              {subjectRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5 dark:border-slate-800"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {rec.date}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold capitalize ${
                          RECORD_BADGE_MAP[rec.status]
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>
                    {rec.notes && (
                      <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                        {rec.notes}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteRecord(rec.id)}
                    aria-label="Delete record"
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
