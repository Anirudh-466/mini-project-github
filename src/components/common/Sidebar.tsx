import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  Calculator,
  FileBarChart2,
  History,
  LayoutDashboard,
  Lightbulb,
  Settings,
  Stethoscope,
  X,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { subjects, medicalLeaves } = useAttendance();
  const pendingMedicalCount = medicalLeaves.filter((m) => !m.applied_to_records).length;

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/subjects',
      label: 'My Subjects',
      icon: BookOpen,
      badge: subjects.length > 0 ? String(subjects.length) : undefined,
      badgeClass:
        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    {
      to: '/calculator',
      label: 'Bunk Calculator',
      icon: Calculator,
      badge: 'Main',
      badgeClass:
        'bg-brand-100 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300',
    },
    {
      to: '/medical',
      label: 'Medical Leave',
      icon: Stethoscope,
      badge: pendingMedicalCount > 0 ? String(pendingMedicalCount) : 'New',
      badgeClass:
        pendingMedicalCount > 0
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
          : 'bg-accent-100 text-accent-700 dark:bg-accent-950/70 dark:text-accent-300',
    },
    {
      to: '/history',
      label: 'Attendance History',
      icon: History,
    },
    {
      to: '/reports',
      label: 'Reports & Export',
      icon: FileBarChart2,
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const renderNavLinks = () => (
    <div className="flex h-full flex-col justify-between p-4">
      <div>
        <div className="mb-3 flex items-center justify-between px-2 lg:hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </span>
                    {item.badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badgeClass
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Pro Tip Companion Card */}
      <div className="mt-6 rounded-2xl border border-brand-200/70 bg-gradient-to-br from-brand-50 to-accent-50/70 p-4 dark:border-brand-900/50 dark:from-brand-950/50 dark:to-slate-900">
        <div className="mb-2 flex items-center gap-2 text-brand-700 dark:text-brand-300">
          <Lightbulb className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Pro Tip</span>
        </div>
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          Check the <span className="font-semibold">Bunk Calculator</span> before
          skipping a morning lecture, or preview medical certificates in{' '}
          <span className="font-semibold">Medical Leave</span> before submitting!
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside className="relative z-10 h-full w-72 border-r border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {renderNavLinks()}
          </aside>
        </div>
      )}

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200/80 bg-white/70 backdrop-blur-sm lg:block dark:border-slate-800/80 dark:bg-slate-900/60">
        <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          {renderNavLinks()}
        </div>
      </aside>
    </>
  );
};
