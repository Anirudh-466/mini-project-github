import {
  AttendanceRecord,
  MedicalLeave,
  MedicalLeaveStatus,
  MedicalPolicyMode,
  RecordStatus,
  Subject,
  UserProfile,
} from '../types/attendance';

export const STORAGE_KEYS = {
  CURRENT_USER: 'aau_current_user',
  USERS_DB: 'aau_users_db',
  LOGGED_OUT: 'aau_logged_out',
  THEME: 'aau_theme_preference',
  SUBJECTS: (userId: string) => `aau_subjects_${userId}`,
  RECORDS: (userId: string) => `aau_records_${userId}`,
  MEDICAL_LEAVES: (userId: string) => `aau_medical_leaves_${userId}`,
  SEEDED: (userId: string) => `aau_seeded_${userId}`,
};

export const DEMO_USER_ID = 'demo-student-aman';

export function generateId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getOffsetDateISO(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function hashEmailToId(email: string): string {
  const normalized = email.trim().toLowerCase();
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= code + i * 31;
    h2 = Math.imul(h2, 0x01000193);
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `local-${part1}${part2}`;
}

export function createDemoUserProfile(): UserProfile {
  return {
    id: DEMO_USER_ID,
    email: 'student@college.edu',
    display_name: 'Aman Sharma',
    college_name: 'National Institute of Technology',
    default_min_attendance: 75,
    preferred_theme: 'system',
    created_at: new Date().toISOString(),
  };
}

export function sanitizeUserProfile(raw: unknown): UserProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.id !== 'string' || !obj.id.trim()) return null;
  if (typeof obj.email !== 'string' || !obj.email.trim()) return null;

  const minAtt = Number(obj.default_min_attendance);
  const safeMin =
    Number.isFinite(minAtt) && minAtt >= 1 && minAtt <= 100 ? Math.round(minAtt) : 75;

  const theme =
    obj.preferred_theme === 'light' ||
    obj.preferred_theme === 'dark' ||
    obj.preferred_theme === 'system'
      ? obj.preferred_theme
      : 'system';

  return {
    id: obj.id,
    email: obj.email,
    display_name:
      typeof obj.display_name === 'string' && obj.display_name.trim()
        ? obj.display_name.trim()
        : obj.email.split('@')[0] || 'Student',
    college_name:
      typeof obj.college_name === 'string' && obj.college_name.trim()
        ? obj.college_name.trim()
        : undefined,
    default_min_attendance: safeMin,
    preferred_theme: theme,
    created_at:
      typeof obj.created_at === 'string' && obj.created_at
        ? obj.created_at
        : new Date().toISOString(),
  };
}

export function sanitizeSubject(raw: unknown, fallbackUserId: string): Subject | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.id !== 'string' || !obj.id.trim()) return null;
  if (typeof obj.name !== 'string' || !obj.name.trim()) return null;

  const rawConducted = Number(obj.conducted);
  const conducted = Number.isFinite(rawConducted)
    ? Math.max(0, Math.floor(rawConducted))
    : 0;

  const rawAttended = Number(obj.attended);
  const attended = Number.isFinite(rawAttended)
    ? Math.min(conducted, Math.max(0, Math.floor(rawAttended)))
    : 0;

  const rawMin = Number(obj.min_required_percentage);
  const minReq =
    Number.isFinite(rawMin) && rawMin >= 1 && rawMin <= 100 ? Number(rawMin) : 75;

  const rawTarget = Number(obj.target_percentage);
  const target =
    Number.isFinite(rawTarget) && rawTarget >= 1 && rawTarget <= 100
      ? Math.max(minReq, Number(rawTarget))
      : Math.max(minReq, 80);

  return {
    id: obj.id,
    user_id:
      typeof obj.user_id === 'string' && obj.user_id.trim()
        ? obj.user_id
        : fallbackUserId,
    name: obj.name.trim(),
    code: typeof obj.code === 'string' && obj.code.trim() ? obj.code.trim() : undefined,
    faculty:
      typeof obj.faculty === 'string' && obj.faculty.trim()
        ? obj.faculty.trim()
        : undefined,
    conducted,
    attended,
    min_required_percentage: minReq,
    target_percentage: target,
    created_at:
      typeof obj.created_at === 'string' && obj.created_at
        ? obj.created_at
        : new Date().toISOString(),
    updated_at: typeof obj.updated_at === 'string' ? obj.updated_at : undefined,
  };
}

