import {
  AttendanceStatus,
  MedicalLeave,
  MedicalPolicyMode,
  Subject,
} from '../types/attendance';

const EPSILON = 1e-9;

export interface RequiredClassesResult {
  required: number;
  isImpossible: boolean;
  explanation?: string;
}

export interface SubjectAnalysis {
  currentPercentage: number;
  status: AttendanceStatus;
  maxSkippableMin: number;
  maxSkippableTarget: number;
  requiredForMin: RequiredClassesResult;
  requiredForTarget: RequiredClassesResult;
  ifAttendNext: number;
  ifMissNext: number;
  missed: number;
}

export interface SubjectExtreme {
  subject: Subject;
  percentage: number;
}

export interface OverallStats {
  totalConducted: number;
  totalAttended: number;
  totalMissed: number;
  overallPercentage: number;
  achievedCount: number;
  safeCount: number;
  nearTargetCount: number;
  belowTargetCount: number;
  totalSafeBunks: number;
  highestSubject: SubjectExtreme | null;
  lowestSubject: SubjectExtreme | null;
}

export interface MedicalSubjectImpact {
  subjectId: string;
  subjectName: string;
  subjectCode?: string;
  medicalClassesRequested: number;
  effectiveMedicalClasses: number;
  beforeAttended: number;
  beforeConducted: number;
  beforePercentage: number;
  afterAttended: number;
  afterConducted: number;
  afterPercentage: number;
  withoutMedicalPercentage: number;
  deltaPercentage: number;
  preventedDropPercentage: number;
  beforeAnalysis: SubjectAnalysis;
  afterAnalysis: SubjectAnalysis;
}

export interface MedicalOverallImpact {
  beforeAttended: number;
  beforeConducted: number;
  beforePercentage: number;
  afterAttended: number;
  afterConducted: number;
  afterPercentage: number;
  withoutMedicalPercentage: number;
  deltaPercentage: number;
  preventedDropPercentage: number;
  totalEffectiveClasses: number;
  subjectImpacts: MedicalSubjectImpact[];
}

export function calculateAttendancePercentage(
  attended: number,
  conducted: number
): number {
  if (!Number.isFinite(attended) || !Number.isFinite(conducted)) return 0;
  if (conducted <= 0 || attended <= 0) return 0;
  const pct = (attended / conducted) * 100;
  return Math.min(100, Math.max(0, Number(pct.toFixed(2))));
}

export function calculateMaxSkippableClasses(
  attended: number,
  conducted: number,
  targetPercentage: number
): number {
  if (
    !Number.isFinite(attended) ||
    !Number.isFinite(conducted) ||
    !Number.isFinite(targetPercentage)
  ) {
    return 0;
  }
  if (conducted <= 0 || attended <= 0 || targetPercentage <= 0) return 0;
  const currentPct = (attended / conducted) * 100;
  if (currentPct < targetPercentage - EPSILON) return 0;
  const raw = (100 * attended) / targetPercentage - conducted + EPSILON;
  return Math.max(0, Math.floor(raw));
}

export function calculateRequiredClasses(
  attended: number,
  conducted: number,
  targetPercentage: number
): RequiredClassesResult {
  if (
    !Number.isFinite(attended) ||
    !Number.isFinite(conducted) ||
    !Number.isFinite(targetPercentage)
  ) {
    return { required: 0, isImpossible: false };
  }

  if (targetPercentage <= 0) {
    return { required: 0, isImpossible: false };
  }

  if (targetPercentage >= 100) {
    if (conducted === 0) {
      return {
        required: 1,
        isImpossible: false,
        explanation: 'Attend your first class to achieve 100% attendance.',
      };
    }
    if (attended >= conducted) {
      return { required: 0, isImpossible: false };
    }
    return {
      required: Infinity,
      isImpossible: true,
      explanation:
        '100% attendance is mathematically impossible once any class has been missed.',
    };
  }

  const currentPct = conducted > 0 ? (attended / conducted) * 100 : 0;
  if (conducted > 0 && currentPct >= targetPercentage - EPSILON) {
    return { required: 0, isImpossible: false };
  }

  if (conducted === 0) {
    return {
      required: 1,
      isImpossible: false,
      explanation: 'Attend at least 1 class to establish your attendance percentage.',
    };
  }

  const numerator = targetPercentage * conducted - 100 * attended;
  const denominator = 100 - targetPercentage;
  const required = Math.max(0, Math.ceil(numerator / denominator - EPSILON));
  return { required, isImpossible: false };
}

