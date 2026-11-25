import React, { useMemo, useState } from 'react';
import { BookPlus, Search } from 'lucide-react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/dashboard/EmptyState';
import { SubjectCard } from '../components/dashboard/SubjectCard';
import { SubjectDetailModal } from '../components/subjects/SubjectDetailModal';
import { SubjectFormModal } from '../components/subjects/SubjectFormModal';
import { useAttendance } from '../context/AttendanceContext';
import { Subject } from '../types/attendance';
import { analyzeSubject } from '../utils/calculator';

type SubjectFilter = 'all' | 'on_target' | 'below_min';

export const SubjectsPage: React.FC = () => {
  const {
    subjects,
    addSubject,
    updateSubject,
    deleteSubject,
    quickIncrementAttendance,
    resetSampleData,
  } = useAttendance();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SubjectFilter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [detailSubject, setDetailSubject] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);

  const filteredSubjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subjects.filter((s) => {
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.code && s.code.toLowerCase().includes(q)) ||
        (s.faculty && s.faculty.toLowerCase().includes(q));

      if (!matchesQuery) return false;
      const analysis = analyzeSubject(s);
      if (filter === 'on_target') {
        return analysis.currentPercentage >= s.min_required_percentage;
      }
      if (filter === 'below_min') {
        return analysis.currentPercentage < s.min_required_percentage;
      }
      return true;
    });
  }, [subjects, query, filter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            My Subjects
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Add courses, adjust class counts, and inspect per-subject logs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingSubject(null);
            setFormOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
        >
          <BookPlus className="h-4 w-4" />
          Add Subject
        </button>
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
          {/* Search & Filter */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by subject, code, or faculty..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'on_target', label: 'On Target' },
                  { id: 'below_min', label: 'Below Min' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    filter === tab.id
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredSubjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No subjects match your current search or filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredSubjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  onQuickMark={quickIncrementAttendance}
                  onViewDetails={setDetailSubject}
                  onEdit={(sub) => {
                    setEditingSubject(sub);
                    setFormOpen(true);
                  }}
                  onDelete={setDeletingSubject}
                />
              ))}
            </div>
          )}
        </>
      )}

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
        message={`Delete "${deletingSubject?.name}"? All associated class records will also be removed.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deletingSubject) {
            deleteSubject(deletingSubject.id);
          }
        }}
      />
    </div>
  );
};
