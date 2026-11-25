import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Eye,
  Minus,
  Plus,
  Sparkles,
  Stethoscope,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useAttendance } from '../context/AttendanceContext';
import { MedicalLeave, MedicalPolicyMode, Subject } from '../types/attendance';
import {
  calculateDaysInclusive,
  calculateMedicalOverallImpact,
} from '../utils/calculator';
import { getOffsetDateISO, getTodayISO } from '../utils/storage';

const QUICK_DAYS = [1, 2, 3, 5, 7];

function addDaysToIso(startIso: string, addDays: number): string {
  const parts = startIso.split('-').map(Number);
  if (parts.length !== 3) return getTodayISO();
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  d.setUTCDate(d.getUTCDate() + addDays);
  return d.toISOString().slice(0, 10);
}

export const MedicalLeavePage: React.FC = () => {
  const {
    subjects,
    medicalLeaves,
    addMedicalLeave,
    updateMedicalLeave,
    deleteMedicalLeave,
    applyMedicalLeaveToAttendance,
  } = useAttendance();

  const [predictorMode, setPredictorMode] = useState<'subjects' | 'custom'>(
    subjects.length > 0 ? 'subjects' : 'custom'
  );

  const [title, setTitle] = useState('Viral Fever Medical Leave');
  const [startDate, setStartDate] = useState(getOffsetDateISO(-2));
  const [endDate, setEndDate] = useState(getTodayISO());
  const [alreadyMarkedAbsent, setAlreadyMarkedAbsent] = useState(true);
  const [policyMode, setPolicyMode] = useState<MedicalPolicyMode>('credit_present');
  const [subjectClasses, setSubjectClasses] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    subjects.forEach((s) => {
      if (s.conducted - s.attended > 0) {
        initial[s.id] = Math.min(2, s.conducted - s.attended);
      }
    });
    return initial;
  });
  const [notes, setNotes] = useState('');

  // Custom sandbox test state
  const [customName, setCustomName] = useState('Sample Subject');
  const [customAttended, setCustomAttended] = useState(12);
  const [customConducted, setCustomConducted] = useState(20);
  const [customMedicalClasses, setCustomMedicalClasses] = useState(4);

  const [applyTarget, setApplyTarget] = useState<MedicalLeave | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MedicalLeave | null>(null);
  const [feedback, setFeedback] = useState('');

  const daysCount = calculateDaysInclusive(startDate, endDate);

  const activeSubjects: Subject[] = useMemo(() => {
    if (predictorMode === 'subjects') return subjects;
    return [
      {
        id: 'custom-sandbox-sub',
        user_id: 'custom',
        name: customName.trim() || 'Sample Subject',
        conducted: Math.max(customAttended, customConducted),
        attended: Math.max(0, customAttended),
        min_required_percentage: 75,
        target_percentage: 80,
        created_at: new Date().toISOString(),
      },
    ];
  }, [predictorMode, subjects, customName, customAttended, customConducted]);

  const activeClassMap: Record<string, number> = useMemo(() => {
    if (predictorMode === 'subjects') return subjectClasses;
    return { 'custom-sandbox-sub': Math.max(0, customMedicalClasses) };
  }, [predictorMode, subjectClasses, customMedicalClasses]);

  const impact = useMemo(
    () =>
      calculateMedicalOverallImpact(
        activeSubjects,
        activeClassMap,
        alreadyMarkedAbsent,
        policyMode
      ),
    [activeSubjects, activeClassMap, alreadyMarkedAbsent, policyMode]
  );

  const handleQuickDays = (days: number) => {
    const base = startDate || getTodayISO();
    setEndDate(addDaysToIso(base, days - 1));
  };

  const handleStepSubject = (subjectId: string, delta: number) => {
    setSubjectClasses((prev) => {
      const next = Math.max(0, (prev[subjectId] || 0) + delta);
      return { ...prev, [subjectId]: next };
    });
  };

  const handleFillAllMissed = () => {
    const next: Record<string, number> = {};
    for (const s of subjects) {
      const missed = Math.max(0, s.conducted - s.attended);
      if (missed > 0) next[s.id] = missed;
    }
    setSubjectClasses(next);
  };

  const handleClearClasses = () => {
    setSubjectClasses({});
  };

  const totalSelectedClasses = Object.values(subjectClasses).reduce(
    (sum, n) => sum + (n || 0),
    0
  );

  const handleSave = async (applyImmediately: boolean) => {
    if (predictorMode !== 'subjects' || totalSelectedClasses <= 0) return;
    await addMedicalLeave(
      {
        title: title.trim() || 'Medical Leave',
        start_date: startDate,
        end_date: endDate,
        days_count: Math.max(1, daysCount),
        subject_classes: subjectClasses,
        already_marked_absent: alreadyMarkedAbsent,
        policy_mode: policyMode,
        notes,
      },
      applyImmediately
    );
    setFeedback(
      applyImmediately
        ? 'Medical leave saved and applied to your attendance counters!'
        : 'Medical leave saved as Planned.'
    );
    setTimeout(() => setFeedback(''), 3000);
  };

  const handlePreviewLeave = (leave: MedicalLeave) => {
    setPredictorMode('subjects');
    setTitle(leave.title);
    setStartDate(leave.start_date);
    setEndDate(leave.end_date);
    setAlreadyMarkedAbsent(leave.already_marked_absent);
    setPolicyMode(leave.policy_mode);
    setSubjectClasses({ ...leave.subject_classes });
    setNotes(leave.notes || '');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            <Stethoscope className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            Medical Leave & Attendance Predictor
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Simulate how medical certificates recover past absences or shield
            upcoming sick days.
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            disabled={subjects.length === 0}
            onClick={() => setPredictorMode('subjects')}
            className={`rounded-lg px-3.5 py-2 text-xs font-bold transition disabled:opacity-40 ${
              predictorMode === 'subjects'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            My Subjects
          </button>
          <button
            type="button"
            onClick={() => setPredictorMode('custom')}
            className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              predictorMode === 'custom'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            Quick Custom Test
          </button>
        </div>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left Inputs Panel */}
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-7 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Medical Reason / Certificate Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Viral Fever Medical Certificate"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Dates & Quick Day Buttons */}
          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Leave Duration
              </label>
              <span className="rounded-full bg-brand-100 px-2.5 py-0.5 font-mono text-xs font-bold text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                {daysCount > 0 ? `${daysCount} inclusive day${daysCount > 1 ? 's' : ''}` : 'Invalid range'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <span className="mb-1 block text-[11px] font-semibold text-slate-500">
                  From
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <span className="mb-1 block text-[11px] font-semibold text-slate-500">
                  To
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">Quick fill:</span>
              {QUICK_DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleQuickDays(d)}
                  className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition ${
                    daysCount === d
                      ? 'bg-brand-600 text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {/* Timing & Policy Toggles */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Attendance Timing
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setAlreadyMarkedAbsent(true)}
                  className={`rounded-xl border p-2.5 text-left text-xs font-bold transition ${
                    alreadyMarkedAbsent
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  Already Marked Absent
                  <span className="mt-0.5 block font-normal opacity-80">
                    Recover past absent marks
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setAlreadyMarkedAbsent(false)}
                  className={`rounded-xl border p-2.5 text-left text-xs font-bold transition ${
                    !alreadyMarkedAbsent
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  Upcoming / Unlogged
                  <span className="mt-0.5 block font-normal opacity-80">
                    Compare against absent drop
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                College Medical Policy
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setPolicyMode('credit_present')}
                  className={`rounded-xl border p-2.5 text-left text-xs font-bold transition ${
                    policyMode === 'credit_present'
                      ? 'border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-950/40 dark:text-brand-300'
                      : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  Count as Present
                  <span className="mt-0.5 block font-normal opacity-80">
                    Medical classes credited as attended
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPolicyMode('exclude_conducted')}
                  className={`rounded-xl border p-2.5 text-left text-xs font-bold transition ${
                    policyMode === 'exclude_conducted'
                      ? 'border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-950/40 dark:text-brand-300'
                      : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  Exclude from Total
                  <span className="mt-0.5 block font-normal opacity-80">
                    Medical classes removed from denominator
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Subject Classes or Custom Sandbox */}
          {predictorMode === 'subjects' ? (
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Classes Covered by Medical ({totalSelectedClasses} selected)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleFillAllMissed}
                    className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 hover:bg-brand-100 dark:bg-brand-950/50 dark:text-brand-300"
                  >
                    Fill all missed
                  </button>
                  <button
                    type="button"
                    onClick={handleClearClasses}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {subjects.map((s) => {
                  const count = subjectClasses[s.id] || 0;
                  const missed = Math.max(0, s.conducted - s.attended);
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5 dark:border-slate-800"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                          {s.name}
                        </p>
                        <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          {s.attended}/{s.conducted} • {missed} missed
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStepSubject(s.id, -1)}
                          aria-label={`Decrease medical classes for ${s.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center font-mono text-sm font-extrabold text-slate-900 dark:text-white">
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStepSubject(s.id, 1)}
                          aria-label={`Increase medical classes for ${s.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Attended
                </label>
                <input
                  type="number"
                  min={0}
                  value={customAttended}
                  onChange={(e) => {
                    const v = Math.max(0, Math.floor(Number(e.target.value) || 0));
                    setCustomAttended(v);
                    if (v > customConducted) setCustomConducted(v);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Conducted
                </label>
                <input
                  type="number"
                  min={customAttended}
                  value={customConducted}
                  onChange={(e) =>
                    setCustomConducted(
                      Math.max(customAttended, Math.floor(Number(e.target.value) || 0))
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Medical Classes
                </label>
                <input
                  type="number"
                  min={0}
                  value={customMedicalClasses}
                  onChange={(e) =>
                    setCustomMedicalClasses(
                      Math.max(0, Math.floor(Number(e.target.value) || 0))
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="OPD slip / Dean approval reference..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {predictorMode === 'subjects' && (
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                disabled={totalSelectedClasses === 0}
                onClick={() => handleSave(false)}
                className="flex-1 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-brand-100 disabled:opacity-40 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300"
              >
                Save as Planned Medical
              </button>
              <button
                type="button"
                disabled={totalSelectedClasses === 0}
                onClick={() => handleSave(true)}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40"
              >
                Save & Apply to My Attendance
              </button>
            </div>
          )}
        </div>

        {/* Right Live Result Panel */}
        <div className="space-y-5 xl:col-span-5">
          {/* Big Before vs After Card */}
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-brand-50 p-6 shadow-sm dark:border-emerald-900/60 dark:from-emerald-950/30 dark:via-slate-900 dark:to-brand-950/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Overall Medical Impact
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 font-mono text-xs font-extrabold text-white">
                <Sparkles className="h-3.5 w-3.5" />
                {impact.deltaPercentage >= 0 ? '+' : ''}
                {impact.deltaPercentage}% Boost
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/80">
                <p className="text-xs font-semibold text-slate-500">Before Medical</p>
                <p className="mt-1 font-mono text-3xl font-extrabold text-slate-800 dark:text-slate-200">
                  {impact.beforePercentage}%
                </p>
                <p className="mt-1 font-mono text-xs text-slate-500">
                  {impact.beforeAttended}/{impact.beforeConducted}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-300 bg-white p-4 shadow-sm dark:border-emerald-800 dark:bg-slate-900">
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  After Medical
                </p>
                <p className="mt-1 font-mono text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {impact.afterPercentage}%
                </p>
                <p className="mt-1 font-mono text-xs text-slate-500">
                  {impact.afterAttended}/{impact.afterConducted}
                </p>
              </div>
            </div>

            {!alreadyMarkedAbsent && impact.totalEffectiveClasses > 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs dark:border-amber-900/50 dark:bg-amber-950/30">
                <p className="font-bold text-amber-900 dark:text-amber-200">
                  Without Medical (if marked Absent):{' '}
                  <span className="font-mono">{impact.withoutMedicalPercentage}%</span>
                </p>
                <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                  This medical certificate protects you from a{' '}
                  <span className="font-mono font-bold">
                    {impact.preventedDropPercentage}%
                  </span>{' '}
                  attendance drop!
                </p>
              </div>
            )}
          </div>

          {/* Per-Subject Breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Subject-Wise Breakdown
            </h2>

            {impact.subjectImpacts.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Increment at least one subject class count to inspect per-subject
                changes.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {impact.subjectImpacts.map((item) => (
                  <div
                    key={item.subjectId}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        {item.subjectName}
                      </p>
                      <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                        {item.deltaPercentage >= 0 ? '+' : ''}
                        {item.deltaPercentage}%
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {item.beforePercentage}% ({item.beforeAttended}/
                      {item.beforeConducted}) → {item.afterPercentage}% (
                      {item.afterAttended}/{item.afterConducted})
                    </p>
                    <p className="mt-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                      {item.afterAnalysis.maxSkippableMin > 0
                        ? `Updated Bunk Advice: Safe to skip ${item.afterAnalysis.maxSkippableMin} class(es)`
                        : item.afterAnalysis.requiredForMin.required === 0
                        ? 'Updated Bunk Advice: Meets minimum requirement'
                        : item.afterAnalysis.requiredForMin.isImpossible
                        ? 'Updated Bunk Advice: 100% target unreachable'
                        : `Updated Bunk Advice: Attend next ${item.afterAnalysis.requiredForMin.required} class(es)`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Medical Leaves List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
          Saved Medical Leaves ({medicalLeaves.length})
        </h2>

        {medicalLeaves.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            No saved medical certificates yet. Use the predictor above to save or
            apply one.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {medicalLeaves.map((leave) => {
              const totalClasses = Object.values(leave.subject_classes).reduce(
                (a, b) => a + b,
                0
              );
              return (
                <div
                  key={leave.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center dark:border-slate-800"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {leave.title}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                          leave.applied_to_records
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : leave.status === 'applied'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                        }`}
                      >
                        {leave.applied_to_records ? 'Applied to Attendance' : leave.status}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1 font-mono">
                        <Calendar className="h-3.5 w-3.5" />
                        {leave.start_date} to {leave.end_date} ({leave.days_count}d)
                      </span>
                      <span>• {totalClasses} classes</span>
                      <span>
                        •{' '}
                        {leave.policy_mode === 'credit_present'
                          ? 'Count as Present'
                          : 'Exclude from Total'}
                      </span>
                    </div>
                    {leave.notes && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {leave.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePreviewLeave(leave)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </button>

                    {leave.status === 'planned' && !leave.applied_to_records && (
                      <button
                        type="button"
                        onClick={() =>
                          updateMedicalLeave(leave.id, { status: 'applied' })
                        }
                        className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
                      >
                        Mark Submitted
                      </button>
                    )}

                    {!leave.applied_to_records && (
                      <button
                        type="button"
                        onClick={() => setApplyTarget(leave)}
                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        Apply to Attendance
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(leave)}
                      aria-label="Delete medical leave"
                      className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(applyTarget)}
        onClose={() => setApplyTarget(null)}
        title="Apply Medical Leave to Attendance"
        message={`Apply "${applyTarget?.title}" directly to your subject attendance counters? This will mark the leave as Approved and update your official totals.`}
        confirmLabel="Apply Now"
        onConfirm={() => {
          if (applyTarget) {
            applyMedicalLeaveToAttendance(applyTarget.id);
          }
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        destructive
        title="Delete Medical Leave"
        message={`Delete "${deleteTarget?.title}"?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            deleteMedicalLeave(deleteTarget.id);
          }
        }}
      />
    </div>
  );
};
