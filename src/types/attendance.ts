export type AttendanceStatus =
  | 'safe'
  | 'near_target'
  | 'below_target'
  | 'target_achieved';

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  code?: string;
  faculty?: string;
  conducted: number;
  attended: number;
  min_required_percentage: number;
  target_percentage: number;
  created_at: string;
  updated_at?: string;
}

export type RecordStatus = 'present' | 'absent' | 'medical' | 'cancelled';

export interface AttendanceRecord {
  id: string;
  user_id: string;
  subject_id: string;
  date: string; // YYYY-MM-DD
  status: RecordStatus;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export type MedicalPolicyMode = 'credit_present' | 'exclude_conducted';

export type MedicalLeaveStatus = 'planned' | 'applied' | 'approved';

export interface MedicalLeave {
  id: string;
  user_id: string;
  title: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  days_count: number;
  subject_classes: Record<string, number>;
  already_marked_absent: boolean;
  policy_mode: MedicalPolicyMode;
  status: MedicalLeaveStatus;
  applied_to_records?: boolean;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  college_name?: string;
  default_min_attendance: number;
  preferred_theme: 'light' | 'dark' | 'system';
  created_at: string;
}
