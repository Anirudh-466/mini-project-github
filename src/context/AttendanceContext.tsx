import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  AttendanceRecord,
  MedicalLeave,
  MedicalLeaveStatus,
  MedicalPolicyMode,
  RecordStatus,
  Subject,
} from '../types/attendance';
import {
  calculateMedicalSubjectImpact,
  calculateOverallStats,
  OverallStats,
} from '../utils/calculator';
import {
  createSeedData,
  generateId,
  getTodayISO,
  loadLocalAttendanceData,
  saveLocalAttendanceData,
} from '../utils/storage';
import { useAuth } from './AuthContext';

export interface SubjectInput {
  name: string;
  code?: string;
  faculty?: string;
  conducted: number;
  attended: number;
  min_required_percentage: number;
  target_percentage: number;
}

export interface MedicalLeaveInput {
  title: string;
  start_date: string;
  end_date: string;
  days_count: number;
  subject_classes: Record<string, number>;
  already_marked_absent: boolean;
  policy_mode: MedicalPolicyMode;
  status?: MedicalLeaveStatus;
  notes?: string;
}

interface AttendanceContextValue {
  subjects: Subject[];
  records: AttendanceRecord[];
  medicalLeaves: MedicalLeave[];
  overallStats: OverallStats;
  loading: boolean;
  addSubject: (input: SubjectInput) => Promise<Subject | null>;
  updateSubject: (id: string, updates: Partial<SubjectInput>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  markAttendance: (
    subjectId: string,
    status: RecordStatus,
    date?: string,
    notes?: string
  ) => Promise<void>;
  quickIncrementAttendance: (
    subjectId: string,
    status: 'present' | 'absent'
  ) => Promise<void>;
  updateRecord: (
    recordId: string,
    updates: { status: RecordStatus; date: string; notes?: string }
  ) => Promise<void>;
  deleteRecord: (recordId: string) => Promise<void>;
  addMedicalLeave: (
    input: MedicalLeaveInput,
    applyImmediately?: boolean
  ) => Promise<MedicalLeave | null>;
  updateMedicalLeave: (
    id: string,
    updates: Partial<MedicalLeave>
  ) => Promise<void>;
  deleteMedicalLeave: (id: string) => Promise<void>;
  applyMedicalLeaveToAttendance: (id: string) => Promise<void>;
  resetSampleData: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextValue | undefined>(undefined);

function getStatusDelta(status: RecordStatus): { attended: number; conducted: number } {
  switch (status) {
    case 'present':
    case 'medical':
      return { attended: 1, conducted: 1 };
    case 'absent':
      return { attended: 0, conducted: 1 };
    case 'cancelled':
      return { attended: 0, conducted: 0 };
  }
}

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [medicalLeaves, setMedicalLeaves] = useState<MedicalLeave[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadData() {
      if (!user) {
        if (active) {
          setSubjects([]);
          setRecords([]);
          setMedicalLeaves([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      if (isSupabaseConfigured) {
        try {
          const [subRes, recRes, medRes] = await Promise.all([
            supabase
              .from('subjects')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: true }),
            supabase
              .from('attendance_records')
              .select('*')
              .eq('user_id', user.id)
              .order('date', { ascending: false }),
            supabase
              .from('medical_leaves')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false }),
          ]);

          if (!subRes.error && !recRes.error && active) {
            setSubjects((subRes.data as Subject[]) || []);
            setRecords((recRes.data as AttendanceRecord[]) || []);
            setMedicalLeaves((medRes.data as MedicalLeave[]) || []);
            setLoading(false);
            return;
          }
        } catch {
          // Fall back to local storage if Supabase tables aren't available
        }
      }

      const local = loadLocalAttendanceData(user.id);
      if (active) {
        setSubjects(local.subjects);
        setRecords(local.records);
        setMedicalLeaves(local.medicalLeaves);
        setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [user?.id]);

  // Persist to localStorage whenever state updates for active user
  useEffect(() => {
    if (!user || loading) return;
    saveLocalAttendanceData(user.id, subjects, records, medicalLeaves);
  }, [user, loading, subjects, records, medicalLeaves]);

  const overallStats = useMemo(() => calculateOverallStats(subjects), [subjects]);

  const syncSubjectCountersToCloud = async (subject: Subject) => {
    if (!isSupabaseConfigured) return;
    try {
      await supabase
        .from('subjects')
        .update({
          attended: subject.attended,
          conducted: subject.conducted,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subject.id);
    } catch {
      // Ignore network failure in offline/demo fallback
    }
  };

  const addSubject = async (input: SubjectInput): Promise<Subject | null> => {
    if (!user) return null;
    const now = new Date().toISOString();
    const conducted = Math.max(0, Math.floor(input.conducted));
    const attended = Math.min(conducted, Math.max(0, Math.floor(input.attended)));

    const newSubject: Subject = {
      id: generateId('sub'),
      user_id: user.id,
      name: input.name.trim(),
      code: input.code?.trim() || undefined,
      faculty: input.faculty?.trim() || undefined,
      conducted,
      attended,
      min_required_percentage: input.min_required_percentage,
      target_percentage: input.target_percentage,
      created_at: now,
    };

    setSubjects((prev) => [...prev, newSubject]);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('subjects').insert(newSubject);
      } catch {
        // Ignore
      }
    }

    return newSubject;
  };

  const updateSubject = async (
    id: string,
    updates: Partial<SubjectInput>
  ): Promise<void> => {
    const now = new Date().toISOString();
    let updatedItem: Subject | undefined;

    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const nextConducted =
          updates.conducted !== undefined
            ? Math.max(0, Math.floor(updates.conducted))
            : s.conducted;
        const nextAttended =
          updates.attended !== undefined
            ? Math.min(nextConducted, Math.max(0, Math.floor(updates.attended)))
            : Math.min(nextConducted, s.attended);

        updatedItem = {
          ...s,
          ...updates,
          name: updates.name !== undefined ? updates.name.trim() : s.name,
          code: updates.code !== undefined ? updates.code.trim() || undefined : s.code,
          faculty:
            updates.faculty !== undefined
              ? updates.faculty.trim() || undefined
              : s.faculty,
          conducted: nextConducted,
          attended: nextAttended,
          updated_at: now,
        };
        return updatedItem;
      })
    );

