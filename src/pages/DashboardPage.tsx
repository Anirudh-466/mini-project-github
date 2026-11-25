import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  ArrowRight,
  BookPlus,
  Calculator,
  CheckSquare,
  FileBarChart2,
  Stethoscope,
} from 'lucide-react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { AttendanceChart } from '../components/dashboard/AttendanceChart';
import { EmptyState } from '../components/dashboard/EmptyState';
import { MotivationalCard } from '../components/dashboard/MotivationalCard';
import { OverallStatsCards } from '../components/dashboard/OverallStatsCards';
import { SubjectCard } from '../components/dashboard/SubjectCard';
import { SubjectDetailModal } from '../components/subjects/SubjectDetailModal';
import { SubjectFormModal } from '../components/subjects/SubjectFormModal';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { Subject } from '../types/attendance';
import { aggregatePendingMedicalLeaves, analyzeSubject } from '../utils/calculator';

interface DashboardPageProps {
  onOpenQuickMark: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenQuickMark }) => {
  const { user } = useAuth();
  const {
    subjects,
    medicalLeaves,
    overallStats,
    addSubject,
    updateSubject,
    deleteSubject,
    quickIncrementAttendance,
    resetSampleData,
  } = useAttendance();

  const [formOpen, setFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [detailSubject, setDetailSubject] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);

  const minGoal = user?.default_min_attendance || 75;
  const pendingMedicalLeaves = useMemo(
    () => medicalLeaves.filter((m) => !m.applied_to_records),
    [medicalLeaves]
  );

  const pendingMedicalImpact = useMemo(
    () => aggregatePendingMedicalLeaves(subjects, pendingMedicalLeaves),
    [subjects, pendingMedicalLeaves]
  );

  const handleQuickMark = async (subjectId: string, status: 'present' | 'absent') => {
    const sub = subjects.find((s) => s.id === subjectId);
    const wasBelow =
      sub ? analyzeSubject(sub).currentPercentage < sub.target_percentage : false;
    await quickIncrementAttendance(subjectId, status);
    if (status === 'present' && sub && wasBelow) {
      const nextPct = ((sub.attended + 1) / (sub.conducted + 1)) * 100;
      if (nextPct >= sub.target_percentage) {
        try {
          confetti({ particleCount: 55, spread: 60, origin: { y: 0.7 } });
        } catch {
          // Ignore environments without canvas support
        }
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting & Quick Actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Hey, {user?.display_name || 'Student'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {user?.college_name ? `${user.college_name} • ` : ''}
            Minimum requirement: {minGoal}% • Here is your attendance pulse.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingSubject(null);
              setFormOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-700 sm:text-sm"
          >
            <BookPlus className="h-4 w-4" />
            Add Subject
          </button>
          <button
            type="button"
            onClick={onOpenQuickMark}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 sm:text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <CheckSquare className="h-4 w-4 text-emerald-500" />
            Mark Attendance
          </button>
          <Link
            to="/calculator"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 sm:text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Calculator className="h-4 w-4 text-brand-500" />
            Bunk Calculator
          </Link>
          <Link
            to="/medical"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 sm:text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Stethoscope className="h-4 w-4 text-rose-500" />
            Add Medical
          </Link>
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 sm:text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <FileBarChart2 className="h-4 w-4 text-indigo-500" />
            Reports
          </Link>
        </div>
      </div>

      {subjects.length === 0 ? (
        <EmptyState
          onAddSubject={() => {
            setEditingSubject(null);
            setFormOpen(true);
          }}
          onLoadSampleData={resetSampleData}
        />
      ) : (
        <>
          {/* 4 KPI Cards */}
          <OverallStatsCards
            stats={overallStats}
            minAttendanceGoal={minGoal}
            subjectCount={subjects.length}
          />

          {/* Queued Medical Leave Banner */}
          {pendingMedicalLeaves.length > 0 && (
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50/70 to-white p-4 shadow-sm sm:flex-row sm:items-center dark:border-emerald-900/60 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {pendingMedicalLeaves.length} Queued Medical Leave
                    {pendingMedicalLeaves.length > 1 ? 's' : ''} Pending
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                    Applying pending medical leave will project your overall
                    attendance from{' '}
                    <span className="font-mono font-bold">
                      {pendingMedicalImpact.beforePercentage}%
                    </span>{' '}
                    to{' '}
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {pendingMedicalImpact.afterPercentage}%
                    </span>{' '}
                    ({pendingMedicalImpact.deltaPercentage >= 0 ? '+' : ''}
                    {pendingMedicalImpact.deltaPercentage}%).
                  </p>
                </div>
              </div>
              <Link
                to="/medical"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
              >
                Review & Apply
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {/* Motivational Verdict + Chart */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <MotivationalCard subjects={subjects} />
            <AttendanceChart subjects={subjects} minRequiredLine={minGoal} />
          </div>

          {/* Enrolled Subjects Grid */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Enrolled Subjects ({subjects.length})
              </h2>
              <Link
                to="/subjects"
                className="text-xs font-bold text-brand-600 hover:underline dark:text-brand-400"
              >
                Manage All Subjects →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {subjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  onQuickMark={handleQuickMark}
                  onViewDetails={setDetailSubject}
                  onEdit={(sub) => {
                    setEditingSubject(sub);
                    setFormOpen(true);
                  }}
                  onDelete={setDeletingSubject}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <SubjectFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingSubject(null);
        }}
        initialSubject={editingSubject}
        onSubmit={async (data) => {
          if (editingSubject) {
            await updateSubject(editingSubject.id, data);
          } else {
            await addSubject(data);
          }
        }}
      />

      <SubjectDetailModal
        subject={
          detailSubject
            ? subjects.find((s) => s.id === detailSubject.id) || null
            : null
        }
        onClose={() => setDetailSubject(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingSubject)}
        onClose={() => setDeletingSubject(null)}
        destructive
        title="Delete Subject"
        message={`Are you sure you want to delete "${deletingSubject?.name}" and its attendance records? This cannot be undone.`}
        confirmLabel="Delete Subject"
        onConfirm={() => {
          if (deletingSubject) {
            deleteSubject(deletingSubject.id);
          }
        }}
      />
    </div>
  );
};
