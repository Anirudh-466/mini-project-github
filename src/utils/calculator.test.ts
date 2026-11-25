import { describe, expect, it } from 'vitest';
import {
  aggregatePendingMedicalLeaves,
  analyzeSubject,
  calculateAttendancePercentage,
  calculateDaysInclusive,
  calculateMaxSkippableClasses,
  calculateMedicalOverallImpact,
  calculateMedicalSubjectImpact,
  calculateOverallStats,
  calculatePredictedAttendance,
  calculateRequiredClasses,
  getAttendanceStatus,
} from './calculator';
import { MedicalLeave, Subject } from '../types/attendance';

function makeSubject(overrides: Partial<Subject> = {}): Subject {
  return {
    id: 'sub-1',
    user_id: 'user-1',
    name: 'Computer Networks',
    code: 'CS301',
    conducted: 20,
    attended: 16,
    min_required_percentage: 75,
    target_percentage: 80,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('Attendance Mathematical Engine', () => {
  describe('calculateAttendancePercentage', () => {
    it('returns 0 when conducted or attended is <= 0', () => {
      expect(calculateAttendancePercentage(0, 0)).toBe(0);
      expect(calculateAttendancePercentage(0, 10)).toBe(0);
      expect(calculateAttendancePercentage(-2, 10)).toBe(0);
      expect(calculateAttendancePercentage(5, 0)).toBe(0);
    });

    it('calculates exact rounded percentage up to 100', () => {
      expect(calculateAttendancePercentage(16, 20)).toBe(80);
      expect(calculateAttendancePercentage(21, 24)).toBe(87.5);
      expect(calculateAttendancePercentage(12, 20)).toBe(60);
      expect(calculateAttendancePercentage(10, 10)).toBe(100);
      expect(calculateAttendancePercentage(12, 10)).toBe(100);
    });
  });

  describe('calculateMaxSkippableClasses', () => {
    it('returns 0 if below target or invalid inputs', () => {
      expect(calculateMaxSkippableClasses(12, 20, 75)).toBe(0);
      expect(calculateMaxSkippableClasses(0, 0, 75)).toBe(0);
      expect(calculateMaxSkippableClasses(10, 10, 0)).toBe(0);
    });

    it('uses epsilon guard for exact floating-point thresholds', () => {
      // 3/4 = 75%, at target 75% -> floor(100*3/75 - 4 + eps) = 0
      expect(calculateMaxSkippableClasses(3, 4, 75)).toBe(0);
      // 21/24 = 87.5%, at target 75% -> floor(28 - 24) = 4
      expect(calculateMaxSkippableClasses(21, 24, 75)).toBe(4);
      // 16/20 = 80%, at target 75% -> floor(21.333 - 20) = 1
      expect(calculateMaxSkippableClasses(16, 20, 75)).toBe(1);
      // 10/10 = 100%, at target 75% -> floor(13.333 - 10) = 3
      expect(calculateMaxSkippableClasses(10, 10, 75)).toBe(3);
      // 9/12 = 75%, epsilon prevents 8.9999999 -> floor=8 bug on 3/4 multiples
      expect(calculateMaxSkippableClasses(14, 20, 70)).toBe(0);
    });
  });

  describe('calculateRequiredClasses', () => {
    it('returns 0 when already meeting target', () => {
      expect(calculateRequiredClasses(16, 20, 75)).toEqual({
        required: 0,
        isImpossible: false,
      });
      expect(calculateRequiredClasses(15, 20, 75)).toEqual({
        required: 0,
        isImpossible: false,
      });
    });

    it('calculates exact consecutive classes needed', () => {
      // 12/20 = 60% -> need 12 consecutive to reach 24/32 = 75%
      expect(calculateRequiredClasses(12, 20, 75)).toEqual({
        required: 12,
        isImpossible: false,
      });
      // 6/10 = 60% -> need 6 consecutive to reach 12/16 = 75%
      expect(calculateRequiredClasses(6, 10, 75)).toEqual({
        required: 6,
        isImpossible: false,
      });
    });

    it('handles target >= 100 edge cases properly', () => {
      expect(calculateRequiredClasses(0, 0, 100).required).toBe(1);
      expect(calculateRequiredClasses(10, 10, 100)).toEqual({
        required: 0,
        isImpossible: false,
      });
      const impossible = calculateRequiredClasses(9, 10, 100);
      expect(impossible.required).toBe(Infinity);
      expect(impossible.isImpossible).toBe(true);
      expect(impossible.explanation).toBeTruthy();
    });
  });

  describe('calculatePredictedAttendance', () => {
    it('simulates future attended and missed classes', () => {
      expect(calculatePredictedAttendance(16, 20, 4, 0)).toBe(83.33);
      expect(calculatePredictedAttendance(16, 20, 0, 2)).toBe(72.73);
      expect(calculatePredictedAttendance(12, 20, 12, 0)).toBe(75);
    });
  });

  describe('getAttendanceStatus', () => {
    it('classifies all four attendance statuses accurately', () => {
      expect(getAttendanceStatus(85, 75, 80)).toBe('target_achieved');
      expect(getAttendanceStatus(80, 75, 80)).toBe('target_achieved');
      expect(getAttendanceStatus(76, 75, 80)).toBe('safe');
      expect(getAttendanceStatus(72, 75, 80)).toBe('near_target');
      expect(getAttendanceStatus(70, 75, 80)).toBe('near_target');
      expect(getAttendanceStatus(65, 75, 80)).toBe('below_target');
    });
  });

  describe('calculateOverallStats', () => {
    it('computes strict weighted attendance rather than unweighted mean', () => {
      const subjects: Subject[] = [
        makeSubject({ id: '1', name: 'CN', attended: 21, conducted: 24 }), // 87.5%
        makeSubject({ id: '2', name: 'DBMS', attended: 16, conducted: 20 }), // 80%
        makeSubject({ id: '3', name: 'ML', attended: 12, conducted: 20 }), // 60%
        makeSubject({ id: '4', name: 'OS Lab', attended: 10, conducted: 10 }), // 100%
      ];
      // Total attended = 59, total conducted = 74 => 79.73%
      const stats = calculateOverallStats(subjects);
      expect(stats.totalAttended).toBe(59);
      expect(stats.totalConducted).toBe(74);
      expect(stats.totalMissed).toBe(15);
      expect(stats.overallPercentage).toBe(79.73);
      expect(stats.achievedCount).toBe(3); // CN (87.5>=80), DBMS (80>=80), OS Lab (100>=80)
    });

    it('counts status buckets and extremes correctly', () => {
      const subjects: Subject[] = [
        makeSubject({ id: '1', name: 'A', attended: 21, conducted: 24 }), // 87.5 -> target_achieved
        makeSubject({ id: '2', name: 'B', attended: 15.5, conducted: 20 }), // 77.5 -> safe
        makeSubject({ id: '3', name: 'C', attended: 14, conducted: 20 }), // 70 -> near_target
        makeSubject({ id: '4', name: 'D', attended: 12, conducted: 20 }), // 60 -> below_target
      ];
      const stats = calculateOverallStats(subjects);
      expect(stats.achievedCount).toBe(1);
      expect(stats.safeCount).toBe(1);
      expect(stats.nearTargetCount).toBe(1);
      expect(stats.belowTargetCount).toBe(1);
      expect(stats.highestSubject?.subject.id).toBe('1');
      expect(stats.lowestSubject?.subject.id).toBe('4');
    });
  });

  describe('Medical Leave Calculations', () => {
    it('calculates inclusive calendar days accurately', () => {
      expect(calculateDaysInclusive('2026-11-10', '2026-11-12')).toBe(3);
      expect(calculateDaysInclusive('2026-11-10', '2026-11-10')).toBe(1);
      expect(calculateDaysInclusive('2026-11-12', '2026-11-10')).toBe(0);
    });

    it('calculates already-marked-absent medical impact under both policies', () => {
      const ml = makeSubject({ id: 'ml', name: 'ML', attended: 12, conducted: 20 });

      // credit_present: 12+4 / 20 = 16/20 = 80%
      const creditImpact = calculateMedicalSubjectImpact(ml, 4, true, 'credit_present');
      expect(creditImpact.effectiveMedicalClasses).toBe(4);
      expect(creditImpact.afterAttended).toBe(16);
      expect(creditImpact.afterConducted).toBe(20);
      expect(creditImpact.afterPercentage).toBe(80);
      expect(creditImpact.deltaPercentage).toBe(20);

      // exclude_conducted: 12 / (20-4) = 12/16 = 75%
      const excludeImpact = calculateMedicalSubjectImpact(
        ml,
        4,
        true,
        'exclude_conducted'
      );
      expect(excludeImpact.afterAttended).toBe(12);
      expect(excludeImpact.afterConducted).toBe(16);
      expect(excludeImpact.afterPercentage).toBe(75);
      expect(excludeImpact.deltaPercentage).toBe(15);

      // Clamp to conducted - attended (8)
      const clamped = calculateMedicalSubjectImpact(ml, 20, true, 'credit_present');
      expect(clamped.effectiveMedicalClasses).toBe(8);
      expect(clamped.afterPercentage).toBe(100);
    });

    it('calculates upcoming medical impact and drop prevented', () => {
      const ml = makeSubject({ id: 'ml', name: 'ML', attended: 16, conducted: 20 });
      const upcoming = calculateMedicalSubjectImpact(ml, 4, false, 'credit_present');
      expect(upcoming.afterAttended).toBe(20);
      expect(upcoming.afterConducted).toBe(24);
      expect(upcoming.afterPercentage).toBe(83.33);
      expect(upcoming.withoutMedicalPercentage).toBe(66.67); // 16/24
      expect(upcoming.preventedDropPercentage).toBe(16.66);
    });

    it('computes overall and aggregated pending medical leave impact', () => {
      const subjects: Subject[] = [
        makeSubject({ id: 'dbms', name: 'DBMS', attended: 16, conducted: 20 }),
        makeSubject({ id: 'ml', name: 'ML', attended: 12, conducted: 20 }),
      ];
      const overall = calculateMedicalOverallImpact(
        subjects,
        { dbms: 1, ml: 4 },
        true,
        'credit_present'
      );
      expect(overall.beforeAttended).toBe(28);
      expect(overall.beforeConducted).toBe(40);
      expect(overall.beforePercentage).toBe(70);
      expect(overall.afterAttended).toBe(33);
      expect(overall.afterConducted).toBe(40);
      expect(overall.afterPercentage).toBe(82.5);

      const leaves: MedicalLeave[] = [
        {
          id: 'med-1',
          user_id: 'u1',
          title: 'Viral Fever',
          start_date: '2026-11-10',
          end_date: '2026-11-12',
          days_count: 3,
          subject_classes: { dbms: 1, ml: 4 },
          already_marked_absent: true,
          policy_mode: 'credit_present',
          status: 'planned',
          applied_to_records: false,
          created_at: '2026-11-12T00:00:00.000Z',
        },
        {
          id: 'med-2',
          user_id: 'u1',
          title: 'Already Applied',
          start_date: '2026-10-01',
          end_date: '2026-10-01',
          days_count: 1,
          subject_classes: { ml: 2 },
          already_marked_absent: true,
          policy_mode: 'credit_present',
          status: 'approved',
          applied_to_records: true,
          created_at: '2026-10-01T00:00:00.000Z',
        },
      ];

      const agg = aggregatePendingMedicalLeaves(subjects, leaves);
      expect(agg.afterPercentage).toBe(82.5);
      expect(agg.subjectImpacts.length).toBe(2);
    });
  });

  describe('analyzeSubject', () => {
    it('returns complete next-class deltas and bunk analysis', () => {
      const analysis = analyzeSubject(
        makeSubject({ attended: 16, conducted: 20, min_required_percentage: 75, target_percentage: 80 })
      );
      expect(analysis.currentPercentage).toBe(80);
      expect(analysis.status).toBe('target_achieved');
      expect(analysis.maxSkippableMin).toBe(1);
      expect(analysis.ifAttendNext).toBe(80.95);
      expect(analysis.ifMissNext).toBe(76.19);
    });
  });
});
