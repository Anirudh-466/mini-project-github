import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  CheckCircle2,
  Minus,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import {
  calculateAttendancePercentage,
  calculateMaxSkippableClasses,
  calculatePredictedAttendance,
  calculateRequiredClasses,
  getAttendanceStatus,
} from '../utils/calculator';
import { StatusBadge } from '../components/common/StatusBadge';

const PRESET_SCENARIOS = [
  { label: '16/20 -> 75%', attended: 16, conducted: 20, target: 75 },
  { label: '12/20 -> 75%', attended: 12, conducted: 20, target: 75 },
  { label: '10/10 -> 75%', attended: 10, conducted: 10, target: 75 },
  { label: '6/10 -> 75%', attended: 6, conducted: 10, target: 75 },
];

const COMMON_GOALS = [65, 75, 80, 85, 90];

export const BunkCalculatorPage: React.FC = () => {
  const { subjects, updateSubject } = useAttendance();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSubjectParam = searchParams.get('subject');
  const [mode, setMode] = useState<'subject' | 'custom'>(
    subjects.length > 0 ? 'subject' : 'custom'
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSubjectParam && subjects.some((s) => s.id === initialSubjectParam)
      ? initialSubjectParam
      : subjects[0]?.id || ''
  );

  // Custom sandbox states
  const [customAttended, setCustomAttended] = useState<number>(16);
  const [customConducted, setCustomConducted] = useState<number>(20);
  const [goalPct, setGoalPct] = useState<number>(75);

  // Live simulator states
  const [futureAttend, setFutureAttend] = useState<number>(0);
  const [futureMiss, setFutureMiss] = useState<number>(0);
  const [savedNotice, setSavedNotice] = useState<string>('');

  // Sync URL ?subject=<id> when available
  useEffect(() => {
    if (subjects.length === 0) {
      setMode('custom');
      return;
    }
    if (initialSubjectParam && subjects.some((s) => s.id === initialSubjectParam)) {
      setMode('subject');
      setSelectedSubjectId(initialSubjectParam);
    } else if (!selectedSubjectId && subjects[0]) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [initialSubjectParam, subjects]);

  const activeSubject = useMemo(
    () => subjects.find((s) => s.id === selectedSubjectId) || subjects[0] || null,
    [subjects, selectedSubjectId]
  );

  // When switching active subject in subject mode, sync goalPct to subject's target
  useEffect(() => {
    if (mode === 'subject' && activeSubject) {
      setGoalPct(activeSubject.min_required_percentage);
      setFutureAttend(0);
      setFutureMiss(0);
    }
  }, [mode, activeSubject?.id]);

  const attended =
    mode === 'subject' && activeSubject ? activeSubject.attended : customAttended;
  const conducted =
    mode === 'subject' && activeSubject
      ? activeSubject.conducted
      : Math.max(customAttended, customConducted);

  const currentPct = calculateAttendancePercentage(attended, conducted);
  const safeSkips = calculateMaxSkippableClasses(attended, conducted, goalPct);
  const requiredRes = calculateRequiredClasses(attended, conducted, goalPct);
  const predictedPct = calculatePredictedAttendance(
    attended,
    conducted,
    futureAttend,
    futureMiss
  );
  const status = getAttendanceStatus(
    currentPct,
    goalPct,
    mode === 'subject' && activeSubject
      ? Math.max(goalPct, activeSubject.target_percentage)
      : Math.max(goalPct, 80)
  );

  const handleApplyPreset = (preset: (typeof PRESET_SCENARIOS)[number]) => {
    setMode('custom');
    setCustomAttended(preset.attended);
    setCustomConducted(preset.conducted);
    setGoalPct(preset.target);
    setFutureAttend(0);
    setFutureMiss(0);
  };

  const handleSaveGoalToSubject = async () => {
    if (mode !== 'subject' || !activeSubject) return;
    await updateSubject(activeSubject.id, {
      target_percentage: Math.max(activeSubject.min_required_percentage, goalPct),
    });
    setSavedNotice(`Saved ${goalPct}% goal to ${activeSubject.name}`);
    setTimeout(() => setSavedNotice(''), 2500);
  };

  const handleResetGoal = () => {
    if (mode === 'subject' && activeSubject) {
      setGoalPct(activeSubject.min_required_percentage);
    } else {
      setGoalPct(75);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Mode Switch */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            <Calculator className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            The Bunk Calculator
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Exact safe skips, consecutive recovery streaks, and what-if simulations.
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            disabled={subjects.length === 0}
            onClick={() => setMode('subject')}
            className={`rounded-lg px-3.5 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
              mode === 'subject'
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            My Enrolled Subjects
          </button>
          <button
            type="button"
            onClick={() => setMode('custom')}
            className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              mode === 'custom'
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            Custom Sandbox
          </button>
        </div>
      </div>

      {/* Medical Leave Banner */}
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:flex-row sm:items-center dark:border-emerald-900/60 dark:bg-emerald-950/30">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="text-xs font-medium text-slate-700 sm:text-sm dark:text-slate-200">
            Have a medical certificate or upcoming sick leave? Check how it boosts
            your attendance before submitting.
          </p>
        </div>
        <Link
          to="/medical"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
        >
          Medical Leave Predictor
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Controls Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {mode === 'subject' && activeSubject ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Select Subject
              </label>
              <select
                value={activeSubject.id}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setSearchParams({ subject: e.target.value });
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.attended}/{s.conducted})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Current Standing
                </p>
                <p className="font-mono text-xl font-extrabold text-slate-900 dark:text-white">
                  {currentPct}%{' '}
                  <span className="text-xs font-medium text-slate-500">
                    ({attended}/{conducted})
                  </span>
                </p>
              </div>
              <StatusBadge status={status} size="md" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Quick Test Scenarios
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_SCENARIOS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-brand-950/40"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Attended Classes
                </label>
                <input
                  type="number"
                  min={0}
                  value={customAttended}
                  onChange={(e) => {
                    const val = Math.max(0, Math.floor(Number(e.target.value) || 0));
                    setCustomAttended(val);
                    if (val > customConducted) setCustomConducted(val);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm font-bold text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Conducted Classes
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm font-bold text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Current %</p>
                  <p className="font-mono text-xl font-extrabold text-slate-900 dark:text-white">
                    {currentPct}%
                  </p>
                </div>
                <StatusBadge status={status} />
              </div>
            </div>
          </div>
        )}

        {/* Common Goal Quick Buttons */}
        <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Target Goal:
              </span>
              {COMMON_GOALS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoalPct(g)}
                  className={`rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition ${
                    goalPct === g
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  {g}%
                </button>
              ))}
              <input
                type="number"
                min={1}
                max={100}
                aria-label="Custom goal percentage"
                value={goalPct}
                onChange={(e) =>
                  setGoalPct(
                    Math.min(100, Math.max(1, Number(e.target.value) || 75))
                  )
                }
                className="w-20 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs font-bold text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetGoal}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
              {mode === 'subject' && activeSubject && (
                <button
                  type="button"
                  onClick={handleSaveGoalToSubject}
                  className="inline-flex items-center gap-1 rounded-lg bg-accent-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-accent-700"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save as Subject Goal
                </button>
              )}
            </div>
          </div>
          {savedNotice && (
            <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {savedNotice}
            </p>
          )}
        </div>
      </div>

      {/* A & B Verdict Cards */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* A. How Many Can I Skip? */}
        <div className="rounded-2xl border border-emerald-200/80 bg-white p-6 shadow-sm dark:border-emerald-900/50 dark:bg-slate-900">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            A. How Many Can I Skip?
          </span>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-mono text-4xl font-extrabold text-slate-900 dark:text-white">
              {safeSkips}
            </span>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              safe class{safeSkips === 1 ? '' : 'es'} to skip
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {safeSkips > 0
              ? `Skipping ${safeSkips} class${
                  safeSkips === 1 ? '' : 'es'
                } brings you to ${calculatePredictedAttendance(
                  attended,
                  conducted,
                  0,
                  safeSkips
                )}% — still meeting ${goalPct}%.`
              : `No skip buffer available for ${goalPct}%.`}
          </p>
          <div className="mt-4 rounded-xl bg-slate-50 px-3.5 py-2.5 font-mono text-xs text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
            floor((100 × {attended} / {goalPct}) − {conducted}) = {safeSkips}
          </div>
        </div>

        {/* B. How Many Must I Attend? */}
        <div className="rounded-2xl border border-brand-200/80 bg-white p-6 shadow-sm dark:border-brand-900/50 dark:bg-slate-900">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            B. How Many Must I Attend?
          </span>
          {requiredRes.isImpossible ? (
            <>
              <div className="mt-3 flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-7 w-7" />
                <span className="text-2xl font-extrabold">Impossible (100%)</span>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {requiredRes.explanation}
              </p>
            </>
          ) : (
            <>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="font-mono text-4xl font-extrabold text-slate-900 dark:text-white">
                  {requiredRes.required}
                </span>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  consecutive class{requiredRes.required === 1 ? '' : 'es'} needed
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {requiredRes.required === 0
                  ? `You already meet or exceed your ${goalPct}% goal!`
                  : `Attending ${requiredRes.required} straight class${
                      requiredRes.required === 1 ? '' : 'es'
                    } brings you to ${calculatePredictedAttendance(
                      attended,
                      conducted,
                      requiredRes.required,
                      0
                    )}%.`}
              </p>
            </>
          )}
          <div className="mt-4 rounded-xl bg-slate-50 px-3.5 py-2.5 font-mono text-xs text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
            {goalPct >= 100
              ? '100% requires zero missed classes'
              : `ceil((${goalPct} × ${conducted} − 100 × ${attended}) / (100 − ${goalPct})) = ${requiredRes.required}`}
          </div>
        </div>
      </div>

      {/* C. Live Attendance Simulator */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-accent-600 dark:text-accent-400">
              C. Live Attendance Simulator
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Plan Your Upcoming Week
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setFutureAttend(0);
              setFutureMiss(0);
            }}
            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Simulation
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Attend Stepper */}
          <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <div>
              <p className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400">
                Classes I will ATTEND
              </p>
              <p className="mt-1 font-mono text-2xl font-extrabold text-slate-900 dark:text-white">
                +{futureAttend}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFutureAttend((v) => Math.max(0, v - 1))}
                aria-label="Decrease future attended classes"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-slate-800 dark:text-emerald-300"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setFutureAttend((v) => v + 1)}
                aria-label="Increase future attended classes"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Miss Stepper */}
          <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
            <div>
              <p className="text-xs font-bold uppercase text-rose-700 dark:text-rose-400">
                Classes I will MISS
              </p>
              <p className="mt-1 font-mono text-2xl font-extrabold text-slate-900 dark:text-white">
                +{futureMiss}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFutureMiss((v) => Math.max(0, v - 1))}
                aria-label="Decrease future missed classes"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-slate-800 dark:text-rose-300"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setFutureMiss((v) => v + 1)}
                aria-label="Increase future missed classes"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white hover:bg-rose-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Projected Percentage Banner */}
        <div
          className={`mt-5 flex flex-col justify-between gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center ${
            predictedPct >= goalPct
              ? 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 dark:border-emerald-800 dark:from-emerald-950/40 dark:to-slate-900'
              : 'border-rose-300 bg-gradient-to-r from-rose-50 to-amber-50/60 dark:border-rose-800 dark:from-rose-950/40 dark:to-slate-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {predictedPct >= goalPct ? (
              <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Sparkles className="h-7 w-7 text-rose-600 dark:text-rose-400" />
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Projected Attendance
              </p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {attended + futureAttend} / {conducted + futureAttend + futureMiss}{' '}
                classes ({predictedPct >= goalPct ? 'Meets' : 'Below'} {goalPct}% goal)
              </p>
            </div>
          </div>
          <div className="font-mono text-3xl font-extrabold text-slate-900 dark:text-white">
            {predictedPct}%
          </div>
        </div>
      </div>
    </div>
  );
};