    if (isSupabaseConfigured && updatedItem) {
      try {
        await supabase.from('subjects').update(updatedItem).eq('id', id);
      } catch {
        // Ignore
      }
    }
  };

  const deleteSubject = async (id: string): Promise<void> => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    setRecords((prev) => prev.filter((r) => r.subject_id !== id));
    setMedicalLeaves((prev) =>
      prev.map((m) => {
        if (!(id in m.subject_classes)) return m;
        const nextClasses = { ...m.subject_classes };
        delete nextClasses[id];
        return { ...m, subject_classes: nextClasses };
      })
    );

    if (isSupabaseConfigured) {
      try {
        await supabase.from('attendance_records').delete().eq('subject_id', id);
        await supabase.from('subjects').delete().eq('id', id);
      } catch {
        // Ignore
      }
    }
  };

  const markAttendance = async (
    subjectId: string,
    status: RecordStatus,
    date = getTodayISO(),
    notes?: string
  ): Promise<void> => {
    if (!user) return;
    const now = new Date().toISOString();
    const delta = getStatusDelta(status);

    const newRecord: AttendanceRecord = {
      id: generateId('rec'),
      user_id: user.id,
      subject_id: subjectId,
      date,
      status,
      notes: notes?.trim() || undefined,
      created_at: now,
    };

    let updatedSubject: Subject | undefined;

    setRecords((prev) => [newRecord, ...prev]);
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== subjectId) return s;
        updatedSubject = {
          ...s,
          attended: Math.max(0, s.attended + delta.attended),
          conducted: Math.max(0, s.conducted + delta.conducted),
          updated_at: now,
        };
        return updatedSubject;
      })
    );

    if (isSupabaseConfigured) {
      try {
        await supabase.from('attendance_records').insert(newRecord);
        if (updatedSubject) await syncSubjectCountersToCloud(updatedSubject);
      } catch {
        // Ignore
      }
    }
  };

  const quickIncrementAttendance = async (
    subjectId: string,
    status: 'present' | 'absent'
  ): Promise<void> => {
    await markAttendance(subjectId, status, getTodayISO(), 'Quick marked');
  };

  const updateRecord = async (
    recordId: string,
    updates: { status: RecordStatus; date: string; notes?: string }
  ): Promise<void> => {
    const existing = records.find((r) => r.id === recordId);
    if (!existing) return;

    const oldDelta = getStatusDelta(existing.status);
    const newDelta = getStatusDelta(updates.status);
    const diffAttended = newDelta.attended - oldDelta.attended;
    const diffConducted = newDelta.conducted - oldDelta.conducted;
    const now = new Date().toISOString();

    let updatedSubject: Subject | undefined;

    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              status: updates.status,
              date: updates.date,
              notes: updates.notes?.trim() || undefined,
              updated_at: now,
            }
          : r
      )
    );

    if (diffAttended !== 0 || diffConducted !== 0) {
      setSubjects((prev) =>
        prev.map((s) => {
          if (s.id !== existing.subject_id) return s;
          const nextConducted = Math.max(0, s.conducted + diffConducted);
          const nextAttended = Math.min(
            nextConducted,
            Math.max(0, s.attended + diffAttended)
          );
          updatedSubject = {
            ...s,
            attended: nextAttended,
            conducted: nextConducted,
            updated_at: now,
          };
          return updatedSubject;
        })
      );
    }

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('attendance_records')
          .update({
            status: updates.status,
            date: updates.date,
            notes: updates.notes?.trim() || undefined,
            updated_at: now,
          })
          .eq('id', recordId);
        if (updatedSubject) await syncSubjectCountersToCloud(updatedSubject);
      } catch {
        // Ignore
      }
    }
  };

  const deleteRecord = async (recordId: string): Promise<void> => {
    const existing = records.find((r) => r.id === recordId);
    if (!existing) return;

    const delta = getStatusDelta(existing.status);
    const now = new Date().toISOString();
    let updatedSubject: Subject | undefined;

    setRecords((prev) => prev.filter((r) => r.id !== recordId));
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== existing.subject_id) return s;
        const nextConducted = Math.max(0, s.conducted - delta.conducted);
        const nextAttended = Math.min(
          nextConducted,
          Math.max(0, s.attended - delta.attended)
        );
        updatedSubject = {
          ...s,
          attended: nextAttended,
          conducted: nextConducted,
          updated_at: now,
        };
        return updatedSubject;
      })
    );

    if (isSupabaseConfigured) {
      try {
        await supabase.from('attendance_records').delete().eq('id', recordId);
        if (updatedSubject) await syncSubjectCountersToCloud(updatedSubject);
      } catch {
        // Ignore
      }
    }
  };

  const applyLeaveCountersToSubjects = async (leave: MedicalLeave) => {
    const now = new Date().toISOString();
    const updatedSubjectsList: Subject[] = [];

    setSubjects((prev) =>
      prev.map((s) => {
        const count = leave.subject_classes[s.id] ?? 0;
        if (count <= 0) return s;
        const impact = calculateMedicalSubjectImpact(
          s,
          count,
          leave.already_marked_absent,
          leave.policy_mode
        );
        const nextSub: Subject = {
          ...s,
          attended: impact.afterAttended,
          conducted: impact.afterConducted,
          updated_at: now,
        };
        updatedSubjectsList.push(nextSub);
        return nextSub;
      })
    );

    if (isSupabaseConfigured) {
      for (const s of updatedSubjectsList) {
        await syncSubjectCountersToCloud(s);
      }
    }
  };

  const addMedicalLeave = async (
    input: MedicalLeaveInput,
    applyImmediately = false
  ): Promise<MedicalLeave | null> => {
    if (!user) return null;
    const now = new Date().toISOString();
    const leave: MedicalLeave = {
      id: generateId('med'),
      user_id: user.id,
      title: input.title.trim() || 'Medical Leave',
      start_date: input.start_date,
      end_date: input.end_date,
      days_count: Math.max(1, Math.floor(input.days_count)),
      subject_classes: { ...input.subject_classes },
      already_marked_absent: input.already_marked_absent,
      policy_mode: input.policy_mode,
      status: applyImmediately ? 'approved' : input.status || 'planned',
      applied_to_records: applyImmediately,
      notes: input.notes?.trim() || undefined,
      created_at: now,
    };

    setMedicalLeaves((prev) => [leave, ...prev]);

    if (applyImmediately) {
      await applyLeaveCountersToSubjects(leave);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('medical_leaves').insert(leave);
      } catch {
        // Ignore
      }
    }

    return leave;
  };

  const updateMedicalLeave = async (
    id: string,
    updates: Partial<MedicalLeave>
  ): Promise<void> => {
    const now = new Date().toISOString();
    setMedicalLeaves((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates, updated_at: now } : m))
    );

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('medical_leaves')
          .update({ ...updates, updated_at: now })
          .eq('id', id);
      } catch {
        // Ignore
      }
    }
  };

  const deleteMedicalLeave = async (id: string): Promise<void> => {
    setMedicalLeaves((prev) => prev.filter((m) => m.id !== id));
    if (isSupabaseConfigured) {
      try {
        await supabase.from('medical_leaves').delete().eq('id', id);
      } catch {
        // Ignore
      }
    }
  };

  const applyMedicalLeaveToAttendance = async (id: string): Promise<void> => {
    const target = medicalLeaves.find((m) => m.id === id);
    if (!target || target.applied_to_records) return;

    await applyLeaveCountersToSubjects(target);
    await updateMedicalLeave(id, {
      status: 'approved',
      applied_to_records: true,
    });
  };

  const resetSampleData = async (): Promise<void> => {
    if (!user) return;
    const seed = createSeedData(user.id);
    setSubjects(seed.subjects);
    setRecords(seed.records);
    setMedicalLeaves(seed.medicalLeaves);
    saveLocalAttendanceData(user.id, seed.subjects, seed.records, seed.medicalLeaves);
  };

  const clearAllData = async (): Promise<void> => {
    if (!user) return;
    setSubjects([]);
    setRecords([]);
    setMedicalLeaves([]);
    saveLocalAttendanceData(user.id, [], [], []);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('attendance_records').delete().eq('user_id', user.id);
        await supabase.from('medical_leaves').delete().eq('user_id', user.id);
        await supabase.from('subjects').delete().eq('user_id', user.id);
      } catch {
        // Ignore
      }
    }
  };

  return (
    <AttendanceContext.Provider
      value={{
        subjects,
        records,
        medicalLeaves,
        overallStats,
        loading,
        addSubject,
        updateSubject,
        deleteSubject,
        markAttendance,
        quickIncrementAttendance,
        updateRecord,
        deleteRecord,
        addMedicalLeave,
        updateMedicalLeave,
        deleteMedicalLeave,
        applyMedicalLeaveToAttendance,
        resetSampleData,
        clearAllData,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export function useAttendance(): AttendanceContextValue {
  const ctx = useContext(AttendanceContext);
  if (!ctx) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return ctx;
}