function sanitizeRecord(raw: unknown, fallbackUserId: string): AttendanceRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.id !== 'string' || typeof obj.subject_id !== 'string') return null;
  const validStatuses: RecordStatus[] = ['present', 'absent', 'medical', 'cancelled'];
  const status = validStatuses.includes(obj.status as RecordStatus)
    ? (obj.status as RecordStatus)
    : 'present';
  return {
    id: obj.id,
    user_id:
      typeof obj.user_id === 'string' && obj.user_id ? obj.user_id : fallbackUserId,
    subject_id: obj.subject_id,
    date: typeof obj.date === 'string' && obj.date ? obj.date : getTodayISO(),
    status,
    notes: typeof obj.notes === 'string' && obj.notes ? obj.notes : undefined,
    created_at:
      typeof obj.created_at === 'string' && obj.created_at
        ? obj.created_at
        : new Date().toISOString(),
    updated_at: typeof obj.updated_at === 'string' ? obj.updated_at : undefined,
  };
}

function sanitizeMedicalLeave(raw: unknown, fallbackUserId: string): MedicalLeave | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.id !== 'string' || typeof obj.title !== 'string') return null;

  const policyMode: MedicalPolicyMode =
    obj.policy_mode === 'exclude_conducted' ? 'exclude_conducted' : 'credit_present';
  const validStatuses: MedicalLeaveStatus[] = ['planned', 'applied', 'approved'];
  const status = validStatuses.includes(obj.status as MedicalLeaveStatus)
    ? (obj.status as MedicalLeaveStatus)
    : 'planned';

  const rawMap =
    obj.subject_classes && typeof obj.subject_classes === 'object'
      ? (obj.subject_classes as Record<string, unknown>)
      : {};
  const subject_classes: Record<string, number> = {};
  for (const [k, v] of Object.entries(rawMap)) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) {
      subject_classes[k] = Math.floor(n);
    }
  }

  const days = Number(obj.days_count);
  return {
    id: obj.id,
    user_id:
      typeof obj.user_id === 'string' && obj.user_id ? obj.user_id : fallbackUserId,
    title: obj.title.trim() || 'Medical Leave',
    start_date:
      typeof obj.start_date === 'string' && obj.start_date
        ? obj.start_date
        : getTodayISO(),
    end_date:
      typeof obj.end_date === 'string' && obj.end_date ? obj.end_date : getTodayISO(),
    days_count: Number.isFinite(days) && days >= 1 ? Math.floor(days) : 1,
    subject_classes,
    already_marked_absent: Boolean(obj.already_marked_absent),
    policy_mode: policyMode,
    status,
    applied_to_records: Boolean(obj.applied_to_records),
    notes: typeof obj.notes === 'string' && obj.notes ? obj.notes : undefined,
    created_at:
      typeof obj.created_at === 'string' && obj.created_at
        ? obj.created_at
        : new Date().toISOString(),
    updated_at: typeof obj.updated_at === 'string' ? obj.updated_at : undefined,
  };
}

