import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Subject } from '../../types/attendance';
import { calculateAttendancePercentage } from '../../utils/calculator';
import { useTheme } from '../../context/ThemeContext';

interface AttendanceChartProps {
  subjects: Subject[];
  minRequiredLine: number;
}

export const AttendanceChart: React.FC<AttendanceChartProps> = ({
  subjects,
  minRequiredLine,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const data = subjects.map((s) => ({
    name: s.code || (s.name.length > 14 ? `${s.name.slice(0, 12)}…` : s.name),
    fullName: s.name,
    current: calculateAttendancePercentage(s.attended, s.conducted),
    target: s.target_percentage,
  }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Subject Attendance Overview
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Current % vs. Personal Target % (dashed line at {minRequiredLine}% min)
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? '#1e293b' : '#e2e8f0'}
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              unit="%"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                borderColor: isDark ? '#334155' : '#e2e8f0',
                borderRadius: '12px',
                fontSize: '12px',
                color: isDark ? '#f8fafc' : '#0f172a',
              }}
              formatter={(value: number, name: string) => [
                `${value}%`,
                name === 'current' ? 'Current %' : 'Target %',
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => (value === 'current' ? 'Current %' : 'Target %')}
            />
            <ReferenceLine
              y={minRequiredLine}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <Bar
              dataKey="current"
              fill="#4f46e5"
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
            />
            <Bar
              dataKey="target"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