export function calculatePredictedAttendance(
  attended: number,
  conducted: number,
  futureAttended: number,
  futureMissed: number
): number {
  const safeAttended = Math.max(0, attended) + Math.max(0, futureAttended);
  const safeConducted =
    Math.max(0, conducted) + Math.max(0, futureAttended) + Math.max(0, futureMissed);
  return calculateAttendancePercentage(safeAttended, safeConducted);
}

export function getAttendanceStatus(
  currentPercentage: number,
  minRequiredPercentage: number,
  targetPercentage: number
): AttendanceStatus {
  const effectiveTarget = Math.max(minRequiredPercentage, targetPercentage);
  if (currentPercentage >= effectiveTarget - EPSILON) {
    return 'target_achieved';
  }
  if (currentPercentage >= minRequiredPercentage - EPSILON) {
    return 'safe';
  }
  if (currentPercentage >= minRequiredPercentage - 5 - EPSILON) {
    return 'near_target';
  }
  return 'below_target';
}

export function analyzeSubject(
  subject: Pick<
    Subject,
    'attended' | 'conducted' | 'min_required_percentage' | 'target_percentage'
  >
): SubjectAnalysis {
  const attended = Math.max(0, Math.floor(subject.attended));
  const conducted = Math.max(attended, Math.floor(subject.conducted));
  const minReq = subject.min_required_percentage;
  const target = subject.target_percentage;

  const currentPercentage = calculateAttendancePercentage(attended, conducted);
  const status = getAttendanceStatus(currentPercentage, minReq, target);
  const maxSkippableMin = calculateMaxSkippableClasses(attended, conducted, minReq);
  const maxSkippableTarget = calculateMaxSkippableClasses(attended, conducted, target);
  const requiredForMin = calculateRequiredClasses(attended, conducted, minReq);
  const requiredForTarget = calculateRequiredClasses(attended, conducted, target);
  const ifAttendNext = calculatePredictedAttendance(attended, conducted, 1, 0);
  const ifMissNext = calculatePredictedAttendance(attended, conducted, 0, 1);

  return {
    currentPercentage,
    status,
    maxSkippableMin,
    maxSkippableTarget,
    requiredForMin,
    requiredForTarget,
    ifAttendNext,
    ifMissNext,
    missed: Math.max(0, conducted - attended),
  };
}

export function calculateOverallStats(subjects: Subject[]): OverallStats {
  let totalConducted = 0;
  let totalAttended = 0;
  let achievedCount = 0;
  let safeCount = 0;
  let nearTargetCount = 0;
  let belowTargetCount = 0;
  let totalSafeBunks = 0;
  let highestSubject: SubjectExtreme | null = null;
  let lowestSubject: SubjectExtreme | null = null;

  for (const subject of subjects) {
    const conducted = Math.max(0, subject.conducted);
    const attended = Math.min(conducted, Math.max(0, subject.attended));
    totalConducted += conducted;
    totalAttended += attended;

    const analysis = analyzeSubject(subject);
    totalSafeBunks += analysis.maxSkippableMin;

    switch (analysis.status) {
      case 'target_achieved':
        achievedCount += 1;
        break;
      case 'safe':
        safeCount += 1;
        break;
      case 'near_target':
        nearTargetCount += 1;
        break;
      case 'below_target':
        belowTargetCount += 1;
        break;
    }

    if (conducted > 0) {
      if (!highestSubject || analysis.currentPercentage > highestSubject.percentage) {
        highestSubject = { subject, percentage: analysis.currentPercentage };
      }
      if (!lowestSubject || analysis.currentPercentage < lowestSubject.percentage) {
        lowestSubject = { subject, percentage: analysis.currentPercentage };
      }
    }
  }

  return {
    totalConducted,
    totalAttended,
    totalMissed: Math.max(0, totalConducted - totalAttended),
    overallPercentage: calculateAttendancePercentage(totalAttended, totalConducted),
    achievedCount,
    safeCount,
    nearTargetCount,
    belowTargetCount,
    totalSafeBunks,
    highestSubject,
    lowestSubject,
  };
}

function parseIsoDateUtc(dateStr: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = Date.UTC(year, month - 1, day);
  const check = new Date(utc);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return utc;
}

export function calculateDaysInclusive(startDate: string, endDate: string): number {
  const startMs = parseIsoDateUtc(startDate);
  const endMs = parseIsoDateUtc(endDate);
  if (startMs === null || endMs === null || endMs < startMs) return 0;
  return Math.floor((endMs - startMs) / 86_400_000) + 1;
}

