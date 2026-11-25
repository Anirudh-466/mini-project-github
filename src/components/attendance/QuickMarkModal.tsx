import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, Stethoscope, XCircle, Ban } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { RecordStatus } from '../../types/attendance';
import { getTodayISO } from '../../utils/storage';
import { Modal } from '../common/Modal';

interface QuickMarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubjectId?: string;
}

const STATUS_OPTIONS: {
  value: RecordStatus;
  label: string;
  desc: string;
  icon: React.ReactNode;
  activeClass: string;
}[] = [
  {
    value: 'present',
    label: 'Present',
    desc: '+1 Attended, +1 Conducted',
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    activeClass:
      'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  {
    value: 'absent',
    label: 'Absent',
    desc: '+0 Attended, +1 Conducted',
    icon: <XCircle className="h-4 w-4 text-rose-500" />,
    activeClass:
      'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
  },
  {
    value: 'medical',
    label: 'Medical Leave',
    desc: '+1 Attended, +1 Conducted',
    icon: <Stethoscope className="h-4 w-4 text-brand-500" />,
    activeClass:
      'border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-950/40 dark:text-brand-300',
  },
  {
    value: 'cancelled',
    label: 'Class Cancelled',
    desc: 'No counter change',
    icon: <Ban className="h-4 w-4 text-slate-500" />,
    activeClass:
      'border-slate-500 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  },
];

export const QuickMarkModal: React.FC<QuickMarkModalProps> = ({
  isOpen,
  onClose,
  defaultSubjectId,
}) => {
  const { subjects, markAttendance } = useAttendance();
  const [subjectId, setSubjectId] = useState(defaultSubjectId || subjects[0]?.id || '');
  const [status, setStatus] = useState<RecordStatus>('present');
  const [date, setDate] = useState(getTodayISO());
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSubjectId(defaultSubjectId || subjects[0]?.id || '');
      setDate(getTodayISO());
      setNotes('');
      setStatus('present');
    }
  }, [isOpen, defaultSubjectId, subjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) return;
    setSubmitting(true);
    try {
      await markAttendance(subjectId, status, date, notes);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Mark Attendance"
      subtitle="Log a class and automatically update subject counters."
    >
      {subjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
          <BookOpen className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
            No subjects enrolled yet
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Add at least one subject first so you can log classes against it.
          </p>
          <Link
            to="/subjects"
            onClick={onClose}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Go to My Subjects
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Subject
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.code ? `(${s.code})` : ''} — {s.attended}/{s.conducted}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Class Status
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition ${
                    status === opt.value
                      ? opt.activeClass
                      : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <div className="mt-0.5">{opt.icon}</div>
                  <div>
                    <p className="text-sm font-bold">{opt.label}</p>
                    <p className="text-[11px] opacity-80">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Extra lab session or guest lecture"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
