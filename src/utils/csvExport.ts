import { AttendanceRecord, MedicalLeave, Subject, UserProfile } from '../types/attendance';
import { analyzeSubject, calculateOverallStats } from './calculator';

function escapeCsvCell(value: unknown): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(cells: unknown[]): string {
  return cells.map(escapeCsvCell).join(',');
}

export function exportAttendanceCSV(
  user: UserProfile | null,
  subjects: Subject[],
  records: AttendanceRecord[],
  medicalLeaves: MedicalLeave[]
): void {
  const lines: string[] = [];
  const overall = calculateOverallStats(subjects);
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  lines.push(toCsvRow(['Aau ya Nahi! — Attendance Report']));
  lines.push(toCsvRow(['Student', user?.display_name || 'Student']));
  lines.push(toCsvRow(['College', user?.college_name || 'N/A']));
  lines.push(toCsvRow(['Generated On', new Date().toLocaleString()]));
  lines.push(
    toCsvRow([
      'Overall Attendance %',
      `${overall.overallPercentage}%`,
      'Attended',
      overall.totalAttended,
      'Conducted',
      overall.totalConducted,
    ])
  );
  lines.push('');

  lines.push(toCsvRow(['SUBJECTS SUMMARY']));
  lines.push(
    toCsvRow([
      'Subject Name',
      'Code',
      'Faculty',
      'Attended',
      'Conducted',
      'Missed',
      'Current %',
      'Min Required %',
      'Target %',
      'Status',
      'Safe Skips (Min)',
      'Classes Needed (Min)',
    ])
  );

  for (const s of subjects) {
    const analysis = analyzeSubject(s);
    lines.push(
      toCsvRow([
        s.name,
        s.code || '',
        s.faculty || '',
        s.attended,
        s.conducted,
        analysis.missed,
        `${analysis.currentPercentage}%`,
        `${s.min_required_percentage}%`,
        `${s.target_percentage}%`,
        analysis.status,
        analysis.maxSkippableMin,
        analysis.requiredForMin.isImpossible
          ? 'Impossible'
          : analysis.requiredForMin.required,
      ])
    );
  }

  lines.push('');
  lines.push(toCsvRow(['DETAILED ATTENDANCE LOG']));
  lines.push(toCsvRow(['Date', 'Subject', 'Code', 'Status', 'Notes']));

  const sortedRecords = [...records].sort((a, b) => b.date.localeCompare(a.date));
  for (const r of sortedRecords) {
    const sub = subjectMap.get(r.subject_id);
    lines.push(
      toCsvRow([
        r.date,
        sub?.name || 'Unknown Subject',
        sub?.code || '',
        r.status,
        r.notes || '',
      ])
    );
  }

  lines.push('');
  lines.push(toCsvRow(['MEDICAL LEAVES']));
  lines.push(
    toCsvRow([
      'Title',
      'Start Date',
      'End Date',
      'Days',
      'Timing',
      'Policy Mode',
      'Status',
      'Applied to Attendance',
      'Affected Subjects',
      'Notes',
    ])
  );

  for (const m of medicalLeaves) {
    const affected = Object.entries(m.subject_classes)
      .filter(([, count]) => count > 0)
      .map(([subId, count]) => `${subjectMap.get(subId)?.name || subId}: ${count}`)
      .join('; ');
    lines.push(
      toCsvRow([
        m.title,
        m.start_date,
        m.end_date,
        m.days_count,
        m.already_marked_absent ? 'Already Marked Absent' : 'Upcoming / Unlogged',
        m.policy_mode === 'credit_present' ? 'Count as Present' : 'Exclude from Total',
        m.status,
        m.applied_to_records ? 'Yes' : 'No',
        affected,
        m.notes || '',
      ])
    );
  }

  const csvContent = lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.setAttribute('download', `aau-ya-nahi-attendance-${dateStamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
