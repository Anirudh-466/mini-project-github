import React, { useState } from 'react';
import {
  CheckCircle2,
  Cloud,
  HardDrive,
  Monitor,
  Moon,
  RotateCcw,
  Save,
  Settings,
  Sun,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { ThemePreference, useTheme } from '../context/ThemeContext';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, isCloudMode } = useAuth();
  const { resetSampleData, clearAllData } = useAttendance();
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [collegeName, setCollegeName] = useState(user?.college_name || '');
  const [defaultMin, setDefaultMin] = useState(
    String(user?.default_min_attendance || 75)
  );
  const [savedMsg, setSavedMsg] = useState('');
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const minVal = Math.min(100, Math.max(1, Number(defaultMin) || 75));
    const res = await updateProfile({
      display_name: displayName.trim() || 'Student',
      college_name: collegeName.trim() || undefined,
      default_min_attendance: minVal,
      preferred_theme: theme,
    });
    if (res.success) {
      setSavedMsg('Profile & preferences saved!');
      setTimeout(() => setSavedMsg(''), 2500);
    }
  };

  const themeChoices: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
    { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <Settings className="h-6 w-6 text-brand-600 dark:text-brand-400" />
          Account & Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Customize your profile, theme, cloud sync, and sample data.
        </p>
      </div>

      {/* Profile Settings */}
      <form
        onSubmit={handleSaveProfile}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
          Student Profile
        </h2>

        {savedMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            {savedMsg}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              College / University
            </label>
            <input
              type="text"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div className="max-w-xs">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Default Minimum Attendance (%)
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={defaultMin}
            onChange={(e) => setDefaultMin(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-700"
        >
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </form>

      {/* Theme Preferences */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
          Appearance Theme
        </h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {themeChoices.map((choice) => (
            <button
              key={choice.value}
              type="button"
              onClick={() => setTheme(choice.value)}
              className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold transition ${
                theme === choice.value
                  ? 'border-brand-600 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-950/40 dark:text-brand-300'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {choice.icon}
              {choice.label}
            </button>
          ))}
        </div>
      </div>

      {/* Supabase Cloud Sync Guide */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Storage & Supabase Cloud Sync
          </h2>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              isCloudMode
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
            }`}
          >
            {isCloudMode ? (
              <>
                <Cloud className="h-3.5 w-3.5" /> Cloud Connected
              </>
            ) : (
              <>
                <HardDrive className="h-3.5 w-3.5" /> Local Mode Active
              </>
            )}
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          {isCloudMode
            ? 'Your Supabase project is configured and active. Subjects, attendance records, and medical leaves sync to your account.'
            : 'Running in fast offline-capable localStorage mode. To enable multi-device cloud sync, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file with tables: subjects, attendance_records, and medical_leaves.'}
        </p>
      </div>

      {/* Data Management */}
      <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm dark:border-rose-900/50 dark:bg-slate-900">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
          Data Management
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Restore sample semester data or clear everything to start from scratch.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-xs font-bold text-brand-700 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300"
          >
            <RotateCcw className="h-4 w-4" />
            Restore Sample Subjects
          </button>
          <button
            type="button"
            onClick={() => setConfirmClearOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
          >
            <Trash2 className="h-4 w-4" />
            Clear All Data
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        title="Restore Sample Subjects"
        message="This will replace your current subjects, records, and medical leaves with the 4 sample college subjects. Continue?"
        confirmLabel="Restore Sample Data"
        onConfirm={resetSampleData}
      />

      <ConfirmDialog
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        destructive
        title="Clear All Attendance Data"
        message="This will permanently erase all your subjects, attendance logs, and medical leaves. Are you sure?"
        confirmLabel="Yes, Clear Everything"
        onConfirm={clearAllData}
      />
    </div>
  );
};
