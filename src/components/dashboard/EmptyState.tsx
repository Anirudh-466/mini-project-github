import React from 'react';
import { BookPlus, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  onAddSubject: () => void;
  onLoadSampleData: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onAddSubject,
  onLoadSampleData,
}) => {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-950/70 dark:text-brand-400">
        <BookPlus className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
        No subjects added yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
        Add your semester courses to track attendance percentages, calculate safe
        bunks, and predict medical leave impacts.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onAddSubject}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          <BookPlus className="h-4 w-4" />
          Add Your First Subject
        </button>
        <button
          type="button"
          onClick={onLoadSampleData}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <Sparkles className="h-4 w-4 text-accent-500" />
          Load Sample College Subjects
        </button>
      </div>
    </div>
  );
};