export function calculateMedicalSubjectImpact(
  subject: Subject,
  medicalClasses: number,
  alreadyMarkedAbsent: boolean,
  policyMode: MedicalPolicyMode
): MedicalSubjectImpact {
  const attended = Math.max(0, Math.floor(subject.attended));
  const conducted = Math.max(attended, Math.floor(subject.conducted));
  const requested = Math.max(0, Math.floor(medicalClasses));

  const beforePercentage = calculateAttendancePercentage(attended, conducted);
  const beforeAnalysis = analyzeSubject(subject);

  let effectiveM = 0;
  let afterAttended = attended;
  let afterConducted = conducted;
  let withoutMedicalPercentage = beforePercentage;

  if (alreadyMarkedAbsent) {
    effectiveM = Math.min(requested, Math.max(0, conducted - attended));
    if (policyMode === 'credit_present') {
      afterAttended = attended + effectiveM;
      afterConducted = conducted;
    } else {
      afterAttended = attended;
      afterConducted = Math.max(attended, conducted - effectiveM);
    }
    withoutMedicalPercentage = beforePercentage;
  } else {
    effectiveM = requested;
    if (policyMode === 'credit_present') {
      afterAttended = attended + effectiveM;
      afterConducted = conducted + effectiveM;
    } else {
      afterAttended = attended;
      afterConducted = conducted;
    }
    withoutMedicalPercentage = calculateAttendancePercentage(
      attended,
      conducted + effectiveM
    );
  }

  const afterPercentage = calculateAttendancePercentage(afterAttended, afterConducted);
  const afterAnalysis = analyzeSubject({
    ...subject,
    attended: afterAttended,
    conducted: afterConducted,
  });

  const deltaPercentage = Number((afterPercentage - beforePercentage).toFixed(2));
  const preventedDropPercentage = Number(
    (afterPercentage - withoutMedicalPercentage).toFixed(2)
  );

  return {
    subjectId: subject.id,
    subjectName: subject.name,
    subjectCode: subject.code,
    medicalClassesRequested: requested,
    effectiveMedicalClasses: effectiveM,
    beforeAttended: attended,
    beforeConducted: conducted,
    beforePercentage,
    afterAttended,
    afterConducted,
    afterPercentage,
    withoutMedicalPercentage,
    deltaPercentage,
    preventedDropPercentage,
    beforeAnalysis,
    afterAnalysis,
  };
}

export function calculateMedicalOverallImpact(
  subjects: Subject[],
  subjectClasses: Record<string, number>,
  alreadyMarkedAbsent: boolean,
  policyMode: MedicalPolicyMode
): MedicalOverallImpact {
  let beforeAttended = 0;
  let beforeConducted = 0;
  let afterAttended = 0;
  let afterConducted = 0;
  let withoutMedicalConducted = 0;
  let totalEffectiveClasses = 0;
  const subjectImpacts: MedicalSubjectImpact[] = [];

  for (const subject of subjects) {
    const requested = Math.max(0, Math.floor(subjectClasses[subject.id] ?? 0));
    const impact = calculateMedicalSubjectImpact(
      subject,
      requested,
      alreadyMarkedAbsent,
      policyMode
    );

    beforeAttended += impact.beforeAttended;
    beforeConducted += impact.beforeConducted;
    afterAttended += impact.afterAttended;
    afterConducted += impact.afterConducted;
    withoutMedicalConducted += alreadyMarkedAbsent
      ? impact.beforeConducted
      : impact.beforeConducted + impact.effectiveMedicalClasses;
    totalEffectiveClasses += impact.effectiveMedicalClasses;

    if (requested > 0) {
      subjectImpacts.push(impact);
    }
  }

  const beforePercentage = calculateAttendancePercentage(
    beforeAttended,
    beforeConducted
  );
  const afterPercentage = calculateAttendancePercentage(
    afterAttended,
    afterConducted
  );
  const withoutMedicalPercentage = calculateAttendancePercentage(
    beforeAttended,
    withoutMedicalConducted
  );

  return {
    beforeAttended,
    beforeConducted,
    beforePercentage,
    afterAttended,
    afterConducted,
    afterPercentage,
    withoutMedicalPercentage,
    deltaPercentage: Number((afterPercentage - beforePercentage).toFixed(2)),
    preventedDropPercentage: Number(
      (afterPercentage - withoutMedicalPercentage).toFixed(2)
    ),
    totalEffectiveClasses,
    subjectImpacts,
  };
}

