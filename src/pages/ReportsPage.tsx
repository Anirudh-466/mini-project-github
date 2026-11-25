import React, { useMemo } from 'react';
import { Download, FileBarChart2, Printer, Stethoscope } from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { aggregatePendingMedicalLeaves, analyzeSubject } from '../utils/calculator';
import { exportAttendanceCSV } from '../utils/csvExport';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { subjects, records, medicalLeaves, overallStats } = useAttendance();

  const pendingMedical = useMemo(
    () => aggregatePendingMedicalLeaves(subjects, medicalLeaves),
    [subjects, medicalLeaves]
  );

  const pendingLeavesCount = medicalLeaves.filter((m) => !m.applied_to_records).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Screen Toolbar (hidden in print) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            <FileBarChart2 className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            Reports & Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Printable executive attendance summary and CSV data export.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => exportAttendanceCSV(user, subjects, records, medicalLeaves)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
          >
            <Printer className="h-4 w-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Printable Report Sheet */}
      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        {/* Student / College Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end dark:border-slate-800">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Aau ya Nahi! — Executive Attendance Report
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
              {user?.display_name || 'Student'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {user?.college_name || 'College / University'} • {user?.email}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-semibold text-slate-500">Generated On</p>
            <p className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <p className="text-xs font-bold text-slate-500">Overall Weighted %</p>
            <p className="mt-1 font-mono text-2xl font-extrabold text-slate-900 dark:text-white">
              {overallStats.overallPercentage}%
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <p className="text-xs font-bold text-slate-500">Total Classes</p>
            <p className="mt-1 font-mono text-2xl font-extrabold text-slate-900 dark:text-white">
              {overallStats.totalAttended}/{overallStats.totalConducted}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <p className="text-xs font-bold text-slate-500">Safe Bunks</p>
            <p className="mt-1 font-mono text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {overallStats.totalSafeBunks}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <p className="text-xs font-bold text-slate-500">Below Minimum</p>
            <p className="mt-1 font-mono text-2xl font-extrabold text-rose-600 dark:text-rose-400">
              {overallStats.belowTargetCount}
            </p>
          </div>
        </div>

        {/* Subject Compliance Table */}
        <div>
          <h3 className="mb-3 text-base font-extrabold text-slate-900 dark:text-white">
            Subject Compliance Breakdown
          </h3>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Attended / Conducted</th>
                  <th className="px-4 py-3">Current %</th>
                  <th className="px-4 py-3">Min / Goal</th>
                  <th className="px-4 py-3">Action / Buffer</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subjects.map((sub) => {
                  const analysis = analyzeSubject(sub);
                  return (
                    <tr key={sub.id}>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {sub.name}
                        {sub.code && (
                          <span className="ml-2 font-mono text-xs font-normal text-slate-500">
                            {sub.code}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                        {sub.attended}/{sub.conducted}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {analysis.currentPercentage}%
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {sub.min_required_percentage}% / {sub.target_percentage}%
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-600 dark:text-slate-300">
                        {analysis.maxSkippableMin > 0
                          ? `Skip ${analysis.maxSkippableMin}`
                          : analysis.requiredForMin.isImpossible
                          ? 'Impossible'
                          : analysis.requiredForMin.required === 0
                          ? 'On border'
                          : `Attend ${analysis.requiredForMin.required}`}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={analysis.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Medical Leave Summary */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
            <Stethoscope className="h-5 w-5" />
            <h3 className="text-base font-extrabold">Medical Leave Summary</h3>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold text-slate-500">Total Certificates</p>
              <p className="font-mono text-lg font-extrabold text-slate-900 dark:text-white">
                {medicalLeaves.length} ({pendingLeavesCount} pending)
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Current Overall %
              </p>
              <p className="font-mono text-lg font-extrabold text-slate-900 dark:text-white">
                {overallStats.overallPercentage}%
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Projected Post-Medical %
              </p>
              <p className="font-mono text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                {pendingMedical.afterPercentage}% ({pendingMedical.deltaPercentage >= 0 ? '+' : ''}
                {pendingMedical.deltaPercentage}%)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
