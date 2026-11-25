import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Calculator,
  CheckCircle2,
  GraduationCap,
  LayoutDashboard,
  Palette,
  Sparkles,
  Stethoscope,
  Target,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    title: 'Smart Attendance Tracking',
    description:
      'One-tap +1 Present / +1 Absent counters plus full date-wise class logging with medical and cancelled states.',
    icon: CheckCircle2,
    color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400',
  },
  {
    title: 'The Bunk Calculator',
    description:
      'Know the exact number of classes you can safely skip or must attend consecutively using zero-error epsilon math.',
    icon: Calculator,
    color: 'text-brand-600 bg-brand-100 dark:bg-brand-950/60 dark:text-brand-400',
  },
  {
    title: 'Attendance Goal Planner',
    description:
      'Set institutional minimums (like 75%) alongside personal goals (80%+) and simulate future what-if scenarios.',
    icon: Target,
    color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400',
  },
  {
    title: 'Subject-Wise Analytics',
    description:
      'Compare every course side-by-side with interactive charts, next-class impact deltas, and printable reports.',
    icon: BarChart3,
    color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400',
  },
  {
    title: 'Personalized Dashboard',
    description:
      'Your morning "Aau ya Nahi?" verdict card tells you instantly whether you can take a break or must attend.',
    icon: LayoutDashboard,
    color: 'text-violet-600 bg-violet-100 dark:bg-violet-950/60 dark:text-violet-400',
  },
  {
    title: 'Medical Leave Predictor',
    description:
      'Preview exactly how a medical certificate boosts or protects your attendance before submitting it to your college.',
    icon: Stethoscope,
    color: 'text-rose-600 bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400',
  },
  {
    title: 'Dark & Light Themes',
    description:
      'Switch effortlessly between crisp daylight, midnight dark mode, or automatic system theme sync.',
    icon: Palette,
    color: 'text-teal-600 bg-teal-100 dark:bg-teal-950/60 dark:text-teal-400',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Add Your Semester Subjects',
    desc: 'Start with sample college courses or enter your exact attended/conducted counts and 75% requirement.',
  },
  {
    step: '02',
    title: 'Check "Aau ya Nahi?" Daily',
    desc: 'Get an instant skip-or-attend verdict for every lecture plus live what-if predictions.',
  },
  {
    step: '03',
    title: 'Predict Medical & Export Reports',
    desc: 'Simulate medical leave recovery, log every class, and export clean CSV or printable reports.',
  },
];

export const LandingPage: React.FC = () => {
  const { user, loginAsDemoStudent } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (!user) {
      loginAsDemoStudent();
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:pt-16">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-bold text-brand-700 dark:border-brand-800/70 dark:bg-brand-950/50 dark:text-brand-300">
              <Sparkles className="h-3.5 w-3.5" />
              Your Attendance. Your Choice. Your Call.
            </div>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
              Your Attendance.{' '}
              <span className="bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent">
                Your Rules.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
              Stop guessing at 74.8%.{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                Aau ya Nahi!
              </span>{' '}
              calculates safe bunks, required recovery streaks, and medical leave
              boosts with mathematical precision.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={handleGetStarted}
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition hover:-translate-y-0.5 hover:bg-brand-700"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Explore Features
              </a>
            </div>
          </div>

          {/* Live Dashboard Preview Mockup */}
          <div className="relative animate-fade-in">
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-brand-500/20 via-accent-500/15 to-transparent blur-2xl" />
            <div className="relative rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Live Student Snapshot
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Overall Weighted Attendance
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 font-mono text-xs font-extrabold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  79.73% Safe
                </span>
              </div>

              <div className="mt-5 space-y-3.5">
                {[
                  {
                    name: 'Computer Networks',
                    ratio: '21/24',
                    pct: 87.5,
                    verdict: '4 safe bunks',
                    color: 'bg-emerald-500',
                    badge: 'text-emerald-600 dark:text-emerald-400',
                  },
                  {
                    name: 'Database Management Systems',
                    ratio: '16/20',
                    pct: 80,
                    verdict: '1 safe bunk',
                    color: 'bg-indigo-500',
                    badge: 'text-indigo-600 dark:text-indigo-400',
                  },
                  {
                    name: 'Machine Learning',
                    ratio: '12/20',
                    pct: 60,
                    verdict: 'Attend next 12 (or apply Medical +20%)',
                    color: 'bg-rose-500',
                    badge: 'text-rose-600 dark:text-rose-400',
                  },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {item.name}
                      </span>
                      <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                        {item.ratio} ({item.pct}%)
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                    <p className={`mt-1.5 text-[11px] font-semibold ${item.badge}`}>
                      {item.verdict}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section
        id="features"
        className="mx-auto max-w-7xl px-4 py-14 sm:px-6"
      >
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Built For Real Campus Life
          </span>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
            Everything you need to stay eligible
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${feat.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-extrabold text-slate-900 dark:text-white">
                  {feat.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3-Step Guide */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-center text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
            From Morning Dilemma to Total Clarity in 3 Steps
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.step}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 p-6 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <span className="font-mono text-2xl font-extrabold text-brand-600 dark:text-brand-400">
                  {s.step}
                </span>
                <h3 className="mt-3 text-base font-extrabold text-slate-900 dark:text-white">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-gradient-to-r from-brand-600 to-accent-600 p-8 text-white shadow-xl sm:flex-row sm:p-10">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              Ready to answer &ldquo;Aau ya Nahi?&rdquo;
            </h2>
            <p className="mt-2 text-sm text-white/90 sm:text-base">
              Jump straight into your pre-loaded demo semester or customize your own
              courses in seconds.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <button
              type="button"
              onClick={handleGetStarted}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-brand-700 shadow-md transition hover:bg-slate-100"
            >
              Open Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              to="/calculator"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-5 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              Try Calculator
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 py-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          Aau ya Nahi! — Smart Student Attendance Manager
        </p>
        <p className="mt-1">Your Attendance. Your Choice. Your Call.</p>
      </footer>
    </div>
  );
};
