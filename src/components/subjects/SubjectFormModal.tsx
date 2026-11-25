import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SubjectInput } from '../../context/AttendanceContext';
import { Subject } from '../../types/attendance';
import { calculateAttendancePercentage } from '../../utils/calculator';
import { Modal } from '../common/Modal';

interface SubjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SubjectInput) => Promise<void>;
  initialSubject?: Subject | null;
}

export const SubjectFormModal: React.FC<SubjectFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialSubject,
}) => {
  const { user } = useAuth();
  const defaultMin = user?.default_min_attendance || 75;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [faculty, setFaculty] = useState('');
  const [conducted, setConducted] = useState('0');
  const [attended, setAttended] = useState('0');
  const [minReq, setMinReq] = useState(String(defaultMin));
  const [targetPct, setTargetPct] = useState(String(Math.max(defaultMin + 5, 80)));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (initialSubject) {
      setName(initialSubject.name);
      setCode(initialSubject.code || '');
      setFaculty(initialSubject.faculty || '');
      setConducted(String(initialSubject.conducted));
      setAttended(String(initialSubject.attended));
      setMinReq(String(initialSubject.min_required_percentage));
      setTargetPct(String(initialSubject.target_percentage));
    } else {
      setName('');
      setCode('');
      setFaculty('');
      setConducted('0');
      setAttended('0');
      setMinReq(String(defaultMin));
      setTargetPct(String(Math.min(100, Math.max(defaultMin + 5, 80))));
    }
  }, [isOpen, initialSubject, defaultMin]);

  const numConducted = Math.max(0, Math.floor(Number(conducted) || 0));
  const numAttended = Math.max(0, Math.floor(Number(attended) || 0));
  const livePct = calculateAttendancePercentage(
    Math.min(numAttended, numConducted),
    numConducted
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Subject name is required.');
      return;
    }

    const c = Number(conducted);
    const a = Number(attended);
    const min = Number(minReq);
    const target = Number(targetPct);

    if (!Number.isFinite(c) || c < 0 || !Number.isFinite(a) || a < 0) {
      setError('Attended and conducted classes must be 0 or greater.');
      return;
    }
    if (a > c) {
      setError('Attended classes cannot exceed total conducted classes.');
      return;
    }
    if (!Number.isFinite(min) || min < 1 || min > 100) {
      setError('Minimum required percentage must be between 1 and 100.');
      return;
    }
    if (!Number.isFinite(target) || target < 1 || target > 100) {
      setError('Personal target percentage must be between 1 and 100.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        code: code.trim() || undefined,
        faculty: faculty.trim() || undefined,
        conducted: Math.floor(c),
        attended: Math.floor(a),
        min_required_percentage: min,
        target_percentage: Math.max(min, target),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialSubject ? 'Edit Subject' : 'Add New Subject'}
      subtitle="Configure attendance counters and your target thresholds."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Subject Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Data Structures & Algorithms"
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Subject Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., CS301"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Faculty Name
            </label>
            <input
              type="text"
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              placeholder="e.g., Dr. R. Verma"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Classes Attended
            </label>
            <input
              type="number"
              min={0}
              value={attended}
              onChange={(e) => setAttended(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Classes Conducted
            </label>
            <input
              type="number"
              min={0}
              value={conducted}
              onChange={(e) => setConducted(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Live Percentage Preview */}
        <div className="flex items-center justify-between rounded-xl border border-brand-200/70 bg-brand-50/70 px-4 py-2.5 dark:border-brand-900/50 dark:bg-brand-950/30">
          <span className="text-xs font-semibold text-brand-800 dark:text-brand-300">
            Live Attendance Preview
          </span>
          <span className="font-mono text-base font-extrabold text-brand-700 dark:text-brand-300">
            {numAttended > numConducted ? 'Invalid' : `${livePct}%`}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Min Required (%)
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={minReq}
              onChange={(e) => setMinReq(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Personal Target (%)
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={targetPct}
              onChange={(e) => setTargetPct(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
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
            disabled={saving}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
          >
            {saving
              ? 'Saving...'
              : initialSubject
              ? 'Save Changes'
              : 'Create Subject'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