export function aggregatePendingMedicalLeaves(
  subjects: Subject[],
  medicalLeaves: MedicalLeave[]
): MedicalOverallImpact {
  const pendingLeaves = medicalLeaves.filter((leave) => !leave.applied_to_records);

  const runningSubjects = subjects.map((subject) => ({ ...subject }));
  const subjectMap = new Map<string, Subject>(
    runningSubjects.map((s) => [s.id, s])
  );

  const initialBeforeAttended = subjects.reduce(
    (sum, s) => sum + Math.max(0, Math.floor(s.attended)),
    0
  );
  const initialBeforeConducted = subjects.reduce(
    (sum, s) => sum + Math.max(0, Math.floor(s.conducted)),
    0
  );
  let withoutMedicalConducted = initialBeforeConducted;
  let totalEffectiveClasses = 0;

  for (const leave of pendingLeaves) {
    for (const [subjectId, count] of Object.entries(leave.subject_classes || {})) {
      const subject = subjectMap.get(subjectId);
      const requested = Math.max(0, Math.floor(count || 0));
      if (!subject || requested <= 0) continue;

      const impact = calculateMedicalSubjectImpact(
        subject,
        requested,
        leave.already_marked_absent,
        leave.policy_mode
      );

      subject.attended = impact.afterAttended;
      subject.conducted = impact.afterConducted;
      totalEffectiveClasses += impact.effectiveMedicalClasses;

      if (!leave.already_marked_absent) {
        withoutMedicalConducted += impact.effectiveMedicalClasses;
      }
    }
  }

  let afterAttended = 0;
  let afterConducted = 0;
  const subjectImpacts: MedicalSubjectImpact[] = [];

  for (const orig of subjects) {
    const updated = subjectMap.get(orig.id)!;
    const origAtt = Math.max(0, Math.floor(orig.attended));
    const origCond = Math.max(origAtt, Math.floor(orig.conducted));
    const updAtt = Math.max(0, Math.floor(updated.attended));
    const updCond = Math.max(updAtt, Math.floor(updated.conducted));

    afterAttended += updAtt;
    afterConducted += updCond;

    const totalRequestedForSubject = pendingLeaves.reduce(
      (sum, leave) => sum + Math.max(0, Math.floor(leave.subject_classes?.[orig.id] ?? 0)),
      0
    );

    if (totalRequestedForSubject > 0) {
      const beforePercentage = calculateAttendancePercentage(origAtt, origCond);
      const afterPercentage = calculateAttendancePercentage(updAtt, updCond);
      const upcomingRequested = pendingLeaves.reduce(
        (sum, leave) =>
          !leave.already_marked_absent
            ? sum + Math.max(0, Math.floor(leave.subject_classes?.[orig.id] ?? 0))
            : sum,
        0
      );
      const withoutMedicalPercentage = calculateAttendancePercentage(
        origAtt,
        origCond + upcomingRequested
      );
      subjectImpacts.push({
        subjectId: orig.id,
        subjectName: orig.name,
        subjectCode: orig.code,
        medicalClassesRequested: totalRequestedForSubject,
        effectiveMedicalClasses: totalRequestedForSubject,
        beforeAttended: origAtt,
        beforeConducted: origCond,
        beforePercentage,
        afterAttended: updAtt,
        afterConducted: updCond,
        afterPercentage,
        withoutMedicalPercentage,
        deltaPercentage: Number((afterPercentage - beforePercentage).toFixed(2)),
        preventedDropPercentage: Number(
          (afterPercentage - withoutMedicalPercentage).toFixed(2)
        ),
        beforeAnalysis: analyzeSubject(orig),
        afterAnalysis: analyzeSubject(updated),
      });
    }
  }

  const beforePercentage = calculateAttendancePercentage(
    initialBeforeAttended,
    initialBeforeConducted
  );
  const afterPercentage = calculateAttendancePercentage(
    afterAttended,
    afterConducted
  );
  const withoutMedicalPercentage = calculateAttendancePercentage(
    initialBeforeAttended,
    withoutMedicalConducted
  );

  return {
    beforeAttended: initialBeforeAttended,
    beforeConducted: initialBeforeConducted,
    beforePercentage,
    afterAttended,
    afterConducted,
    afterPercentage,
    withoutMedicalPercentage,
    deltaPercentage: Number((afterPercentage - beforePercentage).toFixed(2)),
    preventedDropPercentage: Number(
      (afterPercentage - withoutMedicalPercentage).toFixed(2)
    ),
    totalEffectiveClasses,
    subjectImpacts,
  };
}