export function createSeedData(userId: string): {
  subjects: Subject[];
  records: AttendanceRecord[];
  medicalLeaves: MedicalLeave[];
} {
  const now = new Date().toISOString();
  const cnId = `sub-cn-${userId}`;
  const dbmsId = `sub-dbms-${userId}`;
  const mlId = `sub-ml-${userId}`;
  const osId = `sub-os-${userId}`;

  const subjects: Subject[] = [
    {
      id: cnId,
      user_id: userId,
      name: 'Computer Networks',
      code: 'CS301',
      faculty: 'Dr. R. Verma',
      conducted: 24,
      attended: 21,
      min_required_percentage: 75,
      target_percentage: 80,
      created_at: now,
    },
    {
      id: dbmsId,
      user_id: userId,
      name: 'Database Management Systems',
      code: 'CS302',
      faculty: 'Prof. S. Iyer',
      conducted: 20,
      attended: 16,
      min_required_percentage: 75,
      target_percentage: 80,
      created_at: now,
    },
    {
      id: mlId,
      user_id: userId,
      name: 'Machine Learning',
      code: 'CS401',
      faculty: 'Dr. A. Kapoor',
      conducted: 20,
      attended: 12,
      min_required_percentage: 75,
      target_percentage: 80,
      created_at: now,
    },
    {
      id: osId,
      user_id: userId,
      name: 'Operating Systems Lab',
      code: 'CS304L',
      faculty: 'Prof. M. Nair',
      conducted: 10,
      attended: 10,
      min_required_percentage: 75,
      target_percentage: 85,
      created_at: now,
    },
  ];

  const records: AttendanceRecord[] = [
    {
      id: `rec-1-${userId}`,
      user_id: userId,
      subject_id: cnId,
      date: getOffsetDateISO(-1),
      status: 'present',
      notes: 'TCP congestion control lecture',
      created_at: now,
    },
    {
      id: `rec-2-${userId}`,
      user_id: userId,
      subject_id: dbmsId,
      date: getOffsetDateISO(-2),
      status: 'present',
      notes: 'B+ Tree indexing tutorial',
      created_at: now,
    },
    {
      id: `rec-3-${userId}`,
      user_id: userId,
      subject_id: mlId,
      date: getOffsetDateISO(-3),
      status: 'absent',
      notes: 'Missed due to viral fever',
      created_at: now,
    },
    {
      id: `rec-4-${userId}`,
      user_id: userId,
      subject_id: osId,
      date: getOffsetDateISO(-4),
      status: 'present',
      notes: 'CPU scheduling lab evaluation',
      created_at: now,
    },
  ];

  const medicalLeaves: MedicalLeave[] = [
    {
      id: `med-1-${userId}`,
      user_id: userId,
      title: 'Viral Fever Medical Certificate',
      start_date: getOffsetDateISO(-5),
      end_date: getOffsetDateISO(-3),
      days_count: 3,
      subject_classes: {
        [mlId]: 4,
        [dbmsId]: 1,
      },
      already_marked_absent: true,
      policy_mode: 'credit_present',
      status: 'planned',
      applied_to_records: false,
      notes: 'Doctor prescription & OPD slip ready to submit to Dean office.',
      created_at: now,
    },
  ];

  return { subjects, records, medicalLeaves };
}

export function loadLocalAttendanceData(userId: string): {
  subjects: Subject[];
  records: AttendanceRecord[];
  medicalLeaves: MedicalLeave[];
} {
  try {
    const alreadySeeded = localStorage.getItem(STORAGE_KEYS.SEEDED(userId));
    const rawSubjects = localStorage.getItem(STORAGE_KEYS.SUBJECTS(userId));
    const rawRecords = localStorage.getItem(STORAGE_KEYS.RECORDS(userId));
    const rawMedical = localStorage.getItem(STORAGE_KEYS.MEDICAL_LEAVES(userId));

    if (!alreadySeeded && !rawSubjects && !rawRecords && !rawMedical) {
      const seed = createSeedData(userId);
      saveLocalAttendanceData(userId, seed.subjects, seed.records, seed.medicalLeaves);
      localStorage.setItem(STORAGE_KEYS.SEEDED(userId), '1');
      return seed;
    }

    const parsedSubjects = rawSubjects ? JSON.parse(rawSubjects) : [];
    const parsedRecords = rawRecords ? JSON.parse(rawRecords) : [];
    const parsedMedical = rawMedical ? JSON.parse(rawMedical) : [];

    const subjects = Array.isArray(parsedSubjects)
      ? parsedSubjects
          .map((item) => sanitizeSubject(item, userId))
          .filter((s): s is Subject => s !== null)
      : [];

    const records = Array.isArray(parsedRecords)
      ? parsedRecords
          .map((item) => sanitizeRecord(item, userId))
          .filter((r): r is AttendanceRecord => r !== null)
      : [];

    const medicalLeaves = Array.isArray(parsedMedical)
      ? parsedMedical
          .map((item) => sanitizeMedicalLeave(item, userId))
          .filter((m): m is MedicalLeave => m !== null)
      : [];

    return { subjects, records, medicalLeaves };
  } catch {
    return { subjects: [], records: [], medicalLeaves: [] };
  }
}

export function saveLocalAttendanceData(
  userId: string,
  subjects: Subject[],
  records: AttendanceRecord[],
  medicalLeaves: MedicalLeave[]
): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS(userId), JSON.stringify(subjects));
    localStorage.setItem(STORAGE_KEYS.RECORDS(userId), JSON.stringify(records));
    localStorage.setItem(
      STORAGE_KEYS.MEDICAL_LEAVES(userId),
      JSON.stringify(medicalLeaves)
    );
    localStorage.setItem(STORAGE_KEYS.SEEDED(userId), '1');
  } catch {
    // Ignore quota errors gracefully
  }
}
